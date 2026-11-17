-- The last Xero send's results per person, so the Hours page still shows them after a reload.
alter table public.rosters add column if not exists xero_results jsonb;
