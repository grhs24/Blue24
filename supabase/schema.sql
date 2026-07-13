-- Foothold Pro database schema.
-- Paste this whole file into the Supabase SQL editor (SQL → New query → Run)
-- on a fresh project. Safe to re-run: everything is IF NOT EXISTS / OR REPLACE.

-- One row per user: who they are and whether they're entitled to Pro.
-- sub_status is written ONLY by the Lemon Squeezy webhook (service role).
-- is_comped is written ONLY by you, by hand, in the Table Editor — the
-- webhook never touches it. Set it true on your own row for permanent Pro.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  sub_status text not null default 'none',
  is_comped boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);
-- No insert/update/delete policies on purpose: users can only read their row.
-- Writes happen via the signup trigger below and the service-role webhook.

-- One row per user: the whole app snapshot (same shape as a Backup download).
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "read own data" on public.user_data;
create policy "read own data"
  on public.user_data for select
  using (auth.uid() = user_id);

drop policy if exists "insert own data" on public.user_data;
create policy "insert own data"
  on public.user_data for insert
  with check (auth.uid() = user_id);

drop policy if exists "update own data" on public.user_data;
create policy "update own data"
  on public.user_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create a profile row automatically the first time someone signs in.
create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
