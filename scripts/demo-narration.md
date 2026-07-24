# Voicing the Foothold Now demo

The demo video (`node scripts/record-demo.js dark`) runs about 62 seconds.
Each run prints a **cue sheet**—the exact second each scene starts—so the
narration below can be re-timed after any re-record. Timestamps here match the
July 2026 recording; expect them to drift by a second or so on a fresh run, and
trust the printed cues over this table.

## The narration script

Read at an easy pace (~140 words per minute). Lines are timed to start at each
cue; the gaps are intentional breathing room—silence over the b-roll is fine.

| Start | Say | What's on screen |
| ----- | --- | ---------------- |
| 0:00 | This is Foothold Now—a quiet place to practice the hard things. | Welcome screen |
| 0:05 | Start with something you've been avoiding, and write down why it matters. | Typing the ladder name and why |
| 0:13 | Break it into small steps, in your own words… | Typing the first step |
| 0:16 | …and rate each one, zero to a hundred, by how hard it feels right now. | Dragging the rating slider |
| 0:24 | The ladder puts them in order for you—gentlest first. | Steps re-sorting as they're added |
| 0:28 | *(optional)* Anything you'd like to practice can be a step—a task, a situation, a moment. | More steps being added |
| 0:37 | Pick a gentle step, practice it on purpose—then log how it felt: before, at the peak, and after. | Practice form, sliders moving |
| 0:47 | Keep practicing. When a step comes all the way down to zero, it settles on its own. | "After" slider reaching zero, step settling |
| 0:52 | Every ladder shows your footholds—settled steps, practices, progress. | Home screen with progress bar |
| 0:57 | Foothold Now—free, at grhs24 dot github dot io. | Outro card |

About 95 words—comfortable inside 62 seconds.

## Recording the voice

Either works:

- **Your own voice**: a quiet room, phone close to your mouth. Voice Memos
  (iPhone), the Recorder app (Android), or QuickTime/Audacity on a computer.
  Play the video muted on another screen and read to the cues—two or three
  takes is normal. Export as m4a/mp3/wav.
- **A generated voice**: paste the lines (one block, blank line between cues)
  into a text-to-speech tool such as ElevenLabs, and download the audio. You
  may need to nudge pauses by splitting lines into separate generations.

## Putting the voice over the video

Any free editor handles it—import the video, drop the audio on the track
under it, slide it until the first line lands on the welcome screen, export:

- **CapCut / Clipchamp / iMovie**: New project → import `foothold-demo-dark.webm`
  and your audio file → align → export MP4 (1080p). If the editor won't accept
  a `.webm`, convert it to MP4 first at cloudconvert.com (or any converter).
- **Command line**, if ffmpeg is handy:
  `ffmpeg -i foothold-demo-dark.webm -i voice.m4a -map 0:v -map 1:a -c:v libx264 -pix_fmt yuv420p -shortest demo-voiced.mp4`

## After the site changes

Re-record with `node scripts/record-demo.js dark` (or `light`)—the walkthrough
drives the live `index.html`, so it always shows the current copy and
features. Check the freshly printed cue sheet against the table above and
shift your read points if a scene moved.
