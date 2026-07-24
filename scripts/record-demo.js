// Records a paced product demo of Foothold Now as a .webm video, driving the
// real app in headless Chromium. A visible cursor, click ripples, and caption
// pills are injected so viewers can follow along; it ends on a branded outro.
//
// Usage:
//   node scripts/record-demo.js          # dark mode (default)
//   node scripts/record-demo.js light    # light mode
//
// Needs Node 18+ with the `playwright` package (npm i playwright — resolved
// from wherever you run the script) and a Chromium it can launch. If
// Playwright can't find a browser, point CHROMIUM_PATH at one, e.g.
//   CHROMIUM_PATH=/path/to/chrome node scripts/record-demo.js
//
// Output: foothold-demo-<theme>.webm in the current directory (~57s, 1280×720,
// ~3.5 MB). The video length equals the script's real run time, so pacing
// changes = editing the wait() calls in the walkthrough below. To convert to
// mp4 for social uploads: ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p out.mp4
// (or any online converter).

const http = require('http');
const fs = require('fs');
const path = require('path');

// resolve playwright from this repo OR from the directory the script is run in
function loadPlaywright() {
  try { return require('playwright'); } catch (e) {}
  try { return require(require.resolve('playwright', { paths: [process.cwd()] })); } catch (e) {}
  console.error('playwright not found — run `npm i playwright` first (here or in the repo)');
  process.exit(1);
}
const { chromium } = loadPlaywright();

const THEME = (process.argv[2] || 'dark').toLowerCase();
if (THEME !== 'dark' && THEME !== 'light') { console.error('usage: node scripts/record-demo.js [dark|light]'); process.exit(1); }

// Colors for the injected demo chrome (cursor/captions/outro), matching the
// app's own palette in each scheme (see :root in index.html).
const P = THEME === 'dark'
  ? { cursorFill: '#E4EAE5', cursorStroke: '#141B17', ripple: '#7FC0A8', capBg: '#E4EAE5', capInk: '#141B17', capShadow: 'rgba(0,0,0,0.6)', outroBg: '#141B17', outroInk: '#E4EAE5', outroSub: '#A2B2A8', outroAccent: '#7FC0A8' }
  : { cursorFill: '#22302A', cursorStroke: '#FCFDFB', ripple: '#33685A', capBg: '#22302A', capInk: '#FCFDFB', capShadow: 'rgba(34,48,42,0.45)', outroBg: '#F2F4EF', outroInk: '#22302A', outroSub: '#59685F', outroAccent: '#33685A' };

const PORT = 8996;
const ORIGIN = 'http://localhost:' + PORT;
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const srv = http.createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); s.end(html); });

const TMP = path.join(process.cwd(), '.demo-video-tmp');
const OUT = path.join(process.cwd(), 'foothold-demo-' + THEME + '.webm');

function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const sandbox = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  return fs.existsSync(sandbox) ? sandbox : undefined; // undefined → Playwright's own install
}

