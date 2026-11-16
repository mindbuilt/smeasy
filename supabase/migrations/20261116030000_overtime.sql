-- Usual weekly hours per person. The roster quietly shows when someone is
-- rostered above them. 38 is a standard full-time week; set part-timers to
-- their agreed hours. SMEasy doesn't work out overtime or penalty pay.
alter table public.staff
  add column if not exists max_weekly_hours numeric(4, 1) not null default 38
  check (max_weekly_hours > 0 and max_weekly_hours <= 100);
