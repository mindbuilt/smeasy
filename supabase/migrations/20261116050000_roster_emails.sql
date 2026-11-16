-- Roster emails: staff get their shifts by email when a week is published
-- (sent by the notify-roster Edge Function through Resend). Staff can add
-- their own email and turn the emails off from their personal link.

alter table public.staff
  add column if not exists email_roster boolean not null default true;

-- Staff link: set your own email (blank clears it).
create or replace function public.set_my_email(p_token uuid, p_email text)
returns boolean
language plpgsql security definer set search_path = '' as $body$
declare
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'That email address doesn''t look right' using errcode = 'P0001';
  end if;
  update public.staff set email = v_email, email_roster = true
   where roster_token = p_token and active;
  return found;
end $body$;

-- Staff link and the "Stop roster emails" link in every email.
create or replace function public.set_roster_emails(p_token uuid, p_on boolean)
returns boolean
language plpgsql security definer set search_path = '' as $body$
begin
  update public.staff set email_roster = coalesce(p_on, false)
   where roster_token = p_token;
  return found;
end $body$;

revoke execute on function public.set_my_email(uuid, text) from public;
revoke execute on function public.set_roster_emails(uuid, boolean) from public;
grant  execute on function public.set_my_email(uuid, text) to anon, authenticated;
grant  execute on function public.set_roster_emails(uuid, boolean) to anon, authenticated;

-- Staff link data now includes their email settings (their own row only).
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
    'email',      v_staff.email,
    'email_roster', v_staff.email_roster,
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
