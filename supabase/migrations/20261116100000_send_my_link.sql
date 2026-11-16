-- "Email me my personal link" on the team roster link: remember when a link was
-- last sent so the button can't be used to flood someone's inbox.
alter table public.staff add column if not exists link_sent_at timestamptz;
