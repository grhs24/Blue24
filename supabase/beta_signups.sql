-- Beta signups: who joined while Foothold Now was free (beta), so they can be
-- offered the 50%-off launch coupon later. Run this in the Supabase SQL editor.
-- Safe to re-run.
--
-- The app inserts one row per user the first time they're signed in while
-- GATE.mode is 'beta' (see recordBetaSignup in index.html). It is insert-only
-- for the owner and never updated or deleted by users. At launch, query this
-- table (or join it against profiles.email) to hand out coupon codes.

create table if not exists public.beta_signups (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  joined_at timestamptz not null default now()
);

alter table public.beta_signups enable row level security;

-- A signed-in user may record only their own signup, and read only their own
-- row. No update/delete policies: the list is append-only from the client.
drop policy if exists "insert own beta signup" on public.beta_signups;
create policy "insert own beta signup"
  on public.beta_signups for insert
  with check (auth.uid() = id);

drop policy if exists "read own beta signup" on public.beta_signups;
create policy "read own beta signup"
  on public.beta_signups for select
  using (auth.uid() = id);
