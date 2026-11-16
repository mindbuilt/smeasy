-- Open beta (2026-11-16): the Free plan's 6-staff limit is on. Businesses
-- already over 6 keep everyone; they just can't add or bring back more until
-- they upgrade. Matches STAFF_LIMIT_ENFORCED in src/lib/site.ts.
create or replace function private.check_staff_limit()
returns trigger
language plpgsql security definer set search_path = '' as $body$
declare
  v_enforce boolean := true;
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
