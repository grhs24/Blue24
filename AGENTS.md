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

`movement/` is a separate single-file app in the same palette and voice: a
private log for sets, weights, and treadmill intervals, stored in
`localStorage` under `movement.v1`. It is a personal tool rather than part of
the public site, so it carries `noindex`, stays out of `sitemap.xml`, and is
linked from nowhere on Foothold. It ships its own PWA pieces so it installs to
a home screen on its own—`manifest.webmanifest` scoped to `/movement/`, icons,
and `sw.js` for an offline shell. Deliberate wording: the app never uses the
words "workout" or "exercise"; a thing you do is a **movement**, a visit to the
gym is a **session**, and the three groups plus the treadmill are **routines**.

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
