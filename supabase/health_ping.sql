-- Lightweight database ping for the "health" Edge Function.
-- Run once in Supabase → SQL Editor → New query → Run.
--
-- health_ping() just returns 1. It reads no tables and no customer data;
-- calling it is a real database query, so an uptime monitor hitting the
-- health function keeps a free-tier project awake without touching anything
-- customer-related. Only the service_role (used by the Edge Function) may
-- execute it.

create or replace function public.health_ping()
returns integer
language sql
stable
as $$ select 1 $$;

revoke all on function public.health_ping() from public, anon, authenticated;
grant execute on function public.health_ping() to service_role;
