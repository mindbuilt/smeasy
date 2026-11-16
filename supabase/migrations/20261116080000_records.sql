-- Time records (Fair Work record-keeping support; the employer remains responsible).
-- 1. Employment type per person (Xero's EmploymentBasis: FULLTIME / PARTTIME / CASUAL).
-- 2. Approving a week freezes its worked times, so later roster edits can't change them.
-- 3. Approved hours can't be deleted, and changes after approval need a reason and are
--    kept in hours_changes (who, when, before -> after, reason): records may only be
--    altered to correct an error.

alter table public.staff
  add column if not exists employment_basis text check (employment_basis in ('full_time', 'part_time', 'casual'));

alter table public.rosters
  add column if not exists hours_first_approved_at timestamptz,  -- never cleared once set
  add column if not exists reopen_reason text check (length(reopen_reason) <= 300);

create table if not exists public.hours_changes (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  roster_id   uuid not null references public.rosters (id) on delete cascade,
  shift_id    uuid,
  person      text,
  shift_date  date,
  kind        text not null check (kind in ('reopened', 'changed')),
  reason      text,
  before      jsonb,
  after       jsonb,
  changed_by  uuid,
  changed_at  timestamptz not null default now()
);
create index if not exists hours_changes_roster_idx on public.hours_changes (roster_id);
alter table public.hours_changes enable row level security;
drop policy if exists "owner reads own hours changes" on public.hours_changes;
create policy "owner reads own hours changes" on public.hours_changes
  for select to authenticated using (business_id = (select private.my_business_id()));
revoke all on public.hours_changes from anon;
revoke insert, update, delete on public.hours_changes from authenticated;
grant select on public.hours_changes to authenticated;

-- Approving: stamp the first approval and freeze worked times (fill actuals from the roster).
-- Reopening an approved week: needs a reason, which is logged.
create or replace function private.on_roster_hours()
returns trigger
language plpgsql security definer set search_path = '' as $body$
begin
  if new.hours_approved_at is not null and old.hours_approved_at is null then
    new.hours_first_approved_at := coalesce(old.hours_first_approved_at, new.hours_approved_at);
    new.reopen_reason := null;
    update public.shifts
       set actual_start = coalesce(actual_start, start_time),
           actual_end = coalesce(actual_end, end_time),
           actual_break_minutes = coalesce(actual_break_minutes, break_minutes)
     where roster_id = new.id;
  elsif new.hours_approved_at is null and old.hours_approved_at is not null then
    if coalesce(trim(new.reopen_reason), '') = '' then
      raise exception 'Say why you are changing approved hours' using errcode = 'P0002';
    end if;
    insert into public.hours_changes (business_id, roster_id, kind, reason, changed_by)
    values (new.business_id, new.id, 'reopened', trim(new.reopen_reason), auth.uid());
  end if;
  return new;
end $body$;

drop trigger if exists rosters_hours on public.rosters;
create trigger rosters_hours
  before update of hours_approved_at on public.rosters
  for each row execute function private.on_roster_hours();

-- Shifts in a week whose hours have ever been approved:
--  * can't be deleted (mark "Didn't work" instead);
--  * can't move to another person or day while the week is approved;
--  * changes to worked times are logged with the week's reopen reason.
create or replace function private.on_shift_record()
returns trigger
language plpgsql security definer set search_path = '' as $body$
declare
  r public.rosters;
  v_name text;
begin
  select * into r from public.rosters where id = coalesce(old.roster_id, new.roster_id);
  if r.hours_first_approved_at is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'DELETE' then
    raise exception 'This shift is part of approved hours, so it can''t be deleted. Mark it as Didn''t work on the Hours page instead.' using errcode = 'P0003';
  end if;

  if r.hours_approved_at is not null and (new.staff_id is distinct from old.staff_id or new.date is distinct from old.date) then
    raise exception 'This week''s hours are approved. Edit hours on the Hours page first.' using errcode = 'P0003';
  end if;

  if (new.actual_start, new.actual_end, new.actual_break_minutes, new.no_show)
     is distinct from (old.actual_start, old.actual_end, old.actual_break_minutes, old.no_show)
     and r.hours_approved_at is null then
    select name into v_name from public.staff where id = new.staff_id;
    insert into public.hours_changes (business_id, roster_id, shift_id, person, shift_date, kind, reason, before, after, changed_by)
    values (new.business_id, new.roster_id, new.id, v_name, new.date, 'changed',
      (select reason from public.hours_changes where roster_id = r.id and kind = 'reopened' order by changed_at desc limit 1),
      jsonb_build_object('start', old.actual_start, 'end', old.actual_end, 'break', old.actual_break_minutes, 'no_show', old.no_show),
      jsonb_build_object('start', new.actual_start, 'end', new.actual_end, 'break', new.actual_break_minutes, 'no_show', new.no_show),
      auth.uid());
  end if;
  return new;
end $body$;

drop trigger if exists shifts_record on public.shifts;
create trigger shifts_record
  before update or delete on public.shifts
  for each row execute function private.on_shift_record();
