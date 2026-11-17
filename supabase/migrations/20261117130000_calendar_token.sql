-- Calendar feeds use their own read-only token, not the personal link.
-- Anyone with a calendar URL can see that person's shifts, but can't change emails or request time off.
-- Subscriptions made with the old personal-link URL stop working: re-add the calendar link once.

alter table public.staff add column if not exists calendar_token uuid not null default gen_random_uuid();
create unique index if not exists staff_calendar_token_key on public.staff (calendar_token);

create or replace function public.get_staff_calendar(p_token uuid)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_staff    public.staff;
  v_business public.businesses;
  v_today    date;
begin
  select * into v_staff from public.staff where calendar_token = p_token and active;
  if not found then
    return null;
  end if;
  select * into v_business from public.businesses where id = v_staff.business_id;
  v_today := (now() at time zone v_business.timezone)::date;

  return jsonb_build_object(
    'business',   v_business.name,
    'timezone',   v_business.timezone,
    'staff_name', v_staff.name,
    'shifts', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', sh.id, 'date', sh.date, 'start_time', sh.start_time,
               'end_time', sh.end_time, 'break_minutes', sh.break_minutes,
               'role', sh.role, 'notes', sh.notes, 'updated', r.published_at)
             order by sh.date, sh.start_time)
        from public.shifts sh join public.rosters r on r.id = sh.roster_id
       where sh.staff_id = v_staff.id and r.status = 'published'
         and sh.date between v_today - 28 and v_today + 84), '[]'::jsonb)
  );
end $$;

-- The calendar token, for the staff page (shown only to whoever holds the personal link).
create or replace function public.get_calendar_token(p_token uuid)
returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  v_token uuid;
begin
  select calendar_token into v_token from public.staff where roster_token = p_token and active;
  return v_token;
end $$;

-- Replaces the calendar token: old calendar links stop working. The personal link is unchanged.
create or replace function public.reset_calendar_token(p_token uuid)
returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_token uuid;
begin
  update public.staff set calendar_token = gen_random_uuid()
   where roster_token = p_token and active
  returning calendar_token into v_token;
  return v_token;
end $$;

revoke execute on function public.get_calendar_token(uuid) from public;
revoke execute on function public.reset_calendar_token(uuid) from public;
grant  execute on function public.get_calendar_token(uuid) to anon, authenticated;
grant  execute on function public.reset_calendar_token(uuid) to anon, authenticated;
