# Turning Foothold Now into a paid product

> **Current state (already live in `index.html`):** email sign-in — a 6-digit
> **code** (best on iPhone / Home Screen apps) *and* the magic **link**, both
> from one email — plus cross-device sync for **every signed-in user**, stored
> in the `user_progress` table (see `supabase/user_progress.sql`). This is free
> sync, not a paywall. The rest of this document describes an *optional future*
> paid tier (Lemon Squeezy billing, Pro gating via the `profiles`/`user_data`
> tables and the webhook) that is **not** wired into the current app. Treat it
> as a roadmap, not a description of what ships today.

## Email sign-in: show the 6-digit code (required for code sign-in)

The app sends the code with `signInWithOtp` (via `POST /auth/v1/otp`) and
verifies it with `verifyOtp` (via `POST /auth/v1/verify`, `type: "email"`) —
no SDK, just fetch, so it works under the artifact's strict CSP. For the code
to appear in the email, the template must include `{{ .Token }}` (the default
only has the magic link).

In Supabase → **Authentication → Email Templates → "Magic Link"**, replace the
body with something like:

```html
<h2>Sign in to Foothold Now</h2>
<p>Enter this code in the app:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px;font-family:monospace">{{ .Token }}</p>
<p>This code expires in 1 hour and can be used once.</p>
<p>Or, on the same device, tap to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to Foothold Now</a></p>
```

Keeping `{{ .ConfirmationURL }}` means the tap-to-sign-in link still works for
anyone who prefers it. New users (first sign-in) get the **"Confirm signup"**
template instead — add the same `{{ .Token }}` block there if you want code
sign-in to work for brand-new accounts too. Optionally tune **Authentication →
Providers → Email → OTP Expiry** if an hour isn't what you want.

The repo already contains everything code-shaped. What remains is creating
accounts and pasting keys. Nothing here affects the free version: with the
`SYNC` config left empty, the app has no sign-in button, makes no network
calls, and behaves exactly as it always has.

## What's already built

- **`index.html`** — the whole app, plus a dormant account/sync layer.
  It activates only when `SYNC.url` and `SYNC.anonKey` (search for
  `var SYNC =` in the file) are filled in. When active it provides:
  email magic-link sign-in, a Sign in / Account button in the header,
  cross-device sync of the full app snapshot (push on every change,
  debounced; safe auto-pull on sign-in), an Upgrade button that opens the
  Lemon Squeezy checkout with the user's id attached, and Pro gating —
  sync runs only when `is_comped` is true or `sub_status` is
  `active`/`on_trial`. It talks to Supabase's REST API with plain `fetch`;
  no libraries.
- **`supabase/schema.sql`** — the `profiles` and `user_data` tables,
  row-level security so each user can only touch their own rows, and a
  trigger that creates a profile on first sign-in.
- **`supabase/functions/lemonsqueezy-webhook/index.ts`** — the one piece of
  backend: verifies Lemon Squeezy's signature and updates
  `profiles.sub_status`. It never reads or writes `is_comped`, so a comped
  account can never be downgraded by billing events. It receives payment
  news; it cannot charge anyone.

## Go-live checklist (in order)

1. **Supabase** (free tier): create a project, then
   - SQL editor → paste and run `supabase/schema.sql`.
   - Authentication → Providers → enable Email; magic links are on by
     default. Authentication → URL Configuration → set Site URL to your
     Pages domain (this is where magic links land).
   - Project Settings → API → copy the project URL and anon key into
     `SYNC` in `index.html` (only on the paid deployment — see step 2).
2. **Cloudflare Pages** (free tier, commercial use allowed): connect this
   repo. To keep the repo's `SYNC` empty (so the free/artifact build stays
   clean), set the Pages build command to inject the values from
   environment variables:
   `sed -i "s|url: ''|url: '$SUPABASE_URL'|; s|anonKey: ''|anonKey: '$SUPABASE_ANON_KEY'|; s|checkoutUrl: ''|checkoutUrl: '$CHECKOUT_URL'|; s|annualCheckoutUrl: ''|annualCheckoutUrl: '$ANNUAL_CHECKOUT_URL'|" index.html`
   with build output directory `/`. Add the env vars (`SUPABASE_URL`,
   `SUPABASE_ANON_KEY`, `CHECKOUT_URL`, `ANNUAL_CHECKOUT_URL`) in the Pages
   dashboard. Attach your domain (~$10–12/year, Cloudflare Registrar or
   Porkbun).
