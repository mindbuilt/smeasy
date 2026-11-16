// Xero Payroll actions for the signed-in manager.
//   POST /functions/v1/xero  { action: "start" }                 -> { url }   (Connect to Xero)
//   POST /functions/v1/xero  { action: "employees" }             -> { employees: [{ id, name }] }
//   POST /functions/v1/xero  { action: "send", roster_id }       -> { results: [{ name, ok, note }] }
//   POST /functions/v1/xero  { action: "disconnect" }            -> { ok }
// The manager's JWT + RLS decide which business, roster and staff they can touch.
// Hours go to Xero as DRAFT timesheets in each employee's pay period; the
// manager still approves them in Xero.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { NotConnected, accessFor, admin, authorizeUrl, disconnect, makeState, payroll, publicKey, xeroDate } from "../_shared/xero.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

// ── Dates and hours (same rules as the app) ────────────────────────────────
const parse = (d: string) => { const [y, m, day] = d.split("-").map(Number); return Date.UTC(y, m - 1, day); };
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const DAY = 86_400_000;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
function hours(start: string, end: string, brk: number) {
  let mins = toMin(end) - toMin(start);
  if (mins <= 0) mins += 24 * 60;
  return Math.max(0, mins - brk) / 60;
}
type Shift = { date: string; staff_id: string; start_time: string; end_time: string; break_minutes: number;
  actual_start: string | null; actual_end: string | null; actual_break_minutes: number | null; no_show: boolean };
const workedHours = (s: Shift) => s.no_show ? 0
  : hours(s.actual_start ?? s.start_time, s.actual_end ?? s.end_time, s.actual_break_minutes ?? s.break_minutes);

