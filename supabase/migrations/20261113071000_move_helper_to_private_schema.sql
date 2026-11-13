-- Keep the RLS helper out of the exposed API schema (not callable via /rpc).
-- Policies reference the function by OID, so they keep working after the move.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
alter function public.my_business_id() set schema private;
