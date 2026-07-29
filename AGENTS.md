# Foothold Now

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

The app is **fully local**: there are no accounts, no sign-in, and no network
calls—nothing a user writes ever leaves their browser. The **Backup** button
exports the data as a JSON file and restores from one, which is also how a user
moves their ladders to another device or browser (localStorage is per-origin,
so data does not follow the user across domains on its own). There are no
third-party scripts beyond a cookie-free page-count beacon, which records a
visit and nothing else. The only other request any page makes is for the demo
video described below, from this same origin, and only once a visitor presses
play. Nothing a user writes is ever uploaded.

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

## Movement Now

`movement/` is **Movement Now**: one page, and a logger only. Every number on
it is what the owner can currently do, edited in place—there are no sessions
to start or finish, no timers, no history, and no charts. Routines are written
in the Claude app and timed with a phone timer; this holds the numbers and
nothing else. Resist adding any of that back without being asked: each absence
was requested, in this order—history and streaks, then the resume card, then
the reset button, then the Today page, then the timers and the whole
start-and-finish flow.

The path stays `/movement/` even though the name gained a word—changing it
would break the home-screen icon already installed on the owner's phone.

It shares the origin with Foothold Now and nothing else. Keep it that way: no
link from any Foothold page in, no link back out, no entry in `sitemap.xml`,
`llms.txt`, or the site menu, and `noindex, nofollow` on the page itself. It
ships its own PWA pieces so it installs to a home screen on its
own—`manifest.webmanifest` scoped to `/movement/`, its own icons, and `sw.js`
for an offline shell.

Deliberate wording: the app never uses the words "workout" or "exercise"; a
thing you do is a **movement** and each group is a **routine**. Storage is
`localStorage` under `movement.v1`; the loader strips `sessions`, `draft`,
`bests` and `prefs` from anything older, since those belonged to the
start-and-finish version.

A treadmill routine is a list of **blocks**. A *steady* block is one stretch at
one speed; a *repeat* block is one interval shape—a fast leg, a slower leg, and
how many times round (30s at 12.5 against 90s at 3.5, ten times over). Keep one
repeat block per combination the owner can do; that list is the record of where
their speeds are. Times are held in **seconds**, because that is how the short
ones are counted.

Each leg holds `paces`, a list of `{reps, mph}` steps, so a block can change
speed partway through—two rounds at 9 then six at 8. Only the legs' durations
and the incline stay single values for the whole block.

**The fast leg counts the block out**: `blockReps` is the sum of its steps'
`reps`, and the slower leg's steps are shares of those same rounds. A slower
leg that adds up short holds its last speed to the end; one that overshoots
has the extra ignored. Nothing done to the slower leg can change how long the
block is, which is the point—the round count has one owner. A slower leg with
a single step therefore needs no count at all, so that field is hidden until
it has two.

Adding a step **splits the last one** rather than appending a fresh round
(`n` becomes `ceil(n/2)` and the remainder), so the block stays the length it
was. Appending would have doubled it.

Two older shapes migrate on load: `reps` on the block with one `work.mph`, and
then `paces` on the block with one `rest.mph`. The loader walks both to
per-leg `paces` and deletes the old keys, so it is safe to run repeatedly.

Typing in a number field saves but does not re-render—that would drop the
cursor. `refreshRow(id)` patches the summary line above the open form
instead, which is why every row's name and summary sit in their own
elements (`data-line`, `data-total`) and are written with `textContent`.

## No AI at runtime

Foothold Now never calls a model. Do not add Claude, or any other AI, to this
site at runtime: no `window.claude.*` calls, no artifact runtime capabilities
declared, no API keys, no model requests of any kind, on any page. This holds
even when "Claude can run in artifacts" is switched on for the account. That
setting is global; this exemption is deliberate and stays put.

The reason is the promise the site makes, not preference. Every page tells the
user that nothing they write leaves their browser, and `privacy/` says it in as
many words. One model call would send ladder text—the most personal thing
here, often OCD and anxiety content—to a server, quietly breaking that promise.
If an AI feature is ever genuinely wanted, the privacy page has to be rewritten
first, with the owner's explicit go-ahead.

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
