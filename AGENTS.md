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
another host, and the only request any page makes is for the demo video
described below, from this same origin, and only once a visitor presses play.
Nothing a user writes is ever uploaded.

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

## Movement

`movement/` is a separate single-file app in the same palette: a private log
for sets, weights, and treadmill intervals, stored in `localStorage` under
`movement.v1`. It shares the origin and nothing else. Keep it that way: no
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

The **routine builder** (`Plan → New routine`) is the one thing that leaves
the device: it posts the typed description to the Claude API and gets a
routine back as structured JSON. The key is entered by the user, lives in its
own `localStorage` entry (`movement.key`) so it can never ride along in a
backup export, and is **never committed**—this repository is public. Logged
data is never sent anywhere; keep the footer copy honest about that
distinction if either side changes.

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

This restriction covers every Foothold Now page served from this origin. Other
artifacts and projects are free to use the feature.

**`movement/` is the one exemption, granted by the owner** after this rule was
written, and only for its routine builder. What makes it a different case: it
is a private personal tool rather than part of Foothold Now, it holds sets and
weights rather than ladder text, the key is the owner's own and stays on the
device, and the only thing that ever leaves is a routine description typed on
purpose—the log itself is never sent. Foothold Now's own pages are unchanged
and still call nothing. Do not read this exemption as loosening the rule above:
anything else, on any Foothold page, still needs the privacy page rewritten
first and the owner's explicit go-ahead.

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
