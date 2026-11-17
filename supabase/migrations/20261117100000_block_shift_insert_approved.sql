-- Shifts can't be added to a week whose hours are approved (reopen the week first).
-- Reopened weeks still accept new shifts, as before.

create or replace function private.on_shift_insert_guard()
returns trigger
language plpgsql security definer set search_path = '' as $body$
declare
  r public.rosters;
begin
  select * into r from public.rosters where id = new.roster_id;
  if r.hours_approved_at is not null then
    raise exception 'This week''s hours are approved. Reopen the week on the Hours page to add shifts.' using errcode = 'P0003';
  end if;
  return new;
end $body$;

drop trigger if exists shifts_insert_guard on public.shifts;
create trigger shifts_insert_guard
  before insert on public.shifts
  for each row execute function private.on_shift_insert_guard();
