# Foothold Now

A single-file web app (`index.html`) for building practice ladders. All markup,
styles, and script live in that one file; the app stores its data in
`localStorage` under `foothold.v1`.

The app is **fully local**: there are no accounts, no sign-in, and no network
calls—nothing a user writes ever leaves their browser. The **Backup** button
exports the data as a JSON file and restores from one, which is also how a user
moves their ladders to another device or browser (localStorage is per-origin,
so data does not follow the user across domains on its own). Cloudflare Web
Analytics provides anonymous, cookie-free page counts and is the only
third-party script on the page.

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