3. **Lemon Squeezy**: create a store (they review it before live payments),
   add a product with a monthly subscription variant, copy its hosted
   checkout link into the `CHECKOUT_URL` env var. The app appends
   `checkout[email]` and `checkout[custom][user_id]` automatically — the
   custom user_id is how the webhook knows whose row to update.
4. **Webhook**: install the Supabase CLI, then
   `supabase functions deploy lemonsqueezy-webhook --no-verify-jwt` and
   `supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=<a long random string>`.
   In Lemon Squeezy → Settings → Webhooks: point at the function URL,
   paste the same secret, select the `subscription_*` events. Test mode
   lets you run a fake purchase end-to-end before going live.
5. **Your own free Pro access**: sign in once on the paid site, then in
   Supabase's Table Editor open `profiles`, find your row, set
   `is_comped = true`. Permanent Pro; invisible to billing; the webhook
   can't touch it. Same trick comps beta testers later.
6. **Email sender** (later, before real users): Supabase's built-in email
   is rate-limited to a few messages an hour — fine for testing. Add a
   custom SMTP sender (Resend has a free tier) under Authentication →
   Emails when you want reliable magic links.

## Billing with Stripe (alternative to Lemon Squeezy)

Steps 3–4 above use Lemon Squeezy. If you bill with **Stripe** instead, the
repo already has the matching backend: `supabase/functions/stripe-webhook`.
Everything else (Supabase, Pages, the gate, `is_comped` comps) is identical —
you swap which webhook you deploy and which checkout link goes in
`CHECKOUT_URL`. Pick one provider; don't run both.

1. **Product & prices**: Stripe Dashboard → Product catalog → add ONE product
   ("Foothold Now Pro") carrying TWO recurring prices — monthly ($4.99) and
   yearly ($39.99). Add a free trial if you want one. Keep both on the same
   product so a single 50%-off coupon applies to either. Checkout opens against
   these fixed Stripe price IDs; the browser never sends an amount, so price and
   plan stay authoritative server-side. Put the monthly link in `CHECKOUT_URL`
   and the yearly link in `ANNUAL_CHECKOUT_URL`, then add a second "Start yearly"
   button in `renderGate()` pointing at `GATE.annualCheckoutUrl`.
2. **Column**: if your `profiles` table predates Stripe, run
   `supabase/stripe.sql` once (a fresh `schema.sql` already has the
   `stripe_customer_id` column).
3. **Checkout link**: create a **Payment Link** for that price, and turn on
   **"Allow promotion codes"** (so beta users can enter their coupon). Put the
   link in the `CHECKOUT_URL` env var. So the webhook knows whose row to
   update, the checkout must carry the Supabase user id:
   - append `?client_reference_id=<user_id>` to the link, **and**
   - set the subscription metadata `user_id = <user_id>` (Payment Link →
     subscription settings → metadata, or pass it when you create a Checkout
     Session in code).
   Metadata is what every later renewal/cancel event carries, so it's the
   reliable key. **Still to wire at launch:** the gate currently links to
   `GATE.checkoutUrl` as-is, so make the user sign in *before* checkout and
   append their id to the link (or create the Checkout Session server-side with
   the id). Simplest is to lead the paid flow with sign-in, then subscribe.
