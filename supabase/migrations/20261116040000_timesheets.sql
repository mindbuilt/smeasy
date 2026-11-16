-- Timesheets: the hours people actually worked. The actual_* fields are null
-- while a shift was worked as rostered; the manager changes only what differed.
-- Approving a week stamps the roster. Staff-facing functions never return these.
alter table public.shifts
  add column if not exists actual_start time,
  add column if not exists actual_end time,
  add column if not exists actual_break_minutes integer check (actual_break_minutes between 0 and 240),
  add column if not exists no_show boolean not null default false;

alter table public.rosters
  add column if not exists hours_approved_at timestamptz;
