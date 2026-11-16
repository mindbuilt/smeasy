// Team roster link → "Email me my personal link".
//   POST /functions/v1/send-my-link  { team_token, email }  ->  { ok: true }   (no login)
// If the email belongs to someone on that business's team, we email them their
// personal link (which knows who they are). The reply is the same either way, so
// the form never reveals who is on the team. At most one email per person per 10 minutes.
//
// Secrets: RESEND_API_KEY. Optional: ROSTER_EMAIL_FROM, SITE_URL.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.smeasy.au";
const FROM = Deno.env.get("ROSTER_EMAIL_FROM") ?? "hello@smeasy.au";

function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const ok = () => new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  try {
    const { team_token, email } = await req.json().catch(() => ({}));
    const addr = String(email ?? "").trim().toLowerCase();
    if (!/^[0-9a-f-]{36}$/i.test(String(team_token ?? "")) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return ok();

    const db = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey());
    const { data: business } = await db.from("businesses").select("id, name").eq("team_token", team_token).maybeSingle();
    if (!business) return ok();
    const { data: person } = await db.from("staff").select("id, name, roster_token, link_sent_at")
      .eq("business_id", business.id).eq("active", true).ilike("email", addr).maybeSingle();
    if (!person) return ok();
    if (person.link_sent_at && Date.now() - new Date(person.link_sent_at).getTime() < 10 * 60_000) return ok();

    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) { console.error("send-my-link: RESEND_API_KEY missing"); return ok(); }
    const link = `${SITE_URL}/s/#${person.roster_token}`;
    const first = person.name.split(" ")[0];
    const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:Figtree,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="font-weight:800;font-size:16px;color:#111827;margin:0 0 14px"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#b7e021;vertical-align:-2px;margin-right:7px"></span>${esc(business.name)}</div>
    <div style="background:#ffffff;border-radius:16px;padding:24px 22px;box-shadow:0 1px 2px rgba(17,24,39,0.04),0 2px 8px rgba(17,24,39,0.06)">
      <h1 style="font-size:22px;margin:0 0 6px;color:#111827">Hi ${esc(first)}</h1>
      <p style="font-size:16px;color:#4b5563;margin:0 0 18px;line-height:1.5">Here's your personal roster link. It shows your shifts first, and lets you request time off and add shifts to your phone's calendar.</p>
      <p style="margin:0"><a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:12px 20px;border-radius:10px">Open my shifts</a></p>
      <p style="font-size:14px;color:#6b7280;margin:16px 0 0;line-height:1.5">Bookmark it or add it to your home screen. It's just for you, so please don't share it.</p>
    </div>
    <p style="font-size:12px;color:#6b7280;margin:16px 4px 0">Sent by SMEasy for ${esc(business.name)} because someone asked for this link on the team roster. If that wasn't you, you can ignore this email.</p>
  </div></body></html>`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${business.name.replace(/["<>]/g, "")} via SMEasy <${FROM}>`, to: [addr],
        subject: `Your roster link · ${business.name}`, html,
        text: `Hi ${first},\n\nHere's your personal roster link: ${link}\n\nIt shows your shifts first, and lets you request time off and add shifts to your phone's calendar. It's just for you, so please don't share it.`,
      }),
    });
    if (!res.ok) console.error("send-my-link resend failed", res.status, await res.text());
    else await db.from("staff").update({ link_sent_at: new Date().toISOString() }).eq("id", person.id);
    return ok();
  } catch (e) {
    console.error("send-my-link error", e);
    return ok();
  }
});
