-- Roster at a glance: unfilled shifts, shift notes, day notes, business state
-- (for public holidays), and a staff calendar feed.

-- ── Schema ──────────────────────────────────────────────────────────────────

alter table public.businesses
  add column state text check (state in ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'));

-- A shift with no staff member is "unfilled" (a gap to fill). The composite
-- foreign key (staff_id, business_id) is only checked when staff_id is set.
alter table public.shifts alter column staff_id drop not null;
alter table public.shifts add column notes text check (length(notes) <= 200);

create table public.day_notes (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  date        date not null,
  note        text not null check (length(trim(note)) > 0 and length(note) <= 200),
  created_at  timestamptz not null default now(),
  unique (business_id, date)
);
create index day_notes_business_idx on public.day_notes (business_id);

alter table public.day_notes enable row level security;
create policy "owner manages day notes" on public.day_notes
  for all to authenticated
  using (business_id = (select private.my_business_id()))
  with check (business_id = (select private.my_business_id()));
revoke all on public.day_notes from anon;

-- ── Staff-facing functions (published rosters only; unfilled shifts hidden) ──

create or replace function public.get_team_roster(p_token uuid, p_week date default null)
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
end $$;

create or replace function public.get_staff_roster(p_token uuid, p_week date default null)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
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

  v_week := date_trunc('week',
              coalesce(p_week, (now() at time zone v_business.timezone)::date))::date;

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
end $$;

-- Calendar feed source: one person's published shifts from 4 weeks ago to
-- 12 weeks ahead. Used by the staff-calendar edge function (.ics feed).
create function public.get_staff_calendar(p_token uuid)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_staff    public.staff;
  v_business public.businesses;
  v_today    date;
begin
  select * into v_staff from public.staff where roster_token = p_token and active;
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

revoke execute on function public.get_staff_calendar(uuid) from public;
grant  execute on function public.get_staff_calendar(uuid) to anon, authenticated;
