# Foothold Now

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

The app is **local-first, with opt-in sync**. Signed out—which is how it
opens—there are no network calls at all and nothing a user writes leaves their
browser. Signing in with an emailed one-time code is optional and buys exactly
one thing: the user's ladders sync between their own devices. See "Accounts and
sync" below. The **Backup** button exports the data as a JSON file and restores
from one, which is the other way a user moves ladders between devices
(localStorage is per-origin, so data does not follow the user across domains on
its own). There are no third-party scripts beyond a cookie-free page-count
beacon, which records a visit and nothing else. The only other request any page
makes is for the demo video described below, from this same origin, and only
once a visitor presses play.

**Whenever the sync or privacy behaviour changes, `privacy/` changes with it in
the same commit.** That page is a promise, not marketing copy, and several
other places repeat it: the footer colophon, the FAQ answer (which exists twice
in `foothold-now/index.html`—once as prose, once inside the JSON-LD block, and
they must agree), `llms.txt`, and `add-to-home-screen/`.

## The demonstration video

`foothold-now/demo.mp4` is a narrated walkthrough, shown at the top of the "How
Foothold Now works" section on the home page, with `foothold-now/demo-poster.png`
as its poster frame. It is **self-hosted on purpose**: a YouTube or Vimeo embed
would load third-party scripts and report every viewer back to that company,
which would break the promise the rest of the site makes. Keep it self-hosted.

The `<video>` tag carries `preload="none"`, so the file is not fetched at all
until a visitor presses play; do not change that, or every visit would pull
roughly 18 MB. The numbered steps underneath say the same thing in writing,
which is what makes the video safe to skip for anyone who cannot watch it.

Alongside the app live static pages in the same voice and palette, each a
self-contained HTML file: SEO guides (`fear-ladder/`, `erp/`, `ocd-notes/`,
`suds/`, `stop-avoiding/`), a sample-ladders guide (`sample-ladders/`), a help
page (`add-to-home-screen/`), the founder's story (`about/`), and the privacy
policy (`privacy/`). All are cross-linked from the app's footer and the
hamburger site menu next to the logo. `og.png` is the 1200×630 social share
card; `robots.txt` and `sitemap.xml` cover the app plus the guides. The site
deliberately names ERP, OCD, and anxiety for search while emphasizing that no
diagnosis is needed.

## Accounts and sync

An email sign-in and a Supabase sync layer shipped originally, were stripped in
`ff26b40` for the move to free GitHub hosting, and were **restored in September
2026** at the owner's request so ladders travel between a phone and a computer.
The restored code is close to the original; the differences below are the
point, so read them before touching it.

**Sync is opt-in, and the signed-out path must stay silent.** Signed out, the
app issues no request of any kind—that is what lets `privacy/` still promise a
wholly local app to everyone who never signs in. Anything that would make a
signed-out visit talk to a server breaks the promise on the page. Check it the
way it is worded: load the app with the network panel open, use it, and confirm
nothing but the page-count beacon goes out.

Sign-in is a one-time code emailed by Supabase GoTrue (`/auth/v1/otp`, then
`/auth/v1/verify`); the same email also carries a magic link, which returns to
the app with the session in the URL fragment and is picked up by
`parseHashSession`. There is no password anywhere. `redirect_to` is built from
the current origin and path, so **the live origin must be in the Supabase
Redirect URLs allowlist** or the link half of sign-in fails while the typed
code still works.

The synced object is the whole app snapshot, written to one row per user in
`user_progress` and protected by row-level security. localStorage stays the
working source of truth and the offline cache; the row is a mirror. `save()`
calls `queuePush()` on any real content change, debounced 1.5s, and a pending
push is flushed with `keepalive` when the page is backgrounded.

**Conflicts are last-write-wins on the whole snapshot**, decided by comparing
`data.savedAt`—which is why `savedAt` marks when content actually changed
rather than when it was rewritten. Two devices editing the same ladders while
both offline will lose the older set of edits. This is a known, accepted
limitation and the reason the Backup button stays exactly where it is; a real
per-ladder merge is the fix if it ever bites.

**Only the sign-in and the sync came back.** The beta welcome gate, the paid
entitlement and free step cap, the `profiles` table, `beta_signups`, and the
anonymous `product_events` analytics were removed in the same commit and stay
removed. Do not restore them while restoring anything else from that history.
The access gate is a no-op stub and an account gates no features at all.

**Delete my synced copy** in the Account panel erases the row and signs the
device out—signing out is deliberate, since a still-signed-in device would push
the row straight back on the next edit. `privacy/` names this control, so if it
moves or is renamed, that page changes with it.