const PERIOD_DAYS: Record<string, number> = { WEEKLY: 7, FORTNIGHTLY: 14, FOURWEEKLY: 28 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, publicKey(), { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: "Please log in again." }, 401);
    const { data: business } = await sb.from("businesses").select("id").maybeSingle();
    if (!business) return json({ error: "Set up your business first." }, 400);

    const { action, roster_id } = await req.json().catch(() => ({}));

    if (action === "start") return json({ url: authorizeUrl(await makeState(business.id)) });

    if (action === "disconnect") { await disconnect(business.id); return json({ ok: true }); }

    const a = await accessFor(business.id);

    if (action === "employees") {
      const employees: { id: string; name: string }[] = [];
      for (let page = 1; page <= 10; page++) {
        const data = await payroll(a, `Employees?page=${page}`);
        const list = (data.Employees ?? []) as { EmployeeID: string; FirstName: string; LastName: string; Status: string }[];
        for (const e of list) if (e.Status !== "TERMINATED") employees.push({ id: e.EmployeeID, name: `${e.FirstName ?? ""} ${e.LastName ?? ""}`.trim() });
        if (list.length < 100) break;
      }
      return json({ employees: employees.sort((x, y) => x.name.localeCompare(y.name)) });
    }

    if (action === "send") {
      // RLS: only this manager's roster, shifts and staff.
      const { data: roster } = await sb.from("rosters").select("id, week_start, hours_approved_at").eq("id", roster_id).maybeSingle();
      if (!roster) return json({ error: "Couldn't find that week." }, 404);
      if (!roster.hours_approved_at) return json({ error: "Approve the week's hours first." }, 400);
      const [{ data: shifts }, { data: staff }] = await Promise.all([
        sb.from("shifts").select("date, staff_id, start_time, end_time, break_minutes, actual_start, actual_end, actual_break_minutes, no_show").eq("roster_id", roster.id).not("staff_id", "is", null),
        sb.from("staff").select("id, name, xero_employee_id"),
      ]);

      const calendars = new Map<string, { type: string; start: string }>();
      for (const c of (await payroll(a, "PayrollCalendars")).PayrollCalendars ?? []) {
        calendars.set(c.PayrollCalendarID, { type: c.CalendarType, start: xeroDate(c.StartDate)! });
      }

      const results: { name: string; ok: boolean; note: string }[] = [];
      const people = (staff ?? []).filter((p) => (shifts ?? []).some((s) => s.staff_id === p.id));
      for (const p of people) {
        if (!p.xero_employee_id) { results.push({ name: p.name, ok: false, note: "Not matched to a Xero employee" }); continue; }
        try {
          // Hours per day for this person.
          const byDay = new Map<string, number>();
          for (const s of (shifts ?? []) as Shift[]) if (s.staff_id === p.id) byDay.set(s.date, (byDay.get(s.date) ?? 0) + workedHours(s));

          const emp = (await payroll(a, `Employees/${p.xero_employee_id}`)).Employees?.[0];
          const cal = emp?.PayrollCalendarID ? calendars.get(emp.PayrollCalendarID) : undefined;
          if (!emp?.OrdinaryEarningsRateID) { results.push({ name: p.name, ok: false, note: "No ordinary earnings rate set in Xero" }); continue; }
          if (!cal) { results.push({ name: p.name, ok: false, note: "No pay calendar set in Xero" }); continue; }
          const len = PERIOD_DAYS[cal.type];
          if (!len) { results.push({ name: p.name, ok: false, note: `${cal.type.toLowerCase()} pay calendars aren't supported yet` }); continue; }

          // Group the week's days into the employee's pay period(s).
          const periods = new Map<number, Map<number, number>>();
          for (const [date, h] of byDay) {
            const n = Math.floor((parse(date) - parse(cal.start)) / DAY / len);
            const pStart = parse(cal.start) + n * len * DAY;
            const idx = Math.round((parse(date) - pStart) / DAY);
            if (!periods.has(pStart)) periods.set(pStart, new Map());
            periods.get(pStart)!.set(idx, Math.round(h * 100) / 100);
          }

          let skipped = "";
          for (const [pStart, days] of periods) {
            const start = iso(pStart), end = iso(pStart + (len - 1) * DAY);
            const [y, m, d] = start.split("-").map(Number);
            const where = encodeURIComponent(`EmployeeID==Guid("${p.xero_employee_id}")&&StartDate==DateTime(${y},${m},${d})`);
            const existing = (await payroll(a, `Timesheets?where=${where}`)).Timesheets?.[0];
            if (existing && existing.Status !== "DRAFT") { skipped = "Already approved in Xero for that pay period"; continue; }

            // Keep any other lines and days already on a draft; replace the days from this week.
            const lines = (existing?.TimesheetLines ?? []) as { EarningsRateID: string; NumberOfUnits: number[] }[];
            let line = lines.find((l) => l.EarningsRateID === emp.OrdinaryEarningsRateID);
            if (!line) { line = { EarningsRateID: emp.OrdinaryEarningsRateID, NumberOfUnits: Array(len).fill(0) }; lines.push(line); }
            line.NumberOfUnits = Array.from({ length: len }, (_, i) => days.has(i) ? days.get(i)! : Number(line!.NumberOfUnits?.[i] ?? 0));

            const body = [{ EmployeeID: p.xero_employee_id, StartDate: `${start}T00:00:00`, EndDate: `${end}T00:00:00`, Status: "DRAFT",
              TimesheetLines: lines.map((l) => ({ EarningsRateID: l.EarningsRateID, NumberOfUnits: l.NumberOfUnits })) }];
            if (existing) await payroll(a, `Timesheets/${existing.TimesheetID}`, { method: "POST", body: JSON.stringify(body.map((t) => ({ ...t, TimesheetID: existing.TimesheetID }))) });
            else await payroll(a, "Timesheets", { method: "POST", body: JSON.stringify(body) });
          }
          const total = [...byDay.values()].reduce((x, y) => x + y, 0);
          results.push(skipped ? { name: p.name, ok: false, note: skipped } : { name: p.name, ok: true, note: `${Math.round(total * 100) / 100}h as a draft timesheet` });
        } catch (e) {
          console.error("xero send failed for", p.id, e);
          results.push({ name: p.name, ok: false, note: "Xero didn't accept this one. Check the employee in Xero." });
        }
      }

      const now = new Date().toISOString();
      const db = admin();
      if (results.some((r) => r.ok)) {
        await db.from("rosters").update({ xero_sent_at: now }).eq("id", roster.id);
        await db.from("xero_connections").update({ last_sent_at: now }).eq("business_id", business.id);
      }
      return json({ results });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    if (e instanceof NotConnected) return json({ error: e.message }, 409);
    console.error("xero error", e);
    return json({ error: "Something went wrong talking to Xero. Please try again." }, 500);
  }
});
