"use client";

import { C } from "@/lib/theme";
import { roleSwatch } from "@/lib/roleColors";
import { holidayOn } from "@/lib/holidays";

/** Coloured role pill, matching the manager's roster colours. */
export function RolePill({ role, roles }: { role: string | null; roles: string[] }) {
  if (!role) return null;
  const sw = roleSwatch(role, roles);
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color: sw.text, background: sw.bg, border: `1px solid ${sw.border}`, borderRadius: 999, padding: "1px 8px", whiteSpace: "nowrap" }}>
      {role}
    </span>
  );
}

/** Public holiday and the manager's note for a day, if any. */
export function DayExtras({ date, state, dayNotes }: { date: string; state: string | null; dayNotes: { date: string; note: string }[] }) {
  const holiday = holidayOn(date, state);
  const note = dayNotes.find((n) => n.date === date)?.note;
  if (!holiday && !note) return null;
  return (
    <div style={{ fontSize: 12, margin: "2px 0 4px" }}>
      {holiday && <div style={{ color: "#8a2350", fontWeight: 600 }}>Public holiday · {holiday}</div>}
      {note && <div style={{ color: C.secondary, fontStyle: "italic" }}>{note}</div>}
    </div>
  );
}

/** Subscribe to a personal shift calendar that updates itself. */
export function CalendarButtons({ token }: { token: string }) {
  const host = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https:\/\//, "");
  const feed = `${host}/functions/v1/staff-calendar?t=${token}`;
  const webcal = `webcal://${feed}`;
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  const linkStyle = { display: "inline-block", padding: "9px 14px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.white, color: C.dark, fontSize: 14, fontWeight: 600, textDecoration: "none" } as const;
  return (
    <div style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 4px" }}>Shifts in your phone&apos;s calendar</h2>
      <p style={{ fontSize: 13, color: C.secondary, margin: "0 0 10px", lineHeight: 1.5 }}>
        Subscribe once and your published shifts appear in your calendar — and stay up to date when the roster changes.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={webcal} style={linkStyle}>iPhone / Mac / Outlook</a>
        <a href={google} target="_blank" rel="noreferrer" style={linkStyle}>Google Calendar</a>
      </div>
      <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Your calendar app checks for changes every few hours.</p>
    </div>
  );
}
