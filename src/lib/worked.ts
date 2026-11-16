import type { Shift, Staff } from "./types";
import { fmtDay, shiftHours } from "./dates";

// Timesheets: a shift's actual_* fields are null while it was worked as rostered.

const hhmm = (t: string) => t.slice(0, 5);

/** The times actually worked (falling back to the rostered ones). */
export function worked(s: Shift) {
  return {
    start: hhmm(s.actual_start ?? s.start_time),
    end: hhmm(s.actual_end ?? s.end_time),
    breakMinutes: s.actual_break_minutes ?? s.break_minutes,
  };
}

export function workedHours(s: Shift) {
  if (s.no_show) return 0;
  const w = worked(s);
  return shiftHours(w.start, w.end, w.breakMinutes);
}

export function rosteredHours(s: Shift) {
  return shiftHours(s.start_time, s.end_time, s.break_minutes);
}

/** True when what was worked differs from the roster. (Approving fills in the actual times, so compare values.) */
export function changed(s: Shift) {
  const w = worked(s);
  return s.no_show || w.start !== hhmm(s.start_time) || w.end !== hhmm(s.end_time) || w.breakMinutes !== s.break_minutes;
}

export const EMPLOYMENT: Record<string, string> = { full_time: "Full-time", part_time: "Part-time", casual: "Casual" };

/**
 * Hours for payroll: one row per shift (bookkeepers need the day and times for
 * weekend and public-holiday rates), then totals by person. Start, finish and
 * break are what was worked. With Pay details on, payroll ID, rate and base pay are added.
 */
export function downloadHoursCsv({ shifts, staff, pay, weekStart, fileName }: { shifts: Shift[]; staff: Staff[]; pay: boolean; weekStart: string; fileName?: string }) {
  const byId = new Map(staff.map((p) => [p.id, p]));
  const money = (n: number) => n.toFixed(2);
  const rows: string[][] = [[
    "Name", ...(pay ? ["Payroll ID"] : []), "Employment type", "Date", "Day", "Start", "Finish", "Unpaid break (min)", "Rostered hours", "Worked hours", "Role", "Note",
    ...(pay ? ["Hourly rate", "Base pay"] : []),
  ]];
  const sorted = shifts.filter((s) => s.staff_id).sort((a, b) =>
    (byId.get(a.staff_id!)?.name ?? "").localeCompare(byId.get(b.staff_id!)?.name ?? "") ||
    a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
  const totals = new Map<string, { rostered: number; worked: number }>();
  for (const s of sorted) {
    const p = byId.get(s.staff_id!);
    const w = worked(s);
    const r = rosteredHours(s);
    const h = workedHours(s);
    const t = totals.get(s.staff_id!) ?? { rostered: 0, worked: 0 };
    totals.set(s.staff_id!, { rostered: t.rostered + r, worked: t.worked + h });
    const rate = p?.hourly_rate == null ? null : Number(p.hourly_rate);
    rows.push([p?.name ?? "", ...(pay ? [p?.payroll_id ?? ""] : []), EMPLOYMENT[p?.employment_basis ?? ""] ?? "", s.date, fmtDay(s.date).split(" ")[0],
      s.no_show ? "" : w.start, s.no_show ? "" : w.end, s.no_show ? "" : String(w.breakMinutes), r.toFixed(2), h.toFixed(2), s.role ?? "",
      s.no_show ? "Didn't work" : changed(s) ? "Times changed" : "",
      ...(pay ? [rate == null ? "" : money(rate), rate == null ? "" : money(rate * h)] : [])]);
  }
  rows.push([], ["Totals by person"], ["Name", ...(pay ? ["Payroll ID"] : []), "Employment type", "Rostered hours", "Worked hours", ...(pay ? ["Hourly rate", "Base pay"] : [])]);
  for (const p of [...staff].sort((a, b) => a.name.localeCompare(b.name))) {
    const t = totals.get(p.id);
    if (!t) continue;
    const rate = p.hourly_rate == null ? null : Number(p.hourly_rate);
    rows.push([p.name, ...(pay ? [p.payroll_id ?? ""] : []), EMPLOYMENT[p.employment_basis ?? ""] ?? "", t.rostered.toFixed(2), t.worked.toFixed(2),
      ...(pay ? [rate == null ? "" : money(rate), rate == null ? "" : money(rate * t.worked)] : [])]);
  }
  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = fileName ?? `hours-${weekStart}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
