# Foothold Now

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

The app is **fully local**: there are no accounts, no sign-in, and no network
calls—nothing a user writes ever leaves their browser. The **Backup** button
exports the data as a JSON file and restores from one, which is also how a user
moves their ladders to another device or browser (localStorage is per-origin,
so data does not follow the user across domains on its own). There are no
third-party scripts and no analytics of any kind: the pages load nothing from
another host and make no network requests at all.

Alongside the app live static pages in the same voice and palette, each a
self-contained HTML file: SEO guides (`fear-ladder/`, `erp/`, `ocd-notes/`,
`suds/`, `stop-avoiding/`), a sample-ladders guide (`sample-ladders/`), a help
page (`add-to-home-screen/`), the founder's story (`about/`), and the privacy
policy (`privacy/`). All are cross-linked from the app's footer and the
hamburger site menu next to the logo. `og.png` is the 1200×630 social share
card; `robots.txt` and `sitemap.xml` cover the app plus the guides. The site
deliberately names ERP, OCD, and anxiety for search while emphasizing that no
diagnosis is needed.

## Movement

`movement/` is **Movement Now**, a separate single-file app in the same
palette: a private log for sets, weights, and treadmill intervals, stored in
`localStorage` under `movement.v1`. The path stays `/movement/` even though the
name gained a word—changing it would break the home-screen icon already
installed on the owner's phone. It shares the origin and nothing else. Keep it that way: no
link from any Foothold page in, no link back out, no entry in `sitemap.xml`,
`llms.txt`, or the site menu, and `noindex, nofollow` on the page itself. It
ships its own PWA pieces so it installs to a home screen on its
own—`manifest.webmanifest` scoped to `/movement/`, its own icons, and `sw.js`
for an offline shell. Deliberate wording: the app never uses the words
"workout" or "exercise"; a thing you do is a **movement**, a visit to the gym
is a **session**, and each group is a **routine**. Those two words are also
split across string concatenation where the prompt has to name them, so they
appear nowhere in the page source.

Two deliberate absences. There is **no history view and no progress chart**:
finished sessions are stored only so the next session opens with the numbers
last actually lifted, and nothing displays them back as a scoreboard. There
is likewise no streak strip. Both were removed on request—the point is
knowing what you can lift today, not watching a line climb.

A treadmill routine is a list of **blocks**, not a flat list of intervals. A
steady block is one stretch at one speed; a repeat block is a fast leg and an
easy leg run back to back N times (30s at 12.5 / 90s at 3.5, twelve times over).
Times are held in **seconds**, because that is how the short ones are counted.
`allLegs()` flattens blocks into what the timer actually runs.

`S.bests` keys the fastest recorded fast leg by interval shape—`"30/90"` maps
to the quickest mph held at that shape and how many blocks it lasted. It is a
reference table shown while setting up a session, deliberately not a chart:
same reasoning as the missing history.

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

The site is served free from GitHub Pages at `https://grhs24.github.io/`. All
canonical tags, `og:url`, structured data (JSON-LD), `sitemap.xml`, and
`robots.txt` use that origin. Internal links are root-relative (`/about/`,
`/privacy/`), which resolve correctly at the user-site root. `index.html` shows
a one-line migration banner only when the hostname is the old `footholdnow.com`,
so it never appears on the github.io site.

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
