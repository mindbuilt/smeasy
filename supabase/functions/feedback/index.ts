// Beta feedback from a signed-in manager.
//   POST /functions/v1/feedback  { kind: "bug" | "idea", message, page_url, user_agent, viewport, diagnostics?, screenshot? }  ->  { ok }
// The manager's JWT says who they are (and RLS which business is theirs); the browser never
// sends its own name, email or business. Saves to public.beta_feedback, stores any screenshot
// in the private beta-feedback bucket, and emails the founder inbox through Resend with
// Reply-To set to the manager.
//
// Secrets: RESEND_API_KEY. Optional: FEEDBACK_TO (default hello@smeasy.au), ROSTER_EMAIL_FROM (default hello@smeasy.au).

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const FROM = Deno.env.get("ROSTER_EMAIL_FROM") ?? "hello@smeasy.au";
const TO = Deno.env.get("FEEDBACK_TO") ?? "hello@smeasy.au";
const MAX_SHOT = 2 * 1024 * 1024; // bytes, matches the bucket limit

function publicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
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
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const asUser = createClient(SUPABASE_URL, publicKey(), { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: "Please log in again." }, 401);
    const { data: business } = await asUser.from("businesses").select("id, name").maybeSingle();

    const body = await req.json().catch(() => ({}));
    const kind = body.kind === "idea" ? "idea" : "bug";
    const message = clip(body.message, 5000).trim();
    if (!message) return json({ error: "Tell us what happened first." }, 400);
    const pageUrl = clip(body.page_url, 500);
    const userAgent = clip(body.user_agent, 400);
    const viewport = clip(body.viewport, 40);
    const diagnostics = Array.isArray(body.diagnostics) ? body.diagnostics.slice(-20).map((d: unknown) => clip(d, 300)) : [];

    // Screenshot: a data URL from the browser (already shrunk there).
    let shot: { bytes: Uint8Array; type: string; ext: string; b64: string } | null = null;
    const m = typeof body.screenshot === "string" ? body.screenshot.match(/^data:(image\/(png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/) : null;
    if (m) {
      const bytes = Uint8Array.from(atob(m[3]), (c) => c.charCodeAt(0));
      if (bytes.length > MAX_SHOT) return json({ error: "That screenshot is too big. Try a smaller one." }, 413);
      shot = { bytes, type: m[1], ext: m[2] === "jpeg" ? "jpg" : m[2], b64: m[3] };
    }

    const admin = createClient(SUPABASE_URL, serviceKey());
    let screenshotPath: string | null = null;
    if (shot) {
      screenshotPath = `${business?.id ?? "no-business"}/${crypto.randomUUID()}.${shot.ext}`;
      const { error } = await admin.storage.from("beta-feedback").upload(screenshotPath, shot.bytes, { contentType: shot.type });
      if (error) { console.error("screenshot upload failed", error); screenshotPath = null; }
    }

    const { data: row, error: insertError } = await admin.from("beta_feedback").insert({
      kind, message, user_id: user.id, user_email: user.email ?? null,
      business_id: business?.id ?? null, business_name: business?.name ?? null,
      page_url: pageUrl, user_agent: userAgent, viewport, diagnostics, screenshot_path: screenshotPath,
    }).select("id").single();
    if (insertError) throw insertError;

    // Email the founder. If this fails the feedback is still saved, so the manager still gets a thank-you.
    const key = Deno.env.get("RESEND_API_KEY");
    if (key) {
      const label = kind === "bug" ? "Bug" : "Idea";
      const preview = message.replace(/\s+/g, " ").slice(0, 60) + (message.length > 60 ? "…" : "");
      const who = business?.name ?? user.email ?? "a manager";
      const context: [string, string][] = [
        ["From", user.email ?? "(no email)"],
        ["Business", business ? `${business.name} (${business.id})` : "(none yet)"],
        ["User ID", user.id],
        ["Page", pageUrl],
        ["Browser", userAgent],
        ["Viewport", viewport],
        ["Time", new Date().toISOString()],
        ["Screenshot", screenshotPath ? `attached · storage: beta-feedback/${screenshotPath}` : "none"],
        ["Feedback ID", row.id],
      ];
      const html = `<div style="font-family:Figtree,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#111827">
        <p style="white-space:pre-wrap;margin:0 0 20px">${esc(message)}</p>
        <table style="font-size:13px;color:#4b5563;border-top:1px solid #e5e7eb;padding-top:10px">
          ${context.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;vertical-align:top;white-space:nowrap"><strong>${esc(k)}</strong></td><td>${esc(v)}</td></tr>`).join("")}
        </table>
        ${diagnostics.length ? `<p style="font-size:13px;color:#4b5563;margin:14px 0 4px"><strong>Recent errors</strong></p><pre style="font-size:12px;background:#f3f4f6;padding:10px;border-radius:8px;white-space:pre-wrap">${esc(diagnostics.join("\n"))}</pre>` : ""}
      </div>`;
      const text = `${message}\n\n---\n${context.map(([k, v]) => `${k}: ${v}`).join("\n")}${diagnostics.length ? `\n\nRecent errors:\n${diagnostics.join("\n")}` : ""}`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `SMEasy Beta <${FROM}>`, to: [TO],
          reply_to: user.email ? [user.email] : undefined,
          subject: `[SMEasy Beta - ${label}] ${preview} from ${who}`,
          html, text,
          attachments: shot ? [{ filename: `screenshot.${shot.ext}`, content: shot.b64 }] : undefined,
        }),
      });
      if (res.ok) await admin.from("beta_feedback").update({ emailed: true }).eq("id", row.id);
      else console.error("feedback email failed", res.status, await res.text());
    } else {
      console.error("feedback email skipped: RESEND_API_KEY not set");
    }

    return json({ ok: true });
  } catch (e) {
    console.error("feedback error", e);
    return json({ error: "Couldn't send that. Please try again." }, 500);
  }
});
