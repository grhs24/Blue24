-- Product usage events: a privacy-minimized count of how many people genuinely
-- begin using Foothold Now, keyed by an anonymous (or permanent) Supabase user.
-- Run this in the Supabase SQL editor. Safe to re-run.
--
-- The app inserts one row the first time a guest saves the first step of a
-- ladder (event_name 'ladder_started'); see ensureTrackingUser /
-- trackProductEvent in index.html. Anonymous Supabase users are created lazily
-- at that moment and use the Postgres `authenticated` role.
--
-- PRIVACY: this table stores NO user-entered content. Never insert ladder
-- names, step text, notes, SUDS/difficulty ratings, practice responses,
-- diagnoses, symptoms, search terms, backups, emails, or any health
-- information. event_key is an opaque, random identifier (the ladder's random
-- UUID) used only for per-ladder de-duplication — it is not derived from any
-- title or user text.

create table if not exists public.product_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null,
  event_key text not null,
  created_at timestamptz not null default now(),

  constraint product_events_allowed_event_names
    check (
      event_name in (
        'ladder_started',
        'ladder_completed',
        'practice_logged',
        'account_converted'
      )
    ),

  -- one row per (user, event, key): makes inserts idempotent so a repeated
  -- ladder_started for the same ladder is a harmless no-op
  constraint product_events_unique_event
    unique (user_id, event_name, event_key)
);

-- Helpful for the owner-only aggregate queries below.
create index if not exists product_events_created_at_idx
  on public.product_events (created_at);

alter table public.product_events enable row level security;

-- INSERT: a signed-in user (anonymous OR permanent email) may insert only rows
-- attributed to their own uid. Restricted to the `authenticated` role, so the
-- unauthenticated public `anon` role can insert nothing. There are deliberately
-- NO select/update/delete policies for clients: browsers cannot read or modify
-- analytics. Inspect results as the owner via the SQL editor (the service role
-- bypasses RLS), never from the app.
drop policy if exists "insert own product event" on public.product_events;
create policy "insert own product event"
  on public.product_events for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