None of this touches Movement Now, which has no account, no sync, and no
network calls of any kind. Keep it that way.

## Movement Now

`movement/` is **Movement Now**: one page, and a logger only. Every number on
it is what the owner can currently do, edited in place—there are no sessions
to start or finish, no timers, no history, and no charts. Routines are written
in the Claude app and timed with a phone timer; this holds the numbers and
nothing else. Resist adding any of that back without being asked: each absence
was requested, in this order—history and streaks, then the resume card, then
the reset button, then the Today page, then the timers and the whole
start-and-finish flow, then the per-movement weight step.

The path stays `/movement/` even though the name gained a word—changing it
would break the home-screen icon already installed on the owner's phone.

The footer carries `BUILT`, a plain date. **Change it with every deploy**—it
is the only way the owner can tell from the phone whether the home-screen app
is showing the current copy or one it kept, and answering that question is
otherwise guesswork. Bump `CACHE` in `sw.js` at the same time when the shell
changes, since `activate` clears every cache but the current one.

It shares the origin with Foothold Now and nothing else. Keep it that way: no
link from any Foothold page in, no link back out, no entry in `sitemap.xml`,
`llms.txt`, or the site menu, and `noindex, nofollow` on the page itself. It
ships its own PWA pieces so it installs to a home screen on its
own—`manifest.webmanifest` scoped to `/movement/`, its own icons, and `sw.js`
for an offline shell.

Deliberate wording: the app never uses the words "workout" or "exercise"; a
thing you do is a **movement** and each group is a **routine**. Storage is
`localStorage` under `movement.v1`.

`carryForward(data)` holds every shape migration and runs on load **and on
restore**, so a backup file written by any earlier version opens. Keep both
callers, and keep each step safe to run twice—restoring a file the current
version wrote puts it through the same function. It also strips `sessions`,
`draft`, `bests` and `prefs`, which belonged to the start-and-finish version.

A **set** is a list of `steps`, each `{w, r}`, so the weight can drop partway
through: eight reps at 40, then seven at 30. Its rep count is the sum. A set
of one step is the ordinary case and reads as it always did—the movement's
summary line only spells sets out (`40×8, 30×7 · 40×15`) once one of them is
split or the sets disagree on reps; otherwise it stays `65 · 65 · 55 × 10`.
The ✕ on a step row takes that weight off a split set, or removes the whole
set when that weight is all it is. Splitting a set **keeps the weight on both
rows**: the stacks do not all count in the same size (elevens on some, 2.5 on
dumbbells), so any guessed drop would be a weight that cannot be selected. A
per-movement step size used to exist for this and was removed at the owner's
request—the weight fields are plain inputs with no ± buttons, so it drove
nothing else. Do not reintroduce it.

A treadmill routine is a list of **blocks**. A *steady* block is one stretch—a
warm up, a cool down; a *repeat* block is one interval shape—a fast leg, a
slower leg, and how many times round (30s at 12.5 against 90s at 3.5, ten times
over). Keep one repeat block per combination the owner can do; that list is the
record of where their speeds are. Times are held in **seconds** everywhere.

**Every block under a treadmill routine is a separate log of something the
owner can do—not a part of one assembled run.** They said so directly. The ↑↓
arrows order the list; they do not make a programme. So each block has to read
as complete on its own, which is what the two ends below are for.

Four ways to add: **+ Warm up**, **+ Intervals**, **+ Steady**, **+ Cool down**.
Warm up, Steady and Cool down all build a *steady* block—the difference is only
what they start as. A warm up arrives named and already split (two minutes at 4,
then three at 5), a cool down named and winding down (three at 4, then two at 3),
a steady one blank at a single speed. The owner asked for the warm up as its own
labelled option after failing to find it behind "Steady", so keep these named in
their words, not in the data model's. There is no separate warm-up or cool-down
*type*.

**Any block can also carry its own two ends**: `b.warm` and `b.cool`, absent
unless added, each `{paces: [{secs, mph}]}`—easy minutes the log runs once
before its rounds and once after. `ENDS` holds everything that differs between
them, so neither is special-cased anywhere else. They are counted in minutes
like a steady block, they feed `blockTotal`, and `blockLine` reads in the order
the log is run: `5:00 warm up · 10 blocks · 30s at 12.5 / 90s at 3.5 · 5:00 cool
down · 30:00`. Taking the last speed off an end deletes it entirely, which is
why its ✕ is never disabled where other holders keep their last row.

