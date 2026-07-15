// Stripe → Supabase subscription webhook.
//
// Scaffolding for launch; it is NOT active during beta (nothing charges anyone
// while GATE.mode is 'beta' and no checkout link is wired). This is an
// alternative to supabase/functions/lemonsqueezy-webhook — pick one payment
// provider at launch; both write ONLY profiles.sub_status (this one also binds
// profiles.stripe_customer_id once, at checkout) and never touch is_comped, so
// a comped account can’t be downgraded by a billing event.
//
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
//          automatically.)
//
// In Stripe: Developers → Webhooks → add an endpoint at this function’s URL,
// subscribe to checkout.session.completed and the customer.subscription.*
// events, then copy the endpoint’s signing secret (whsec_...) into
// STRIPE_WEBHOOK_SECRET. Run it in Test mode end-to-end before going live.
//
// The rest of this file is intentionally written as untyped JS (valid inside a
// .ts for Deno) so the signature/normalization helpers can be unit-tested
// under Node without a TypeScript step.

import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();
const TOLERANCE_SECONDS = 300; // reject signatures older than 5 minutes (replay guard)

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function toHex(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

// Verify Stripe's Stripe-Signature header (format: t=timestamp,v1=hexsig[,v1=…]).
// The signed payload is `${t}.${rawBody}`; valid if any v1 matches and the
// timestamp is within tolerance.
async function stripeSignatureValid(secret, rawBody, header) {
  if (!header) return false;
  let t = "";
  const sigs = [];
  for (const part of header.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") sigs.push(v);
  }
  if (!t || !sigs.length) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(t, 10));
  if (!Number.isFinite(age) || age > TOLERANCE_SECONDS) return false;
  const expected = await hmacHex(secret, t + "." + rawBody);
  return sigs.some(function (s) { return timingSafeEqual(s, expected); });
}

// Map a Stripe subscription.status onto the vocabulary the app's isEntitled()
// already understands (the same words the Lemon Squeezy webhook writes), so the
// front end stays payment-provider-agnostic.
function normalizeStatus(status) {
  if (status === "trialing") return "on_trial";
  if (status === "canceled") return "cancelled";
  return status; // active | past_due | unpaid | incomplete | incomplete_expired | paused
}

// The Supabase user id, set at checkout via client_reference_id and/or
// subscription metadata (user_id). Metadata is preferred because it rides along
// on every later subscription lifecycle event, regardless of event ordering.
function userIdFrom(obj) {
  if (!obj) return null;
  return (obj.metadata && obj.metadata.user_id) ||
    obj.client_reference_id ||
    null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!secret) return new Response("webhook secret not configured", { status: 500 });

  const rawBody = await req.text();
  const ok = await stripeSignatureValid(secret, rawBody, req.headers.get("Stripe-Signature") ?? "");
  if (!ok) return new Response("invalid signature", { status: 401 });

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const type = event?.type ?? "";
  const object = event?.data?.object ?? {};

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );

  // Checkout finished: bind Stripe customer → Supabase user (so lifecycle
  // events that carry only a customer id can still find the row), and mark
  // the subscription active. A trial's precise status is corrected by the
  // customer.subscription.* event that follows.
  if (type === "checkout.session.completed") {
    const userId = userIdFrom(object);
    if (!userId) return new Response("no user id on checkout session", { status: 200 });
    const patch = { sub_status: "active" };
    if (object.customer) patch.stripe_customer_id = object.customer;
    const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
    if (error) return new Response("db error: " + error.message, { status: 500 });
    return new Response("ok", { status: 200 });
  }

  // Subscription created / changed / ended: update sub_status, keyed by the
  // metadata user_id when present, otherwise by the bound customer id.
  if (type === "customer.subscription.created" ||
      type === "customer.subscription.updated" ||
      type === "customer.subscription.deleted") {
    const status = type === "customer.subscription.deleted"
      ? "cancelled"
      : normalizeStatus(object.status ?? "");
    if (!status) return new Response("no status", { status: 200 });
    const metaUserId = object.metadata && object.metadata.user_id;
    const customer = object.customer;
    if (!metaUserId && !customer) return new Response("no key to match a profile", { status: 200 });
    let query = supabase.from("profiles").update({ sub_status: status }); // sub_status only — is_comped is off limits
    query = metaUserId ? query.eq("id", metaUserId) : query.eq("stripe_customer_id", customer);
    const { error } = await query;
    if (error) return new Response("db error: " + error.message, { status: 500 });
    return new Response("ok", { status: 200 });
  }

  return new Response("ignored", { status: 200 });
});
