#!/usr/bin/env node
// Generate one unique, single-use Stripe promotion code per beta user.
//
// Why: a single shared code (e.g. BETA50) is trivial to pass around. Issuing a
// distinct code per person with max_redemptions=1 means a leaked code burns
// itself out after one use, so the discount can't spread beyond your beta list.
//
// This is a LOCAL launch tool — run it on your own machine against your own
// Stripe account. It has no dependencies (Node 18+; uses built-in fetch) and
// talks to Stripe's REST API directly. NEVER commit your Stripe secret key.
//
// Usage:
//   export STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... to rehearse
//   node scripts/generate-beta-coupons.mjs --emails beta.csv
//
// By default it CREATES a 50%-off coupon for you. To reuse an existing coupon:
//   node scripts/generate-beta-coupons.mjs --coupon <coupon_id> --emails beta.csv
//
// Inputs:
//   --emails <file>       CSV / newline list / JSON exported from Supabase's
//                         beta_signups table. Any email-looking tokens are
//                         picked out, so a raw CSV export works. Omit to read
//                         from stdin.
// Coupon (only used when --coupon is NOT given, i.e. we create one):
//   --percent-off <n>     default 50
//   --duration <once|forever|repeating>   default once
//   --months <n>          duration_in_months, required when --duration repeating
//   --max-redemptions <n> cap the coupon's TOTAL redemptions (backstop)
// Per-code:
//   --expires-days <n>    code expiry, days from now (default 30)
//   --prefix <str>        code prefix (default BETA), e.g. BETA-7Q4KX9
//   --out <file>          output CSV (default beta-codes.csv), columns email,code,expires_at
//   --dry-run             make no changes; print what would happen
//   --help
//
// Re-runs are safe: codes already created for an email (tracked in the code's
// metadata) are skipped and still written to the output CSV, so the CSV is
// always the complete email→code mapping.

import fs from 'node:fs';
import crypto from 'node:crypto';

const API = 'https://api.stripe.com/v1';
// Unambiguous alphabet — no 0/O/1/I/L, so codes are easy to read and retype.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    let t = argv[i];
    if (!t.startsWith('--')) continue;
    t = t.slice(2);
    const eq = t.indexOf('=');
    if (eq !== -1) { a[t.slice(0, eq)] = t.slice(eq + 1); continue; }
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { a[t] = true; }
    else { a[t] = next; i++; }
  }
  return a;
}

function die(msg) { console.error('error: ' + msg); process.exit(1); }

function readEmails(file) {
  let text;
  if (file) {
    if (!fs.existsSync(file)) die('emails file not found: ' + file);
    text = fs.readFileSync(file, 'utf8');
  } else {
    try { text = fs.readFileSync(0, 'utf8'); } catch { text = ''; }
  }
  const found = text.match(/[^\s,;"'<>()]+@[^\s,;"'<>()]+\.[^\s,;"'<>()]+/g) || [];
  const seen = new Set();
  const out = [];
  for (const raw of found) {
    const e = raw.trim().toLowerCase().replace(/[.,;]+$/, '');
    if (!seen.has(e)) { seen.add(e); out.push(e); }
  }
  return out;
}

function randomCode(prefix) {
  let s = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return prefix + '-' + s;
}

