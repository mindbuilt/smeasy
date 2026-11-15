-- Week start day: each business chooses which day its roster week starts on
-- (ISO day numbers, 1 = Monday ... 7 = Sunday). Monday stays the default.

alter table public.businesses
  add column if not exists week_start_day smallint not null default 1 check (week_start_day between 1 and 7);

-- Weeks no longer have to start on a Monday (drop the Monday-only check, whatever it's called).
do $body$
declare c text;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.rosters'::regclass and contype = 'c'
              and pg_get_constraintdef(oid) ilike '%isodow%'
  loop
    execute format('alter table public.rosters drop constraint %I', c);
  end loop;
end $body$;

-- The start of the week containing p_date, for a week that starts on p_dow.
create or replace function private.week_start_of(p_date date, p_dow smallint)
returns date
language sql immutable set search_path = '' as $body$
  select p_date - ((extract(isodow from p_date)::int - p_dow + 7) % 7)
$body$;

-- Change the owner's week start day and regroup existing shifts into the new
-- weeks. A new week is published only if every shift in it came from a
-- published week; otherwise it's a draft to check and publish again.
-- Returns how many weeks went back to draft that had published shifts in them.
create or replace function public.set_week_start_day(p_day smallint)
returns integer
language plpgsql security definer set search_path = '' as $body$
declare
  v_business uuid := private.my_business_id();
  v_old      smallint;
  v_redrafted integer := 0;
  v_old_ids  uuid[];
begin
  if v_business is null then
    raise exception 'No business';
  end if;
  if p_day is null or p_day < 1 or p_day > 7 then
    raise exception 'Day must be 1 (Monday) to 7 (Sunday)';
  end if;

  select week_start_day into v_old from public.businesses where id = v_business for update;
  if v_old = p_day then
    return 0;
  end if;

  update public.businesses set week_start_day = p_day where id = v_business;

  -- Weeks that will end up as drafts even though some of their shifts were published.
  select count(*) into v_redrafted from (
    select 1
      from public.shifts sh join public.rosters r on r.id = sh.roster_id
     where sh.business_id = v_business
     group by private.week_start_of(sh.date, p_day)
    having bool_or(r.status = 'published') and not bool_and(r.status = 'published')
  ) w;

  -- Old rosters all start on the old day, so the new week starts can't collide with them.
  v_old_ids := array(select id from public.rosters where business_id = v_business);

  insert into public.rosters (business_id, week_start, status)
    select v_business, private.week_start_of(sh.date, p_day),
           case when bool_and(r.status = 'published') then 'published' else 'draft' end
      from public.shifts sh join public.rosters r on r.id = sh.roster_id
     where sh.business_id = v_business
     group by private.week_start_of(sh.date, p_day);

  update public.shifts sh
     set roster_id = r.id
    from public.rosters r
   where sh.business_id = v_business
     and r.business_id = v_business
     and r.week_start = private.week_start_of(sh.date, p_day);

  -- Now empty, so deleting them can't cascade to any shift.
  delete from public.rosters where id = any(v_old_ids);

  return v_redrafted;
end $body$;

revoke execute on function public.set_week_start_day(smallint) from public, anon;
grant  execute on function public.set_week_start_day(smallint) to authenticated;

-- ── Staff-facing functions: use the business's week ─────────────────────────

create or replace function public.get_team_roster(p_token uuid, p_week date default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $body$
declare
  v_business public.businesses;
  v_week     date;
  v_roster   public.rosters;
begin
  select * into v_business from public.businesses where team_token = p_token;
  if not found then
    return null;
  end if;

  v_week := private.week_start_of(
              coalesce(p_week, (now() at time zone v_business.timezone)::date), v_business.week_start_day);

  select * into v_roster from public.rosters
   where business_id = v_business.id and week_start = v_week and status = 'published';

  return jsonb_build_object(
    'business',   v_business.name,
    'state',      v_business.state,
    'roles',      to_jsonb(v_business.roles),
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
               'role', sh.role, 'notes', sh.notes, 'staff_name', st.name)
             order by sh.date, sh.start_time, st.name)
        from public.shifts sh join public.staff st on st.id = sh.staff_id
       where sh.roster_id = v_roster.id), '[]'::jsonb) end,
    'day_notes', case when v_roster.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('date', dn.date, 'note', dn.note) order by dn.date)
        from public.day_notes dn
       where dn.business_id = v_business.id and dn.date between v_week and v_week + 6), '[]'::jsonb) end
  );
end $body$;

create or replace function public.get_staff_roster(p_token uuid, p_week date default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $body$
declare
  v_staff    public.staff;
  v_business public.businesses;
  v_week     date;
  v_roster   public.rosters;
begin
  select * into v_staff from public.staff where roster_token = p_token and active;
  if not found then
    return null;
  end if;

  select * into v_business from public.businesses where id = v_staff.business_id;

  v_week := private.week_start_of(
              coalesce(p_week, (now() at time zone v_business.timezone)::date), v_business.week_start_day);

  select * into v_roster from public.rosters
   where business_id = v_business.id and week_start = v_week and status = 'published';

  return jsonb_build_object(
    'business',   v_business.name,
    'state',      v_business.state,
    'roles',      to_jsonb(v_business.roles),
    'staff_id',   v_staff.id,
    'staff_name', v_staff.name,
    'week_start', v_week,
    'published',  v_roster.id is not null,
    'shifts', case when v_roster.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', sh.id, 'date', sh.date, 'start_time', sh.start_time,
               'end_time', sh.end_time, 'break_minutes', sh.break_minutes,
               'role', sh.role, 'notes', sh.notes, 'staff_name', st.name,
               'mine', sh.staff_id = v_staff.id)
             order by sh.date, sh.start_time)
        from public.shifts sh join public.staff st on st.id = sh.staff_id
       where sh.roster_id = v_roster.id), '[]'::jsonb) end,
    'day_notes', case when v_roster.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object('date', dn.date, 'note', dn.note) order by dn.date)
        from public.day_notes dn
       where dn.business_id = v_business.id and dn.date between v_week and v_week + 6), '[]'::jsonb) end,
    'time_off', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'start_date', t.start_date, 'end_date', t.end_date,
               'reason', t.reason, 'status', t.status)
             order by t.start_date desc)
        from public.time_off t
       where t.staff_id = v_staff.id and t.end_date >= v_week - 28), '[]'::jsonb)
  );
end $body$;
