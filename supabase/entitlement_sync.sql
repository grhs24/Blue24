-- LAUNCH-ONLY: gate cross-device sync behind a paid/comped entitlement.
--
-- ⚠️  DO NOT RUN THIS DURING BETA. While Foothold Now is free for everyone,
--     running this file would immediately cut sync off for every beta user
--     (their sub_status is 'none'), breaking saved-progress sync. Apply it
--     ONLY when the paid tier goes live, and only if you decide sync should be
--     a paid feature. Sync is intentionally open to all signed-in users today.
--
-- What it does: replaces the open "own row" policies on user_progress with ones
-- that ALSO require the signed-in user to be entitled — comped, or holding an
-- active/trialing subscription. sub_status and is_comped stay writable ONLY by
-- the service-role webhook and by you in the dashboard, so the browser still
-- cannot grant itself entitlement.
--
-- To UNDO (reopen sync to every signed-in user), just re-run
-- supabase/user_progress.sql, which restores the plain own-row policies.

-- Server-side entitlement check. SECURITY DEFINER so it reads profiles
-- regardless of the caller's RLS; STABLE so the planner can reuse it.
create or replace function public.is_entitled()
returns boolean
security definer
set search_path = public
stable
language sql
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and (is_comped or sub_status in ('active', 'on_trial'))
  );
$$;

revoke all on function public.is_entitled() from public;
grant execute on function public.is_entitled() to authenticated;

-- Re-create the three user_progress policies WITH the entitlement requirement.
drop policy if exists "read own progress" on public.user_progress;
create policy "read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id and public.is_entitled());

drop policy if exists "insert own progress" on public.user_progress;
create policy "insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id and public.is_entitled());

drop policy if exists "update own progress" on public.user_progress;
create policy "update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id and public.is_entitled())
  with check (auth.uid() = user_id and public.is_entitled());
