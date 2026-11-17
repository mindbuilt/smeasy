-- Changing or removing a staff email keeps their roster-email choice. Only the first address switches emails on.
create or replace function public.set_my_email(p_token uuid, p_email text)
returns boolean
language plpgsql security definer set search_path = '' as $body$
declare
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
  if v_email is not null and (length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
    raise exception 'That email address doesn''t look right' using errcode = 'P0001';
  end if;
  update public.staff
     set email_roster = case when email is null then true else email_roster end,
         email = v_email
   where roster_token = p_token and active;
  return found;
end $body$;
