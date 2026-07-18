# Foothold Now

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

Alongside it live static pages in the same voice and palette, each a
self-contained HTML file: four SEO guides (`fear-ladder/`, `erp/`, `suds/`,
`stop-avoiding/`), a help page (`add-to-home-screen/`), the founder's
story (`about/`), and the email/privacy policy (`privacy/`). All are cross-linked from the app's footer and from the
hamburger site menu next to the logo. `og.png` is the 1200×630 social share card;
`robots.txt` and `sitemap.xml` cover the app plus the guides. The site
deliberately names ERP, OCD, and anxiety for search while emphasizing that no
diagnosis is needed.

The file also contains an account/sync layer (`var SYNC = ...`). It is now
configured with a Supabase project: signing in with an email magic link syncs
the whole app snapshot to the `user_progress` table (keyed by user id, guarded
by row-level security), while `localStorage` stays the offline cache and source
of truth. Any signed-in user syncs—there is no paywall on the sync itself.
Setting `SYNC` back to empty strings fully disables it (no Sign in button, zero
network calls)—that is how the published artifact should stay, so it keeps
behaving like the free local version. Run `supabase/user_progress.sql` in the
Supabase SQL editor to create the table. `PRODUCT.md` and the other
`supabase/` files describe the optional future paid tier (Pro gating, plus two
alternative billing back ends—`supabase/functions/lemonsqueezy-webhook` and
`supabase/functions/stripe-webhook`; pick one at launch), which is not wired
into the current app. Both webhooks write only `profiles.sub_status` (Stripe
also binds `profiles.stripe_customer_id` at checkout) and never touch
`is_comped`.

While `mode: 'beta'`, signed-in users are recorded in the `beta_signups` table
(`supabase/beta_signups.sql`, insert-only under RLS) so they can be offered a
50%-off launch coupon—the beta gate and paid wall mention that coupon.

There is also an access gate (`var GATE = ...`). `mode: 'off'` disables it
(free/local build & the published artifact should stay this way). `mode: 'beta'`
(current, live on footholdnow.com) shows a welcome gate with a one-tap
"continue free as a beta user" button, remembered in `localStorage`
(`foothold.betapass.v1`)—nothing is charged. `mode: 'paid'` shows a
subscribe-only wall wired to `GATE.checkoutUrl` (a Lemon Squeezy Buy link or a
Stripe Payment Link/Checkout URL); this
is scaffolded for launch and not yet enforced server-side—the real barrier will
be a Supabase RLS policy requiring an active subscription. Flip to `'paid'` and
add the checkout URL when the paid tier goes live.

## Winding down (domain sunset)

A prepared "goodbye" landing page for retiring the site is kept OFF every
deployed branch. It lives only on the non-deployed `sunset-prep` branch (at
`sunset/index.html` there) so nothing about a shutdown is publicly reachable
while the site is live. To bring it back into a working tree when the time
comes: `git checkout sunset-prep -- sunset/index.html`.

Important: a lapsed domain cannot serve any farewell—if `footholdnow.com` is not
renewed it stops pointing at this repo, so visitors get the registrar's
"expired/for sale" page or a browser error (whoever registers the name next
controls it). To actually show the prepared page you must either (a) keep the
domain but replace the app—copy the prepared page over the root `index.html` and
push the deploy branch; or (b) drop the domain but keep the free GitHub Pages URL
(`grhs24.github.io/blue24`) alive with the prepared page.

## Copy style

- Em-dashes connect directly to the words on either side, with no spaces:
  `one at a time—gently, on repeat—until`. (En-dashes in ranges like `0–100`
  also stay closed up.)
- Never place an em-dash directly before "and" (no `—and`). Recast instead:
  drop the "and" and keep the dash (`peaks—then comes down`), use a comma
  (`relief, and the relief teaches`), or split into two sentences.
- Full sentences end with a period, including placeholder text that reads as a
  sentence (e.g. "A word about how it went (optional).").
- Short phrases and labels—buttons, headings, chips, field labels, tags—take
  no terminal period.