const CHROME = `
(function () {
  function onReady(fn) { if (document.body) fn(); else document.addEventListener('DOMContentLoaded', fn); }
  onReady(function () {
    var cur = document.createElement('div');
    cur.id = 'demo-cursor';
    cur.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-200px,-200px);transition:none;';
    cur.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2 L4 19 L8.5 15.2 L11.2 21.5 L14 20.2 L11.3 14 L17 13.6 Z" fill="${P.cursorFill}" stroke="${P.cursorStroke}" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cur);
    document.addEventListener('mousemove', function (e) {
      cur.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    }, true);
    document.addEventListener('mousedown', function (e) {
      var r = document.createElement('div');
      r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;left:' + (e.clientX - 14) + 'px;top:' + (e.clientY - 14) + 'px;width:28px;height:28px;border-radius:50%;border:2.5px solid ${P.ripple};opacity:0.9;transform:scale(0.4);transition:transform 0.45s ease, opacity 0.45s ease;';
      document.body.appendChild(r);
      requestAnimationFrame(function () { r.style.transform = 'scale(1.5)'; r.style.opacity = '0'; });
      setTimeout(function () { r.remove(); }, 500);
    }, true);
    var cap = document.createElement('div');
    cap.id = 'demo-caption';
    cap.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(10px);z-index:2147483640;background:${P.capBg};color:${P.capInk};padding:12px 22px;border-radius:999px;font-family:system-ui,sans-serif;font-size:17.5px;line-height:1.35;max-width:76%;text-align:center;opacity:0;transition:opacity 0.35s ease, transform 0.35s ease;box-shadow:0 8px 24px -8px ${P.capShadow};';
    document.body.appendChild(cap);
    window.__caption = function (text) {
      if (!text) { cap.style.opacity = '0'; cap.style.transform = 'translateX(-50%) translateY(10px)'; return; }
      cap.textContent = text;
      cap.style.opacity = '1';
      cap.style.transform = 'translateX(-50%) translateY(0)';
    };
    window.__outro = function () {
      cur.style.display = 'none';
      var o = document.createElement('div');
      o.style.cssText = 'position:fixed;inset:0;z-index:2147483645;background:${P.outroBg};display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.7s ease;';
      o.innerHTML = '<div style="text-align:center;font-family:Newsreader,Georgia,serif;color:${P.outroInk}">' +
        '<svg width="64" height="64" viewBox="0 0 26 26"><rect x="2" y="18" width="9" height="4" rx="2" fill="${P.outroAccent}"/><rect x="8.5" y="11" width="9" height="4" rx="2" fill="${P.outroAccent}" opacity="0.75"/><rect x="15" y="4" width="9" height="4" rx="2" fill="${P.outroAccent}" opacity="0.5"/></svg>' +
        '<div style="font-size:54px;font-weight:500;margin-top:14px">Foothold Now</div>' +
        '<div style="font-size:23px;color:${P.outroSub};margin-top:12px">Practice the hard things—one small step at a time.</div>' +
        '<div style="font-size:21px;color:${P.outroAccent};margin-top:26px;font-weight:600">grhs24.github.io &middot; free</div>' +
        '</div>';
      document.body.appendChild(o);
      requestAnimationFrame(function () { o.style.opacity = '1'; });
    };
  });
})();
`;

