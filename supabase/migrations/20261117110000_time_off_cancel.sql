-- Time off: a repeat request for the same dates returns the existing pending request (no duplicates),
-- and staff can cancel their own pending requests from their personal link.

create or replace function public.request_time_off(
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

  -- Same dates already waiting: return that request rather than adding another.
  select id into v_id from public.time_off
   where staff_id = v_staff.id and status = 'pending' and start_date = p_start and end_date = p_end
   limit 1;
  if found then
    return v_id;
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

create or replace function public.cancel_time_off(p_token uuid, p_id uuid)
returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_staff public.staff;
begin
  select * into v_staff from public.staff where roster_token = p_token and active;
  if not found then
    raise exception 'invalid link' using errcode = '28000';
  end if;
  -- Only this person's own pending requests can be cancelled.
  delete from public.time_off
   where id = p_id and staff_id = v_staff.id and status = 'pending';
end $$;

revoke execute on function public.cancel_time_off(uuid, uuid) from public;
grant  execute on function public.cancel_time_off(uuid, uuid) to anon, authenticated;
