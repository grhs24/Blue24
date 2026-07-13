# Foothold

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

The file also contains a dormant account/sync layer (`var SYNC = ...`) for a
future paid deployment—see `PRODUCT.md`. Its config must stay EMPTY in this
repo and in the published artifact: when empty, the app must behave exactly
like the free local version (no Sign in button, zero network calls). The
`supabase/` directory holds the backend pieces for that future deployment.

## Copy style

- Em-dashes connect directly to the words on either side, with no spaces:
  `one at a time—gently, on repeat—until`. (En-dashes in ranges like `0–100`
  also stay closed up.)
- Full sentences end with a period, including placeholder text that reads as a
  sentence (e.g. "A word about how it went (optional).").
- Short phrases and labels—buttons, headings, chips, field labels, tags—take
  no terminal period.
