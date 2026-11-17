-- Moving a shift to another person or day in a week whose hours are reopened is now logged
-- in hours_changes (kind 'moved'), with the week's reopen reason, like worked-time changes.
-- Moves in an approved week are still blocked (edit hours first).

alter table public.hours_changes drop constraint if exists hours_changes_kind_check;
alter table public.hours_changes add constraint hours_changes_kind_check check (kind in ('reopened', 'changed', 'moved'));

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

  if (new.staff_id is distinct from old.staff_id or new.date is distinct from old.date) and r.hours_approved_at is null then
    select name into v_name from public.staff where id = new.staff_id;
    insert into public.hours_changes (business_id, roster_id, shift_id, person, shift_date, kind, reason, before, after, changed_by)
    values (new.business_id, new.roster_id, new.id, v_name, new.date, 'moved',
      (select reason from public.hours_changes where roster_id = r.id and kind = 'reopened' order by changed_at desc limit 1),
      jsonb_build_object('staff_id', old.staff_id, 'date', old.date),
      jsonb_build_object('staff_id', new.staff_id, 'date', new.date),
      auth.uid());
  end if;
  return new;
end $body$;

drop trigger if exists shifts_record on public.shifts;
create trigger shifts_record
  before update or delete on public.shifts
  for each row execute function private.on_shift_record();