Both ways of warming up exist on purpose and the owner asked for each in turn: a
separate block when it stands on its own as a thing they do, an end when it
belongs to the log it is attached to.

Both kinds carry `paces`, a list of speed steps, so a block can change speed
partway through. A repeat leg counts its steps in rounds (`{reps, mph}`—two at
9 then six at 8); a steady block counts its own in seconds (`{secs, mph}`—two
minutes at 4 then three at 5). Only the repeat legs' durations and the incline
stay single values for the whole block.

Steady steps are **typed in minutes** and stored in seconds, via the `scale`
argument to `field()`; a repeat leg's 30s and 90s stay in seconds, because that
is how those are actually counted. Both units on screen at once is deliberate—
match the unit to the thing rather than to the storage.

**Incline is either one number for the whole log or one per step**, and which
it is, is derived: `varies(b)` is true when any step in any of the log's holders
carries an `incline`. There is no mode flag to fall out of sync with the data.
"Vary by part" writes `b.incline` onto every step; "Same throughout" collapses
back to the *shallowest* of them and deletes the rest, because `b.incline` has
not been on screen meanwhile and would be a number the owner never chose—the
same reason a new end or a split step seeds from `shallowest(b)`. The summary
shows a range (`0–6%`) while it varies. Three number fields plus their ± will
not fit a phone row, so `.leg.pace.tri` hides the ± and keeps the numbers.

**The fast leg counts the block out**: `blockReps` is the sum of its steps'
`reps`, and the slower leg's steps are shares of those same rounds. A slower
leg that adds up short holds its last speed to the end; one that overshoots
has the extra ignored. Nothing done to the slower leg can change how long the
block is, which is the point—the round count has one owner. A slower leg with
a single step therefore needs no count at all, so that field is hidden until
it has two.

Adding a step **splits the last one** rather than appending a fresh round
(`n` becomes `ceil(n/2)` and the remainder), so the block stays the length it
was. Appending would have doubled it. The same split runs on a set's reps
(fifteen divide into eight and seven) and on a steady block's seconds.

Typing in a number field saves but does not re-render—that would drop the
cursor. `refreshRow(id)` patches the summary line above the open form
instead, which is why every row's name and summary sit in their own
elements (`data-line`, `data-total`, `data-reps`) and are written with
`textContent`.

## No AI at runtime

Foothold Now never calls a model. Do not add Claude, or any other AI, to this
site at runtime: no `window.claude.*` calls, no artifact runtime capabilities
declared, no API keys, no model requests of any kind, on any page. This holds
even when "Claude can run in artifacts" is switched on for the account. That
setting is global; this exemption is deliberate and stays put.

The reason is the promise the site makes, not preference. Sync did not soften
this rule and must not be read as a precedent for it. Sync moves a user's
ladders to a row only they can read, because they asked for it, on a page that
says so plainly. A model call is a different act: it hands ladder text—the most
personal thing here, often OCD and anxiety content—to a third party to be read
and processed. If an AI feature is ever genuinely wanted, the privacy page has
to be rewritten first, with the owner's explicit go-ahead.

This restriction covers everything served from this origin, `movement/`
included. Other artifacts and projects are free to use the feature.

A routine builder that called the Claude API briefly lived in `movement/`; it
was removed at the owner's request once it was clear API billing is separate
from a Claude subscription. Nothing on this origin calls a model again.

## Hosting

The repo is the GitHub Pages **user site** for `grhs24`, so it serves from
`https://grhs24.github.io/`. The site itself lives one level down, at
`https://grhs24.github.io/foothold-now/`, and everything under `foothold-now/`
is the site: `index.html`, the guides, icons, `og.png`, and
`manifest.webmanifest` (whose `start_url` and `scope` are `/foothold-now/`).
Internal links are root-relative and **include the base** (`/foothold-now/about/`).

The origin root holds only support files: `index.html` there is a redirect stub
to `/foothold-now/`, alongside `robots.txt`, `sitemap.xml`, `llms.txt` (all of
which must stay at the root to be found), the Google Search Console
verification file (moving it breaks verification), `.nojekyll`, and `movement/`.

There is no build step, no framework, and no GitHub Actions workflow: Pages
publishes the branch as-is, which is why paths are written out literally rather
than derived from a `base` setting. Adding a page means adding a real directory
with its own `index.html`, so refreshes resolve natively and no SPA 404
fallback is needed. When adding one, remember three places: the `/foothold-now/`
prefix on its links, an entry in `sitemap.xml`, and its canonical/`og:url`.

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
