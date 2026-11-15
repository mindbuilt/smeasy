-- Billing (Stripe). One row per business, written only by the stripe-webhook and
-- billing Edge Functions (service role). Owners can read their own row but never
-- write it, so nobody can make themselves Pro through the API. That's why this is
-- its own table: owners can update every column of public.businesses.

create table public.billing (
  business_id            uuid primary key references public.businesses (id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan                   text not null default 'free' check (plan in ('free', 'pro')),
  status                 text,          -- Stripe subscription status: active, past_due, canceled, ...
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  updated_at             timestamptz not null default now()
);

alter table public.billing enable row level security;

create policy "owner reads own billing" on public.billing
  for select to authenticated
  using (business_id = (select private.my_business_id()));

-- No insert/update/delete policies: only the service role (Edge Functions) writes.
revoke all on public.billing from anon;
revoke insert, update, delete on public.billing from authenticated;
grant select on public.billing to authenticated;
