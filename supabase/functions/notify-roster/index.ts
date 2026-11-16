// Email staff their shifts for a published week.
//   POST /functions/v1/notify-roster  { "roster_id": "...", "kind": "published" | "update" }
//   -> { sent: string[], noEmail: string[], off: string[] }
// Called by the signed-in manager (their JWT + RLS decide which roster they can
// send). Each rostered person with an email gets their own shifts and their
// personal link. Sent through Resend from hello@smeasy.au, replies go to the manager.
//
// Secrets: RESEND_API_KEY. Optional: ROSTER_EMAIL_FROM (default hello@smeasy.au), SITE_URL.

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.smeasy.au";
const FROM = Deno.env.get("ROSTER_EMAIL_FROM") ?? "hello@smeasy.au";

function publicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ── Dates, same wording as the app ─────────────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parse = (d: string) => { const [y, m, day] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, day)); };
const fmtDay = (d: string) => { const dt = parse(d); return `${DAYS[(dt.getUTCDay() + 6) % 7]} ${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]}`; };
const fmtShort = (d: string) => { const dt = parse(d); return `${dt.getUTCDate()} ${MONTHS[dt.getUTCMonth()]}`; };
const addDays = (d: string, n: number) => { const dt = parse(d); dt.setUTCDate(dt.getUTCDate() + n); return dt.toISOString().slice(0, 10); };
const fmtTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type Shift = { date: string; start_time: string; end_time: string; break_minutes: number; role: string | null; notes: string | null; staff_id: string };
type Person = { id: string; name: string; email: string | null; email_roster: boolean; roster_token: string };

function emailFor(p: Person, business: string, weekStart: string, shifts: Shift[], notes: Map<string, string>, kind: string) {
  const first = p.name.split(" ")[0];
  const range = `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))}`;
  const link = `${SITE_URL}/s/#${p.roster_token}`;
  const stop = `${SITE_URL}/s/?stop=1#${p.roster_token}`;
  const mine = shifts.filter((s) => s.staff_id === p.id).sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  const subject = kind === "update" ? `Roster updated: ${range} · ${business}` : `Your roster for ${range} · ${business}`;
  const intro = kind === "update" ? `Your shifts for ${range} have changed. Here's the latest:` : `Here are your shifts for ${range}:`;

  const line = (s: Shift) => `${fmtTime(s.start_time)} – ${fmtTime(s.end_time)}${s.role ? ` · ${s.role}` : ""}${s.break_minutes ? ` · ${s.break_minutes}m break` : ""}`;
  const rows = mine.map((s) => `
      <tr><td style="padding:10px 0;border-top:1px solid #eef0f3;vertical-align:top;width:110px;font-weight:700;color:#111827">${esc(fmtDay(s.date))}</td>
      <td style="padding:10px 0;border-top:1px solid #eef0f3;color:#111827">${esc(line(s))}${s.notes ? `<div style="color:#6b7280;font-size:14px;margin-top:2px">${esc(s.notes)}</div>` : ""}${notes.get(s.date) ? `<div style="color:#6b7280;font-size:14px;margin-top:2px">${esc(notes.get(s.date)!)}</div>` : ""}</td></tr>`).join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:Figtree,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:28px 16px">
    <div style="font-weight:800;font-size:16px;color:#111827;margin:0 0 14px"><span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:#b7e021;vertical-align:-2px;margin-right:7px"></span>${esc(business)}</div>
    <div style="background:#ffffff;border-radius:16px;padding:24px 22px;box-shadow:0 1px 2px rgba(17,24,39,0.04),0 2px 8px rgba(17,24,39,0.06)">
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 6px;color:#111827">Hi ${esc(first)}</h1>
      <p style="font-size:16px;color:#4b5563;margin:0 0 14px;line-height:1.5">${esc(intro)}</p>
      <table role="presentation" style="width:100%;border-collapse:collapse;font-size:16px;line-height:1.4">${rows}</table>
      <p style="margin:22px 0 0"><a href="${link}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:12px 20px;border-radius:10px">See the full roster</a></p>
      <p style="font-size:14px;color:#6b7280;margin:14px 0 0;line-height:1.5">Your link also lets you request time off and add shifts to your phone calendar. Questions? Just reply to this email.</p>
    </div>
    <p style="font-size:12px;color:#6b7280;margin:16px 4px 0;line-height:1.5">Sent by SMEasy for ${esc(business)}. <a href="${stop}" style="color:#6b7280">Stop roster emails</a></p>
  </div></body></html>`;

  const text = [`Hi ${first},`, "", intro, "", ...mine.map((s) => `${fmtDay(s.date)}: ${line(s)}${s.notes ? ` (${s.notes})` : ""}`), "",
    `See the full roster: ${link}`, "", `Sent by SMEasy for ${business}. Stop roster emails: ${stop}`].join("\n");

  return { subject, html, text, stop };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const key = Deno.env.get("RESEND_API_KEY");
    if (!key) return json({ error: "Roster emails aren't set up yet." }, 500);

    const sb = createClient(SUPABASE_URL, publicKey(), { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: "Please log in again." }, 401);

    const { roster_id, kind = "published" } = await req.json().catch(() => ({}));
    if (!roster_id) return json({ error: "Which week?" }, 400);

    // RLS: only the manager's own business, roster, staff and shifts come back.
    const [{ data: business }, { data: roster }] = await Promise.all([
      sb.from("businesses").select("id, name").maybeSingle(),
      sb.from("rosters").select("id, week_start, status").eq("id", roster_id).maybeSingle(),
    ]);
    if (!business || !roster) return json({ error: "Couldn't find that roster." }, 404);
    if (roster.status !== "published") return json({ error: "Publish the week first." }, 400);

    const weekEnd = addDays(roster.week_start, 6);
    const [{ data: shifts }, { data: staff }, { data: dayNotes }] = await Promise.all([
      sb.from("shifts").select("date, start_time, end_time, break_minutes, role, notes, staff_id").eq("roster_id", roster.id).not("staff_id", "is", null),
      sb.from("staff").select("id, name, email, email_roster, roster_token").eq("active", true),
      sb.from("day_notes").select("date, note").gte("date", roster.week_start).lte("date", weekEnd),
    ]);
    const notes = new Map((dayNotes ?? []).map((n) => [n.date as string, n.note as string]));
    const rostered = (staff ?? []).filter((p) => (shifts ?? []).some((s) => s.staff_id === p.id)) as Person[];

    const sent: string[] = [], noEmail: string[] = [], off: string[] = [];
    const messages = [];
    for (const p of rostered) {
      if (!p.email) { noEmail.push(p.name); continue; }
      if (!p.email_roster) { off.push(p.name); continue; }
      const m = emailFor(p, business.name, roster.week_start, (shifts ?? []) as Shift[], notes, kind);
      messages.push({
        from: `${business.name.replace(/["<>]/g, "")} via SMEasy <${FROM}>`,
        to: [p.email],
        reply_to: user.email ? [user.email] : undefined,
        subject: m.subject, html: m.html, text: m.text,
        headers: { "List-Unsubscribe": `<${m.stop}>` },
      });
      sent.push(p.name);
    }

    // Resend takes up to 100 emails per batch call.
    for (let i = 0; i < messages.length; i += 100) {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(messages.slice(i, i + 100)),
      });
      if (!res.ok) {
        console.error("resend failed", res.status, await res.text());
        return json({ error: "Couldn't send the emails. Please try again." }, 502);
      }
    }

    return json({ sent, noEmail, off });
  } catch (e) {
    console.error("notify-roster error", e);
    return json({ error: "Couldn't send the emails. Please try again." }, 500);
  }
});
