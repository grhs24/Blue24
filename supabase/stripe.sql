-- Stripe billing add-on for an existing Foothold Pro schema.
-- Run this in the Supabase SQL editor if you set up `profiles` before adding
-- Stripe (a fresh schema.sql already includes the column). Safe to re-run.
--
-- The Stripe webhook (supabase/functions/stripe-webhook) binds a Stripe
-- customer to a Supabase user here once, at checkout, so later subscription
-- lifecycle events—which carry only the customer id—can find the right row.
-- Only the service-role webhook writes this column; users never see it (the
-- profiles select policy already limits each user to their own row).

alter table public.profiles
  add column if not exists stripe_customer_id text;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id);