(async () => {
  await new Promise(r => srv.listen(PORT, r));
  const browser = await chromium.launch({ executablePath: chromiumPath() });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    colorScheme: THEME,
    recordVideo: { dir: TMP, size: { width: 1280, height: 720 } },
  });
  await ctx.addInitScript(CHROME);
  const pg = await ctx.newPage();
  await pg.route('**/beacon.min.js', r => r.fulfill({ status: 200, body: '' }));

  const t0 = Date.now();
  const wait = ms => pg.waitForTimeout(ms);
  // shows the on-screen caption AND prints a cue-sheet line, so a narrator
  // knows when each scene starts (see scripts/demo-narration.md)
  const caption = async (t) => {
    if (t) console.log('cue ' + ((Date.now() - t0) / 1000).toFixed(1) + 's  ' + t);
    await pg.evaluate(x => window.__caption(x), t);
  };
  async function center(sel) {
    const b = await pg.locator(sel).first().boundingBox();
    return { x: b.x + b.width / 2, y: b.y + b.height / 2, box: b };
  }
  async function move(sel, dy) {
    const c = await center(sel);
    await pg.mouse.move(c.x, c.y + (dy || 0), { steps: 28 });
    await wait(220);
    return c;
  }
  async function click(sel) {
    await move(sel);
    await pg.mouse.down(); await wait(90); await pg.mouse.up();
    await wait(350);
  }
  async function type(sel, text) {
    await click(sel);
    await pg.keyboard.type(text, { delay: 34 });
    await wait(280);
  }
  // drag a range input's thumb to a value (min 0, max 100), then snap exactly
  async function slide(sel, to) {
    const loc = pg.locator(sel).first();
    const b = await loc.boundingBox();
    const cur = parseInt(await loc.evaluate(e => e.value), 10);
    const pad = 9; // half the thumb, so 0 and 100 land on the track ends
    const xFor = v => b.x + pad + (v / 100) * (b.width - pad * 2);
    const y = b.y + b.height / 2;
    await pg.mouse.move(xFor(cur), y, { steps: 20 });
    await wait(140);
    await pg.mouse.down();
    await pg.mouse.move(xFor(to), y, { steps: 30 });
    await pg.mouse.up();
    await loc.evaluate((e, v) => { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, to);
    await wait(320);
  }

  // ---- the walkthrough ----
  await pg.goto(ORIGIN + '/');
  await pg.waitForSelector('.welcome');
  await pg.mouse.move(640, 250, { steps: 5 });
  await caption('This is Foothold Now—a quiet place to practice the hard things.');
  await wait(4200);

  await caption('Start with something you’ve been avoiding.');
  await click('.welcome [data-action="new-ladder"]');
  await type('#nl-name', 'Driving on the highway again');
  await type('#nl-why', 'I want road trips back in my life.');
  await click('[data-form="create-ladder"] button[type=submit]');
  await wait(900);

  await caption('Break it into small steps, written in your own words…');
  await type('.add-step [name="title"]', 'Drive to the grocery store');
  await caption('…and rate each one 0–100 by how hard it feels right now.');
  await slide('.add-step input[name="rating"]', 50);
  await click('.add-step button[type=submit]');
  await wait(600);

  await type('.add-step [name="title"]', 'Sit in the driver’s seat in the driveway');
  await slide('.add-step input[name="rating"]', 20);
  await click('.add-step button[type=submit]');
  await wait(500);
  await caption('The ladder orders itself—gentlest first.');
  await wait(1400);

  await type('.add-step [name="title"]', 'One highway exit, off-peak');
  await slide('.add-step input[name="rating"]', 70);
  await click('.add-step button[type=submit]');
  await wait(500);

  await type('.add-step [name="title"]', 'Drive around the block');
  await slide('.add-step input[name="rating"]', 35);
  await click('.add-step button[type=submit]');
  await wait(1100);

  await caption('Pick a gentle step and practice on purpose.');
  await click('.rung .rung-head');
  await pg.waitForSelector('form[data-form="log"]');
  await wait(700);

  await caption('Afterward, log how it felt—before, at the peak, and after.');
  const sid = await pg.$eval('form[data-form="log"]', f => f.getAttribute('data-id'));
  await slide('#lg-peak-' + sid, 45);
  await slide('#lg-after-' + sid, 10);
  await type('form[data-form="log"] input[name="note"]', 'Shaky at first—settled fast.');
  await click('form[data-form="log"] button[type=submit]');
  await wait(1800);

  await caption('Keep practicing. When a step reaches zero, it settles on its own.');
  await slide('#lg-after-' + sid, 0);
  await click('form[data-form="log"] button[type=submit]');
  await wait(3400);

  await caption('Every ladder shows your footholds—settled steps, practices, progress.');
  await click('[data-action="go-home"]');
  await pg.waitForSelector('.ladder-card');
  await pg.mouse.move(640, 300, { steps: 20 });
  await wait(3400);

  await caption('');
  console.log('cue ' + ((Date.now() - t0) / 1000).toFixed(1) + 's  [outro card]');
  await pg.evaluate(() => window.__outro());
  await wait(4600);

  await ctx.close();
  const files = fs.readdirSync(TMP).filter(f => f.endsWith('.webm'));
  fs.renameSync(path.join(TMP, files[0]), OUT);
  await browser.close();
  srv.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log('demo written: ' + OUT + ' (' + kb + ' KB, ' + THEME + ' mode)');
})().catch(e => { console.error(e); process.exit(1); });
