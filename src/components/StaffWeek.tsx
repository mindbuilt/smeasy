"use client";

import { dayName, fmtDay, fmtTime, shiftHours, weekDates } from "@/lib/dates";
import { roleSwatch } from "@/lib/roleColors";
import { holidayOn } from "@/lib/holidays";
import { C, card } from "@/components/ui";
import type { StaffShiftView } from "@/components/StaffBits";

type Props = {
  weekStart: string; shifts: StaffShiftView[]; roles: string[]; state: string | null;
  dayNotes: { date: string; note: string }[]; isMine: (s: StaffShiftView) => boolean; youLabel?: boolean; today: string;
};


/** Wide screens: people down the side, days across (the standard roster view). Phones use the list. */
export default function StaffWeek(props: Props) {
  return (
    <div className="staff-week-grid" style={{ width: "min(1120px, calc(100vw - 32px))", position: "relative", left: "50%", transform: "translateX(-50%)" }}>
      <WeekTable {...props} />
    </div>
  );
}

function DayHead({ d, today, state, dayNotes }: { d: string; today: string; state: string | null; dayNotes: { date: string; note: string }[] }) {
  const isToday = d === today;
  const holiday = holidayOn(d, state);
  const note = dayNotes.find((n) => n.date === d)?.note;
  return (
    <div style={{ textAlign: "center", padding: "8px 4px 6px", minWidth: 0 }}>
      <span style={{ display: "block", fontSize: 12, fontWeight: 650, color: isToday ? C.shiftText : C.muted }}>{dayName(d)}</span>
      <span style={{ display: "inline-grid", placeItems: "center", minWidth: 30, height: 30, borderRadius: 999, fontSize: 16, fontWeight: 800, color: C.dark, background: isToday ? C.accent : "transparent" }}>{Number(d.slice(8))}</span>
      {(holiday || note) && <span title={[holiday, note].filter(Boolean).join(" · ")} style={{ display: "block", fontSize: 11, fontWeight: 600, color: holiday ? "#9d174d" : C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{holiday ?? note}</span>}
    </div>
  );
}

/** People down the side, days across: the classic roster table. */
function WeekTable({ weekStart, shifts, roles, state, dayNotes, isMine, youLabel, today }: Props) {
  const days = weekDates(weekStart);
  const people = [...new Set(shifts.map((s) => s.staff_name))].sort((a, b) => a.localeCompare(b));
  const cols = "minmax(120px, 1.3fr) repeat(7, minmax(0, 1fr)) 56px";
  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <div role="row" style={{ display: "grid", gridTemplateColumns: cols, borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ padding: "12px 14px", fontSize: 12, fontWeight: 650, color: C.muted, alignSelf: "end" }}>Staff</div>
        {days.map((d) => <DayHead key={d} d={d} today={today} state={state} dayNotes={dayNotes} />)}
        <div style={{ padding: "12px 6px", fontSize: 12, fontWeight: 650, color: C.muted, textAlign: "center", alignSelf: "end" }}>Hrs</div>
      </div>
      {people.length === 0 && <p style={{ padding: "20px 16px", margin: 0, color: C.muted, fontSize: 14 }}>No shifts this week.</p>}
      {people.map((name, i) => {
        const mine = shifts.filter((s) => s.staff_name === name);
        const me = mine.some(isMine);
        const hrs = mine.reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0);
        return (
          <div key={name} role="row" style={{ display: "grid", gridTemplateColumns: cols, borderTop: i ? `1px solid ${C.divider}` : "none", background: me ? "rgba(183,224,33,0.08)" : undefined }}>
            <div style={{ padding: "10px 14px", fontSize: 14, fontWeight: me ? 800 : 650, color: C.dark, alignSelf: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{me && youLabel ? `${name} (you)` : name}</div>
            {days.map((d) => {
              const cell = mine.filter((s) => s.date === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
              return (
                <div key={d} aria-label={`${name}, ${fmtDay(d)}`} style={{ padding: 4, display: "grid", gap: 3, alignContent: "center", minWidth: 0, background: d === today ? "rgba(183,224,33,0.05)" : undefined }}>
                  {cell.map((s) => {
                    const sw = roleSwatch(s.role, roles);
                    return (
                      <span key={s.id} title={s.notes ?? undefined} style={{ display: "block", borderRadius: 7, padding: "4px 6px", background: sw.bg, color: sw.text, fontSize: 12, fontWeight: 700, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                        {s.role && <span style={{ display: "block", fontWeight: 550, opacity: 0.9 }}>{s.role}</span>}
                      </span>
                    );
                  })}
                </div>
              );
            })}
            <div style={{ fontSize: 14, fontWeight: 750, color: C.dark, textAlign: "center", alignSelf: "center" }}>{hrs.toFixed(1).replace(/\.0$/, "")}</div>
          </div>
        );
      })}
    </div>
  );
}
