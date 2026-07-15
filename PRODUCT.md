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
<p>Enter this 6-digit code in the app:</p>
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
   `sed -i "s|url: ''|url: '$SUPABASE_URL'|; s|anonKey: ''|anonKey: '$SUPABASE_ANON_KEY'|; s|checkoutUrl: ''|checkoutUrl: '$CHECKOUT_URL'|" index.html`
   with build output directory `/`. Add the three env vars in the Pages
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
