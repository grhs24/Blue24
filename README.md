# Foothold

A quiet place to practice the hard things.

Foothold is a small, private web app for building **practice ladders**: take
something you've been avoiding, break it into small concrete steps, rate each
step 0–100 by how hard it feels, then face them one at a time — gently, on
repeat — until they lose their grip.

## Features

- **Ladders** — one per thing you're working toward, with a note on why it matters.
- **Drafted starting steps** — describe what you're working toward and Foothold
  sketches a graded set of practice steps from its built-in pattern library,
  each with a ground rule for skipping the usual escape hatches. Drafting runs
  entirely on your device; review, reword, re-rate, or discard every suggestion
  before it's added. Building steps by hand works exactly as before.
- **Feedback that teaches it** — tell the draft screen how the suggestions land
  ("gentler", "smaller steps", "more about the checking, less about germs") and
  Foothold redrafts on the spot. It distills your feedback — and the rating
  tweaks you make — into a preference profile (intensity, granularity, topics)
  that shapes every future draft. What it has learned is always shown in plain
  words, and can be forgotten with one click in Backup.
- **Steps** — each rated 0–100; the ladder orders itself, gentlest first, and
  marks your next foothold.
- **A Deleted place** — deleting a ladder moves it, with all its steps and
  logs, to a Deleted area where it can be restored anytime or permanently
  deleted with confirmation.
- **Practice logs** — record how each practice felt before, at the peak, and
  after, with an optional note. Foothold notices when a step seems to be easing.
- **Settling** — when a step loses its grip, mark it settled and move up.
- **Private by design** — everything lives in your browser's local storage.
  Nothing is sent anywhere.
- **Backup & restore** — download your data as a JSON file, restore it on any
  device, or wipe it entirely.

## Running it

The whole app is a single self-contained file — `index.html` — with fonts,
styles, and code inlined. No build step, no server, no network needed.

- **Locally:** open `index.html` in any modern browser.
- **Hosted:** serve the file from any static host. On GitHub, enable
  **Settings → Pages** for this repository and it will be live at your Pages URL.

Progress is saved automatically in the browser you use, per device. Use the
**Backup** button to keep a copy or move between devices.

Foothold is a personal practice companion, not medical care. If you're working
with a therapist or counselor, build your ladders together.
