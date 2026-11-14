// Calendar subscription feed for one staff member's published shifts.
//   GET /functions/v1/staff-calendar?t=<roster_token>
// Calendar apps (Apple, Google, Outlook) poll this URL, so shifts stay up to
// date without the staff member doing anything. No login: the private
// personal-link token is the key, exactly like the /s/ page.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Shift = {
  id: string; date: string; start_time: string; end_time: string;
  break_minutes: number; role: string | null; notes: string | null; updated: string | null;
};
type Feed = { business: string; timezone: string; staff_name: string; shifts: Shift[] };

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const ymd = (d: string) => d.replaceAll("-", "");
const hms = (t: string) => t.slice(0, 8).replaceAll(":", "");
const stamp = (iso?: string | null) => (iso ? new Date(iso) : new Date()).toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

function addDay(d: string): string {
  const dt = new Date(d + "T00:00:00Z");
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

// RFC 5545: lines longer than 75 octets are folded.
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 75;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 75) cut--;
    out.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  out.push(rest);
  return out.join("\r\n");
}

function toIcs(feed: Feed): string {
  const tz = feed.timezone || "Australia/Sydney";
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Smeasy//Roster//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`${feed.business} shifts`)}`, `X-WR-TIMEZONE:${tz}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H",
  ];
  for (const s of feed.shifts) {
    const endDate = s.end_time <= s.start_time ? addDay(s.date) : s.date; // past midnight
    const desc = [
      s.role ? `Role: ${s.role}` : "",
      s.break_minutes ? `Unpaid break: ${s.break_minutes} min` : "",
      s.notes ? `Note: ${s.notes}` : "",
    ].filter(Boolean).join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${s.id}@smeasy.au`,
      `DTSTAMP:${stamp(s.updated)}`,
      `DTSTART;TZID=${tz}:${ymd(s.date)}T${hms(s.start_time)}`,
      `DTEND;TZID=${tz}:${ymd(endDate)}T${hms(s.end_time)}`,
      `SUMMARY:${esc(`${feed.business}${s.role ? ` · ${s.role}` : ""}`)}`,
      ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(token)) return new Response("Not found", { status: 404 });

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_staff_calendar`, {
    method: "POST",
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_token: token }),
  });
  const feed = res.ok ? ((await res.json()) as Feed | null) : null;
  if (!feed) return new Response("Not found", { status: 404 });

  return new Response(toIcs(feed), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="shifts.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
});
