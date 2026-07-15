// Health check for free uptime monitoring (e.g. UptimeRobot).
//
// - Accepts GET and HEAD only (no auth header required; deploy with
//   verify_jwt = false — see supabase/config.toml).
// - Runs one harmless, lightweight database query (the health_ping() SQL
//   function, which just does `select 1`) so the hit registers as database
//   activity and keeps a free-tier project awake. It touches NO customer
//   data and returns nothing about any customer.
// - 200 when the query succeeds ({"ok":true} for GET, empty body for HEAD).
// - 503 when the query fails.
// - Never returns secrets or error details.
//
// Deploy:  supabase functions deploy health
// URL:     https://<project-ref>.supabase.co/functions/v1/health
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically at
// runtime; they are read from the environment and never hardcoded or returned.

import { createClient } from "jsr:@supabase/supabase-js@2";

// Pure request→response logic. `ping` performs the DB query and throws on
// failure. Kept dependency-free so it is unit-testable on its own.
async function healthHandler(req, ping) {
  const method = req.method.toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, { status: 405 });
  }
  try {
    await ping();
  } catch (_e) {
    // Deliberately no error details in the body—they could leak connection info.
    return new Response(method === "HEAD" ? null : JSON.stringify({ ok: false }), {
      status: 503,
      headers: method === "HEAD" ? {} : { "content-type": "application/json" },
    });
  }
  if (method === "HEAD") {
    return new Response(null, { status: 200 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

// One harmless, lightweight query that touches no customer table: call the
// health_ping() SQL function (returns 1). Uses the service-role key from the
// environment; the key is never exposed or returned.
async function ping() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
  );
  const { error } = await supabase.rpc("health_ping");
  if (error) throw error;
}

Deno.serve((req) => healthHandler(req, ping));

export { healthHandler };