4. **Webhook**: `supabase functions deploy stripe-webhook --no-verify-jwt`, then
   Stripe → Developers → Webhooks → add an endpoint at the function URL and
   subscribe to `checkout.session.completed` and the `customer.subscription.*`
   events. Copy that endpoint's signing secret and
   `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`. The function verifies
   Stripe's signature, maps `trialing → on_trial` and `canceled → cancelled`
   (the words the app's gating already understands), and updates only
   `sub_status`. Use Test mode to run a purchase end-to-end before going live.

Keeping both webhook files in the repo is fine — only the one you deploy runs.

## Beta users and the 50%-off launch coupon

While `GATE.mode` is `'beta'`, the app records every signed-in user in the
`beta_signups` table (run `supabase/beta_signups.sql` once; it's insert-only
under RLS, so a user can only add their own row). This is the list of people to
reward at launch. The beta welcome gate tells users they get **50% off** if they
sign in with their email now, and the paid wall reminds them to add their coupon
at checkout.

**Don't use one shared code.** A single `BETA50` is trivial to pass around, so
non-beta users would ride the discount too. Instead issue **one unique,
single-use code per beta user**, so a leaked code burns itself out after one
redemption.

**Both plans, one coupon.** Because the coupon isn't tied to a specific price,
each beta code works whether the user picks the $4.99/mo or the $39.99/yr plan —
a beta user who chooses yearly still gets their 50% off. Pick the coupon
**duration** deliberately: `once` gives 50% off the first invoice (about $20 off
year one on the annual plan, one month on monthly); `repeating` for 12 months
gives both plans roughly half-off the first year.

**Freeze the beta list at launch.** Once you flip `GATE.mode` off `'beta'`, the
app stops recording new `beta_signups`, so generate codes from the list as of
that moment (or filter by `joined_at`) — that way nobody can insert themselves
into the list after the fact to claim a code.

At launch (Stripe):

1. Create the 50%-off **Coupon** (the discount rule): Stripe Dashboard →
   Product catalog → Coupons → 50% off, with a **duration** you choose (once /
   for N months / forever). As a backstop, cap the coupon's total redemptions
   at your beta headcount.
2. Generate **one Promotion Code per beta user**, each with
   **`max_redemptions = 1`** and an **`expires_at`** a few weeks out. Do this
   with `scripts/generate-beta-coupons.mjs` (see its header) — it reads your
   beta emails, creates a unique code each (skipping anyone already done), and
   writes `beta-codes.csv` mapping email → code. Run it locally with your
   Stripe secret key; never commit that key.
3. Pull the beta list to feed the script: Supabase → Table Editor →
   `beta_signups` → export CSV (or `select email from beta_signups order by
   joined_at`).
4. Enable the code field on checkout: Stripe Payment Link → **"Allow promotion
   codes"**. Then email each beta user *their own* code (mail-merge from
   `beta-codes.csv`).

The airtight alternative (no shareable code at all): require sign-in first and
create the Checkout Session server-side with the discount attached to that
account — more build than a static Payment Link, noted under "Billing with
Stripe" above.

Lemon Squeezy has the same shape: a 50% discount with a per-code usage limit of
1; generate one code per user via its API or dashboard. Add both a monthly
($4.99) and a yearly ($39.99) variant, and leave the discount applicable to the
whole product so it covers either variant.

## Gating sync at launch (optional)

Today cross-device sync is open to every signed-in user — correct for a free
beta. If at launch you want sync to be a paid feature, run
`supabase/entitlement_sync.sql` **once, at launch**: it rewrites the
`user_progress` policies to also require an entitled profile (comped, or an
active/trialing subscription). Do NOT run it during beta — it would cut sync off
for free users. To reopen sync later, re-run `supabase/user_progress.sql`.
Entitlement fields (`sub_status`, `is_comped`) are never writable by the browser
— only the service-role webhook and you (in the dashboard) set them — so this is
a true server-side gate, not a client toggle.

Not every beta user signs in — the one-tap "continue free" bypass doesn't
require it — so only those who sign in are captured (which is also the only way
you'd have an address to send a coupon to). The gate copy nudges sign-in for
exactly this reason.

## Sync model (v1), for future reference

Local storage remains the source of truth; the account holds a snapshot
(same JSON as a Backup download, in `user_data.data`). Every content change
re-stamps `data.savedAt` and schedules a debounced push. On sign-in or page
load the app pulls: an empty device adopts the account copy; a device whose
copy hasn't changed since its last sync adopts a newer account copy; a
device with local changes pushes them (last writer wins). Manual "Sync now"
and "Load from account…" live in the Account dialog. No merging of
concurrent edits from two devices — acceptable for v1, worth revisiting if
users report losing edits.

## Costs

Fixed: the domain. Cloudflare Pages, Supabase, and Resend free tiers carry
well past the first hundred users; Lemon Squeezy takes its cut per sale.
The free version (artifact or local file) stays free forever, untouched.
