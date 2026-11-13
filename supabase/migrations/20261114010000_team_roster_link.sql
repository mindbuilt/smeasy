-- One shareable link per business (for the staff group chat) that shows the
-- PUBLISHED roster for a week: names, days, times and roles only — no rates,
-- contact details or payroll IDs. Personal links (staff.roster_token) remain
-- the way to request time off.

alter table public.businesses
  add column team_token uuid not null unique default gen_random_uuid();

create function public.get_team_roster(p_token uuid, p_week date default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_business public.businesses;
  v_week     date;
  v_roster   public.rosters;
begin
  select * into v_business from public.businesses where team_token = p_token;
  if not found then
    return null;
  end if;

  v_week := date_trunc('week',
              coalesce(p_week, (now() at time zone v_business.timezone)::date))::date;

  select * into v_roster from public.rosters
   where business_id = v_business.id and week_start = v_week and status = 'published';

  return jsonb_build_object(
    'business',   v_business.name,
    'week_start', v_week,
    'published',  v_roster.id is not null,
    'staff', case when v_roster.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(distinct st.name)
        from public.shifts sh join public.staff st on st.id = sh.staff_id
       where sh.roster_id = v_roster.id), '[]'::jsonb) end,
    'shifts', case when v_roster.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', sh.id, 'date', sh.date, 'start_time', sh.start_time,
               'end_time', sh.end_time, 'break_minutes', sh.break_minutes,
               'role', sh.role, 'staff_name', st.name)
             order by sh.date, sh.start_time, st.name)
        from public.shifts sh join public.staff st on st.id = sh.staff_id
       where sh.roster_id = v_roster.id), '[]'::jsonb) end
  );
end $$;

revoke execute on function public.get_team_roster(uuid, date) from public;
grant  execute on function public.get_team_roster(uuid, date) to anon, authenticated;
