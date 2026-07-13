// Lemon Squeezy → Supabase subscription webhook.
//
// Deploy:  supabase functions deploy lemonsqueezy-webhook --no-verify-jwt
// Secrets: supabase secrets set LEMONSQUEEZY_WEBHOOK_SECRET=<your signing secret>
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.)
//
// In Lemon Squeezy: Settings → Webhooks → point at this function's URL, choose
// the subscription_* events, and use the same signing secret.
//
// This function updates ONLY profiles.sub_status. It never reads or writes
// is_comped, so comped accounts (yours) can never be downgraded by billing
// events.

import { createClient } from "npm:@supabase/supabase-js@2";

const encoder = new TextEncoder();

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function signatureValid(secret: string, rawBody: string, header: string): Promise<boolean> {
  if (!header || header.length % 2 !== 0 || /[^0-9a-fA-F]/.test(header.trim())) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  // timing-safe comparison happens inside crypto.subtle.verify
  return crypto.subtle.verify("HMAC", key, hexToBytes(header), encoder.encode(rawBody));
}

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_resumed",
  "subscription_unpaused",
  "subscription_paused",
  "subscription_cancelled",
  "subscription_expired",
  "subscription_payment_failed",
  "subscription_payment_recovered",
]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  const secret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
  if (!secret) return new Response("webhook secret not configured", { status: 500 });

  const rawBody = await req.text();
  const ok = await signatureValid(secret, rawBody, req.headers.get("X-Signature") ?? "");
  if (!ok) return new Response("invalid signature", { status: 401 });

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const name = event?.meta?.event_name ?? "";
  if (!SUBSCRIPTION_EVENTS.has(name)) return new Response("ignored", { status: 200 });

  // user_id arrives because the checkout link passes checkout[custom][user_id].
  const userId = event?.meta?.custom_data?.user_id;
  const status = event?.data?.attributes?.status; // active | on_trial | past_due | paused | cancelled | expired | unpaid
  if (!userId || typeof status !== "string") return new Response("no user_id or status", { status: 200 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { error } = await supabase
    .from("profiles")
    .update({ sub_status: status }) // sub_status only — is_comped is off limits
    .eq("id", userId);

  if (error) return new Response("db error: " + error.message, { status: 500 });
  return new Response("ok", { status: 200 });
});
