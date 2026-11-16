-- Xero Payroll (Pro): connect a business to its Xero organisation, match staff
-- to Xero employees, and send approved hours as draft timesheets.

-- What the manager can see about their connection. Written only by Edge Functions.
create table if not exists public.xero_connections (
  business_id   uuid primary key references public.businesses (id) on delete cascade,
  tenant_id     text not null,
  tenant_name   text,
  connection_id text,
  connected_at  timestamptz not null default now(),
  last_sent_at  timestamptz
);
alter table public.xero_connections enable row level security;
drop policy if exists "owner reads own xero connection" on public.xero_connections;
create policy "owner reads own xero connection" on public.xero_connections
  for select to authenticated using (business_id = (select private.my_business_id()));
revoke all on public.xero_connections from anon;
revoke insert, update, delete on public.xero_connections from authenticated;
grant select on public.xero_connections to authenticated;

-- Xero tokens, encrypted by the Edge Functions (AES-GCM). No policies and no
-- grants: only the service role (Edge Functions) can read or write them.
create table if not exists public.xero_tokens (
  business_id   uuid primary key references public.businesses (id) on delete cascade,
  access_token  text not null,
  refresh_token text not null,
  expires_at    timestamptz not null,
  updated_at    timestamptz not null default now()
);
alter table public.xero_tokens enable row level security;
revoke all on public.xero_tokens from anon, authenticated;

-- Which Xero employee each staff member is.
alter table public.staff add column if not exists xero_employee_id text;

-- When a week's hours were last sent to Xero.
alter table public.rosters add column if not exists xero_sent_at timestamptz;
