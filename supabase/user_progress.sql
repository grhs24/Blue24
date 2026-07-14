-- Foothold Now — cross-device progress sync.
-- Paste this whole file into your Supabase project: SQL Editor → New query → Run.
-- Safe to re-run (everything is IF NOT EXISTS / idempotent).

-- One row per user holding the full app snapshot (same JSON shape a Backup
-- download produces). Keyed by the signed-in user's id.
create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row-level security: with RLS on and these three policies, a signed-in user
-- can read and write ONLY the row whose user_id equals their own auth id.
-- Everyone else (including the anonymous/publishable key with no user) is
-- denied by default.
alter table public.user_progress enable row level security;

drop policy if exists "read own progress" on public.user_progress;
create policy "read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists "insert own progress" on public.user_progress;
create policy "insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own progress" on public.user_progress;
create policy "update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
