// One-click unsubscribe from roster emails (RFC 8058): mail apps POST here from the List-Unsubscribe-Post header.
//   POST /functions/v1/unsubscribe?t=<roster_token>   -> turns roster emails off
//   GET  /functions/v1/unsubscribe?t=<roster_token>   -> sends the person to the staff page to confirm
// Only switches roster emails off. It can't change an email address or request time off.
// No login: the roster token is the key, the same as the /s/ page.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.smeasy.au";

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });

  if (req.method === "GET") {
    // Mail scanners open links: a GET only shows the confirm page, it changes nothing.
    return Response.redirect(`${SITE_URL}/s/?stop=1#${token}`, 302);
  }
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_roster_emails`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: token, p_on: false }),
  });
  if (!res.ok) return new Response("Could not unsubscribe. Please try again.", { status: 500 });
  return new Response("You're unsubscribed from roster emails.", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
});
