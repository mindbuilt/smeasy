-- Smeasy v1 rostering schema
--
-- Managers sign in with Supabase Auth (magic link). One owner per business.
-- Staff never sign in: each staff row has a private roster_token, and the
-- staff page calls the two SECURITY DEFINER functions at the bottom of this
-- file, which only ever expose PUBLISHED rosters for that token's business.

-- ── Tables ──────────────────────────────────────────────────────────────────

create table public.businesses (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null unique default auth.uid()
                     references auth.users (id) on delete cascade,
  name             text not null check (length(trim(name)) > 0),
  timezone         text not null default 'Australia/Sydney',
  roles            text[] not null default
                     array['Floor', 'Kitchen', 'Barista', 'Bar', 'Manager', 'Other'],
  payroll_settings jsonb,            -- filled in at first export
  created_at       timestamptz not null default now()
);

create table public.staff (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null check (length(trim(name)) > 0),
  mobile       text,
  email        text,
  default_role text,
  payroll_id   text,
  hourly_rate  numeric(8, 2) check (hourly_rate >= 0),
  active       boolean not null default true,
  roster_token uuid not null unique default gen_random_uuid(),  -- private staff link
  created_at   timestamptz not null default now(),
  unique (id, business_id),
  unique (business_id, payroll_id)
);

create table public.rosters (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  week_start   date not null check (extract(isodow from week_start) = 1),  -- Monday
  status       text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (business_id, week_start),
  unique (id, business_id)
);

-- Multiple shifts per person per day are allowed (split shifts).
-- end_time earlier than start_time means the shift finishes after midnight.
create table public.shifts (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  roster_id     uuid not null,
  staff_id      uuid not null,
  date          date not null,
  start_time    time not null,
  end_time      time not null check (end_time <> start_time),
  break_minutes integer not null default 0 check (break_minutes between 0 and 240),
  role          text,
  created_at    timestamptz not null default now(),
  -- composite keys stop a shift pointing at another business's roster or staff
  foreign key (roster_id, business_id) references public.rosters (id, business_id) on delete cascade,
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade
);

create table public.time_off (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  staff_id    uuid not null,
  start_date  date not null,
  end_date    date not null,
  reason      text not null default '' check (length(reason) <= 500),
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'declined')),
  created_at  timestamptz not null default now(),
  check (end_date >= start_date),
  foreign key (staff_id, business_id) references public.staff (id, business_id) on delete cascade
);

create index staff_business_idx    on public.staff (business_id);
create index rosters_business_idx  on public.rosters (business_id);
create index shifts_roster_idx     on public.shifts (roster_id);
create index shifts_staff_idx      on public.shifts (staff_id);
create index shifts_business_idx   on public.shifts (business_id);
create index time_off_staff_idx    on public.time_off (staff_id);
create index time_off_business_idx on public.time_off (business_id);

-- Stamp published_at when a roster is published.
create function public.set_published_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;

create trigger rosters_set_published_at
  before insert or update of status on public.rosters
  for each row execute function public.set_published_at();

-- ── Row Level Security: managers see only their own business ───────────────

-- SECURITY DEFINER so policies can look up the business without recursing
-- through the businesses table's own RLS.
create function public.my_business_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select id from public.businesses where owner_id = auth.uid()
$$;

revoke execute on function public.my_business_id() from public, anon;
grant  execute on function public.my_business_id() to authenticated;

alter table public.businesses enable row level security;
alter table public.staff      enable row level security;
alter table public.rosters    enable row level security;
alter table public.shifts     enable row level security;
alter table public.time_off   enable row level security;

create policy "owner manages own business" on public.businesses
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "owner manages staff" on public.staff
  for all to authenticated
  using (business_id = (select public.my_business_id()))
  with check (business_id = (select public.my_business_id()));

create policy "owner manages rosters" on public.rosters
  for all to authenticated
  using (business_id = (select public.my_business_id()))
  with check (business_id = (select public.my_business_id()));

create policy "owner manages shifts" on public.shifts
  for all to authenticated
  using (business_id = (select public.my_business_id()))
  with check (business_id = (select public.my_business_id()));

create policy "owner manages time off" on public.time_off
  for all to authenticated
  using (business_id = (select public.my_business_id()))
  with check (business_id = (select public.my_business_id()));

-- Anonymous visitors get no direct table access at all (defence in depth).
revoke all on public.businesses, public.staff, public.rosters,
              public.shifts, public.time_off from anon;

-- ── Staff link functions (no login) ────────────────────────────────────────

-- Returns the published roster for the week containing p_week (default: this
-- week in the business's timezone), or {"published": false}. Returns null if
-- the token is unknown or the staff member is inactive.
create function public.get_staff_roster(p_token uuid, p_week date default null)
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
    'staff_id',   v_staff.id,
    'staff_name', v_staff.name,
    'week_start', v_week,
    'published',  v_roster.id is not null,
    'shifts', case when v_roster.id is null then '[]'::jsonb else coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', sh.id, 'date', sh.date, 'start_time', sh.start_time,
               'end_time', sh.end_time, 'break_minutes', sh.break_minutes,
               'role', sh.role, 'staff_name', st.name,
               'mine', sh.staff_id = v_staff.id)
             order by sh.date, sh.start_time)
        from public.shifts sh join public.staff st on st.id = sh.staff_id
       where sh.roster_id = v_roster.id), '[]'::jsonb) end,
    'time_off', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'start_date', t.start_date, 'end_date', t.end_date,
               'reason', t.reason, 'status', t.status)
             order by t.start_date desc)
        from public.time_off t
       where t.staff_id = v_staff.id and t.end_date >= v_week - 28), '[]'::jsonb)
  );
end $$;

create function public.request_time_off(
  p_token uuid, p_start date, p_end date, p_reason text default ''
) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_staff public.staff;
  v_id    uuid;
begin
  select * into v_staff from public.staff where roster_token = p_token and active;
  if not found then
    raise exception 'invalid link' using errcode = '28000';
  end if;
  if p_end < p_start then
    raise exception 'end date is before start date' using errcode = '22023';
  end if;
  if p_start < current_date - 1 or p_end > current_date + 365 then
    raise exception 'dates must be within the next year' using errcode = '22023';
  end if;
  if (select count(*) from public.time_off
       where staff_id = v_staff.id and status = 'pending') >= 20 then
    raise exception 'too many pending requests' using errcode = '22023';
  end if;

  insert into public.time_off (business_id, staff_id, start_date, end_date, reason)
  values (v_staff.business_id, v_staff.id, p_start, p_end,
          left(coalesce(trim(p_reason), ''), 500))
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.get_staff_roster(uuid, date)            from public;
revoke execute on function public.request_time_off(uuid, date, date, text) from public;
grant  execute on function public.get_staff_roster(uuid, date)            to anon, authenticated;
grant  execute on function public.request_time_off(uuid, date, date, text) to anon, authenticated;
