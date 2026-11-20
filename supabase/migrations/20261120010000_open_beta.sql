-- Open beta (2026-11-20): every business gets everything, so the staff limit is off,
-- and managers can send feedback from the app (the `feedback` Edge Function).
-- When billing starts, set v_enforce back to true (and OPEN_BETA false in src/lib/site.ts
-- and supabase/functions/xero/index.ts).

-- 1. No staff limit during the beta.
create or replace function private.check_staff_limit()
returns trigger
language plpgsql security definer set search_path = '' as $body$
declare
  v_enforce boolean := false; -- open beta: no staff limit
  v_limit   integer := 6;
  v_paid    boolean;
  v_count   integer;
begin
  if not v_enforce or not new.active then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.active then
    return new; -- edits to someone already active
  end if;

  select exists (
    select 1 from public.billing
     where business_id = new.business_id and plan in ('core', 'pro')
  ) into v_paid;
  if v_paid then
    return new;
  end if;

  select count(*) into v_count from public.staff
   where business_id = new.business_id and active and id <> new.id;
  if v_count >= v_limit then
    raise exception 'The Free plan is for up to % staff. Upgrade to Plus for unlimited staff.', v_limit
      using errcode = 'P0001';
  end if;
  return new;
end $body$;

-- 2. Beta feedback. Written only by the feedback Edge Function (service role); managers can't read or write it directly.
create table if not exists public.beta_feedback (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  kind            text not null check (kind in ('bug', 'idea')),
  message         text not null check (char_length(message) between 1 and 5000),
  user_id         uuid references auth.users (id) on delete set null,
  user_email      text,
  business_id     uuid references public.businesses (id) on delete set null,
  business_name   text,
  page_url        text,
  user_agent      text,
  viewport        text,
  diagnostics     jsonb not null default '[]'::jsonb,
  screenshot_path text,
  emailed         boolean not null default false
);
alter table public.beta_feedback enable row level security;
revoke all on public.beta_feedback from anon, authenticated;

-- 3. Private bucket for feedback screenshots (2 MB max, images only). Only the service role reads or writes it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('beta-feedback', 'beta-feedback', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
