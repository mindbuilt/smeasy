-- Plans: Free (up to 6 staff), Core ($29/month or $290/year + GST, unlimited
-- staff) and Pro ($49/$490 + GST, adds payroll sync; not on sale yet).

-- Billing rows can now be core or pro, monthly or annual. Test-mode "pro"
-- subscriptions from the old single paid plan become Core.
do $body$
declare c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.billing'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%plan%'
  loop
    execute format('alter table public.billing drop constraint %I', c);
  end loop;
end $body$;

update public.billing set plan = 'core' where plan = 'pro';

alter table public.billing
  add constraint billing_plan_check check (plan in ('free', 'core', 'pro'));

alter table public.billing
  add column if not exists billing_interval text check (billing_interval in ('month', 'year'));

-- Free plan staff limit, checked in the database as well as the app.
-- Off during early access: change v_enforce to true at launch (together with
-- STAFF_LIMIT_ENFORCED in src/lib/site.ts).
create or replace function private.check_staff_limit()
returns trigger
language plpgsql security definer set search_path = '' as $body$
declare
  v_enforce boolean := false;
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
    raise exception 'The Free plan is for up to % staff. Upgrade to Core for unlimited staff.', v_limit
      using errcode = 'P0001';
  end if;
  return new;
end $body$;

drop trigger if exists staff_limit on public.staff;
create trigger staff_limit
  before insert or update of active on public.staff
  for each row execute function private.check_staff_limit();