async function stripe(secret, method, path, form) {
  const init = {
    method,
    headers: {
      Authorization: 'Basic ' + Buffer.from(secret + ':').toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (form) init.body = form.toString();
  const res = await fetch(API + path, init);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((json && json.error && json.error.message) || ('HTTP ' + res.status));
    err.code = json && json.error && json.error.code;
    err.status = res.status;
    throw err;
  }
  return json;
}

// Fetch every promotion code on a coupon, so re-runs skip already-issued users.
async function existingCodesForCoupon(secret, couponId) {
  const byEmail = new Map();
  let startingAfter = null;
  for (;;) {
    const qs = new URLSearchParams({ coupon: couponId, limit: '100' });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const page = await stripe(secret, 'GET', '/promotion_codes?' + qs.toString());
    for (const pc of page.data || []) {
      const email = pc.metadata && pc.metadata.email;
      if (email && !byEmail.has(email)) byEmail.set(email, pc.code);
    }
    if (!page.has_more || !page.data || !page.data.length) break;
    startingAfter = page.data[page.data.length - 1].id;
  }
  return byEmail;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(fs.readFileSync(new URL(import.meta.url)).toString().split('\n')
      .filter(l => l.startsWith('//')).map(l => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }

  const dryRun = !!args['dry-run'];
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret && !dryRun) die('set STRIPE_SECRET_KEY (sk_test_… to rehearse, sk_live_… for real)');
  if (secret && /^sk_live_/.test(secret)) console.error('! using a LIVE key — real coupons will be created\n');

  const emails = readEmails(args.emails);
  if (!emails.length) die('no email addresses found in the input');
  console.error('found ' + emails.length + ' beta email(s)');

  const prefix = (args.prefix || 'BETA').toString().replace(/[^A-Za-z0-9]/g, '') || 'BETA';
  const expiresDays = parseInt(args['expires-days'] || '30', 10);
  if (!Number.isFinite(expiresDays) || expiresDays < 1) die('--expires-days must be a positive integer');
  const expiresAt = Math.floor(Date.now() / 1000) + expiresDays * 86400;
  const outFile = args.out || 'beta-codes.csv';

  // Resolve the coupon (reuse or create). No `applies_to[products]` restriction
  // is set, so the coupon is valid on ANY price the customer selects at
  // checkout — the $1.99/mo plan AND the $19.99/yr plan. A beta user therefore
  // gets 50% off whichever plan they choose. (With duration=once that's 50% off
  // their first invoice: ~$10 off year one for annual, one month for monthly;
  // use --duration repeating --months 12 if you want both plans ~half-off for
  // the first year.)
  let couponId = args.coupon;
  if (!couponId) {
    const percentOff = parseInt(args['percent-off'] || '50', 10);
    const duration = (args.duration || 'once').toString();
    const form = new URLSearchParams({ percent_off: String(percentOff), duration });
    if (duration === 'repeating') {
      const months = parseInt(args.months || '', 10);
      if (!Number.isFinite(months) || months < 1) die('--duration repeating needs --months <n>');
      form.set('duration_in_months', String(months));
    }
    if (args['max-redemptions']) form.set('max_redemptions', String(parseInt(args['max-redemptions'], 10)));
    form.set('name', percentOff + '% off — beta');
    if (dryRun) {
      console.error('[dry-run] would create coupon: ' + form.toString());
      couponId = 'DRYRUN_COUPON';
    } else {
      const coupon = await stripe(secret, 'POST', '/coupons', form);
      couponId = coupon.id;
      console.error('created coupon ' + couponId + ' (' + percentOff + '% off, duration=' + duration + ')');
    }
  } else {
    console.error('reusing coupon ' + couponId);
  }

  const already = dryRun ? new Map() : await existingCodesForCoupon(secret, couponId);
  if (already.size) console.error('skipping ' + already.size + ' email(s) that already have a code');

  const rows = [['email', 'code', 'expires_at']];
  let created = 0, skipped = 0, failed = 0;

  for (const email of emails) {
    if (already.has(email)) { rows.push([email, already.get(email), '']); skipped++; continue; }
    if (dryRun) { rows.push([email, randomCode(prefix), new Date(expiresAt * 1000).toISOString()]); created++; continue; }

    let done = false;
    for (let attempt = 0; attempt < 5 && !done; attempt++) {
      const code = randomCode(prefix);
      const form = new URLSearchParams();
      form.set('coupon', couponId);
      form.set('code', code);
      form.set('max_redemptions', '1');
      form.set('expires_at', String(expiresAt));
      form.set('metadata[email]', email);
      try {
        await stripe(secret, 'POST', '/promotion_codes', form);
        rows.push([email, code, new Date(expiresAt * 1000).toISOString()]);
        created++; done = true;
      } catch (e) {
        // A code collision is rare; just retry with a fresh code. Anything else
        // is a real error for this email — record and move on.
        if (/already/i.test(e.message) && attempt < 4) continue;
        console.error('  failed for ' + email + ': ' + e.message);
        failed++; done = true;
      }
    }
  }

  const csv = rows.map(r => r.map(f => (/[",\n]/.test(f) ? '"' + f.replace(/"/g, '""') + '"' : f)).join(',')).join('\n') + '\n';
  fs.writeFileSync(outFile, csv);
  console.error('\ncreated ' + created + ', skipped ' + skipped + ', failed ' + failed);
  console.error('wrote ' + outFile + (dryRun ? ' (dry run — no Stripe changes made)' : ''));
  console.error('next: enable "Allow promotion codes" on your Payment Link, then email each user their code.');
  if (failed) process.exit(1);
}

main().catch(e => { console.error('error: ' + (e && e.message || e)); process.exit(1); });
