# Foothold Now

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

The file also contains an account/sync layer (`var SYNC = ...`). It is now
configured with a Supabase project: signing in with an email magic link syncs
the whole app snapshot to the `user_progress` table (keyed by user id, guarded
by row-level security), while `localStorage` stays the offline cache and source
of truth. Any signed-in user syncs—there is no paywall on the sync itself.
Setting `SYNC` back to empty strings fully disables it (no Sign in button, zero
network calls)—that is how the published artifact should stay, so it keeps
behaving like the free local version. Run `supabase/user_progress.sql` in the
Supabase SQL editor to create the table. `PRODUCT.md` and the other
`supabase/` files describe the optional future paid tier (Lemon Squeezy
billing, Pro gating), which is not wired into the current app.

## Copy style

- Em-dashes connect directly to the words on either side, with no spaces:
  `one at a time—gently, on repeat—until`. (En-dashes in ranges like `0–100`
  also stay closed up.)
- Full sentences end with a period, including placeholder text that reads as a
  sentence (e.g. "A word about how it went (optional).").
- Short phrases and labels—buttons, headings, chips, field labels, tags—take
  no terminal period.
