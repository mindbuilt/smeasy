"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays, ChevronLeft, ChevronRight, StickyNote } from "lucide-react";
import { C, Avatar, btn, card } from "@/components/ui";
import { roleSwatch } from "@/lib/roleColors";
import StaffWeek from "@/components/StaffWeek";
import { holidayOn } from "@/lib/holidays";
import { addDays, dayName, fmtDay, fmtTime, fmtWeek, shiftHours, toISO, weekDates } from "@/lib/dates";

export type StaffShiftView = {
  id: string; date: string; start_time: string; end_time: string; break_minutes: number;
  role: string | null; notes?: string | null; staff_name: string; mine?: boolean;
};

/** Coloured role pill, matching the manager's roster colours. */
export function RolePill({ role, roles }: { role: string | null; roles: string[] }) {
  if (!role) return null;
  const sw = roleSwatch(role, roles);
  return (
    <span style={{ fontSize: 13, fontWeight: 700, color: sw.text, background: sw.bg, borderRadius: 999, padding: "3px 10px", whiteSpace: "nowrap" }}>
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
    <div style={{ fontSize: 14, margin: "2px 0 6px", lineHeight: 1.45 }}>
      {holiday && <div style={{ color: "#9d174d", fontWeight: 700 }}>Public holiday · {holiday}</div>}
      {note && <div style={{ color: C.secondary, display: "flex", gap: 6, alignItems: "baseline" }}><StickyNote size={14} style={{ flex: "none", transform: "translateY(2px)" }} />{note}</div>}
    </div>
  );
}

/** A way back into the app when the manager is looking at their own staff pages. Staff see nothing. */
function ManagerLink() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    let cancelled = false;
    supabase().auth.getSession().then(({ data }) => { if (!cancelled && data.session) setSignedIn(true); });
    return () => { cancelled = true; };
  }, []);
  if (!signedIn) return null;
  return <Link href="/week/" className="app-press" style={{ ...btn(), marginLeft: "auto", minHeight: 36, padding: "6px 12px", fontSize: 14, textDecoration: "none" }}>Edit roster</Link>;
}

/** Header + centred column for the staff pages. */
export function StaffShell({ business, children }: { business?: string; children: React.ReactNode }) {
  return (
    <div className="app" style={{ minHeight: "100dvh", background: C.bg }}>
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.92)", backdropFilter: "saturate(180%) blur(12px)", WebkitBackdropFilter: "saturate(180%) blur(12px)", borderBottom: `1px solid ${C.border}`, paddingTop: "env(safe-area-inset-top)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", height: 58, padding: "0 16px", display: "flex", alignItems: "center", gap: 9 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "block", flex: "none" }} />
          <span style={{ fontWeight: 800, fontSize: 17, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{business ?? "SMEasy"}</span>
          <ManagerLink />
        </div>
      </header>
      <main style={{ maxWidth: 600, margin: "0 auto", padding: "18px 16px calc(48px + env(safe-area-inset-bottom))" }}>{children}</main>
    </div>
  );
}

export function StaffFooter({ hint }: { hint: string }) {
  return (
    <div style={{ marginTop: 28, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
      <p style={{ margin: "0 0 8px" }}>{hint}</p>
      <p style={{ margin: 0 }}>
        <Link href="/" style={{ color: C.secondary }}>Made with SMEasy</Link>{" · "}
        <Link href="/privacy/" style={{ color: C.secondary }}>Privacy</Link>{" · "}
        <Link href="/terms/" style={{ color: C.secondary }}>Terms</Link>{" · "}
        <Link href="/auth/login/" style={{ color: C.secondary }}>Manager log in</Link>
      </p>
    </div>
  );
}

export function WeekNav({ weekStart, onStep, onToday }: { weekStart: string; onStep: (n: number) => void; onToday?: () => void }) {
  const round = { ...btn(), width: 44, padding: 0, borderRadius: 999 };
  const today = toISO(new Date());
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}>
      <button onClick={() => onStep(-1)} className="app-press" style={round} aria-label="Previous week"><ChevronLeft size={20} /></button>
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: C.dark, letterSpacing: "-0.01em" }}>{fmtWeek(weekStart)}</div>
        <div style={{ fontSize: 13, color: C.muted }}>
          {today >= weekStart && today <= addDays(weekStart, 6) ? "This week" : <>
            {weekStart > today ? "Coming up" : "Past week"}
            {onToday && <> · <button type="button" onClick={onToday} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.dark, fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Back to this week</button></>}
          </>}
        </div>
      </div>
      <button onClick={() => onStep(1)} className="app-press" style={round} aria-label="Next week"><ChevronRight size={20} /></button>
    </div>
  );
}

function when(date: string, start: string) {
  const now = new Date();
  const today = toISO(now);
  const days = Math.round((Date.parse(date) - Date.parse(today)) / 86400000);
  if (days === 0) {
    const [h, m] = start.split(":").map(Number);
    const mins = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
    if (mins <= 0) return "On now";
    if (mins < 60) return `Today · starts in ${mins} min`;
    return `Today · starts in ${Math.round(mins / 60)}h`;
  }
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days} days`;
  return fmtDay(date);
}

/** The one thing a staff member opens the link for: their next shift. */
export function NextShift({ shifts, roles, totalHours, count, name }: {
  shifts: StaffShiftView[]; roles: string[]; totalHours: number; count: number; name?: string;
}) {
  const now = new Date();
  const today = toISO(now);
  const nowHm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const next = shifts.find((s) => s.date > today || (s.date === today && (s.end_time > nowHm || s.end_time < s.start_time)));
  const sw = next?.role ? roleSwatch(next.role, roles) : null;
  return (
    <section aria-label={name ? `${name}'s next shift` : "Your next shift"} style={{ borderRadius: 20, padding: "18px 18px 16px", background: C.dark, color: C.white, boxShadow: "0 10px 30px rgba(17,24,39,0.18)", marginBottom: 14 }}>
      {next ? (
        <>
          <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
            {name && <Avatar name={name} size={36} tone={{ bg: C.accent, text: C.dark }} />}
            {fmtTime(next.start_time)} – {fmtTime(next.end_time)}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap", fontSize: 15, color: "#e5e7eb" }}>
            <strong style={{ color: C.accent, fontWeight: 800 }}>{when(next.date, next.start_time)}</strong>
            {when(next.date, next.start_time) !== fmtDay(next.date) && <span>{fmtDay(next.date)}</span>}
            {sw && <span style={{ fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: sw.bg, color: sw.text }}>{next.role}</span>}
            {next.break_minutes ? <span style={{ color: "#9ca3af" }}>{next.break_minutes}m break</span> : null}
          </div>
          {next.notes && <div style={{ marginTop: 10, fontSize: 14, color: "#e5e7eb", background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: "8px 12px" }}>{next.notes}</div>}
        </>
      ) : (
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 12, letterSpacing: "-0.01em" }}>
          {name && <Avatar name={name} size={36} tone={{ bg: C.accent, text: C.dark }} />}
          {count ? "All done for this week" : "Not rostered on this week"}
        </h2>
      )}
      <div style={{ display: "flex", gap: 18, marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.12)", fontSize: 14, color: "#d1d5db" }}>
        <span><strong style={{ color: C.white, fontSize: 17 }}>{count}</strong> {count === 1 ? "shift" : "shifts"} this week</span>
        <span><strong style={{ color: C.white, fontSize: 17 }}>{totalHours.toFixed(1).replace(/\.0$/, "")}</strong> hours</span>
      </div>
    </section>
  );
}

/** The week, day by day. Empty days shrink to a line; the reader's own shifts are highlighted. */
export function DayList({ weekStart, shifts, roles, state, dayNotes, isMine, youLabel }: {
  weekStart: string; shifts: StaffShiftView[]; roles: string[]; state: string | null;
  dayNotes: { date: string; note: string }[]; isMine: (s: StaffShiftView) => boolean; youLabel?: boolean;
}) {
  const today = toISO(new Date());
  return (
    <>
      <StaffWeek weekStart={weekStart} shifts={shifts} roles={roles} state={state} dayNotes={dayNotes} isMine={isMine} youLabel={youLabel} today={today} />
    <div className="staff-week-list" style={{ display: "grid", gap: 8 }}>
      {weekDates(weekStart).map((d) => {
        const day = shifts.filter((s) => s.date === d);
        const isToday = d === today;
        const extras = holidayOn(d, state) || dayNotes.some((n) => n.date === d);
        if (!day.length && !extras) {
          return (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 14px", fontSize: 14, color: C.muted }}>
              <span style={{ width: 82, fontWeight: 700 }}>{dayName(d)} {Number(d.slice(8))}</span>
              <span style={{ flex: 1, height: 1, background: C.border }} />
              <span>No shifts</span>
            </div>
          );
        }
        return (
          <section key={d} style={{ ...card, padding: "12px 14px", outline: isToday ? `2px solid ${C.accent}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: 0 }}>{fmtDay(d)}</h3>
              {isToday && <span style={{ fontSize: 12, fontWeight: 700, background: C.accent, color: C.dark, borderRadius: 999, padding: "2px 8px" }}>Today</span>}
            </div>
            <DayExtras date={d} state={state} dayNotes={dayNotes} />
            {day.map((s) => {
              const me = isMine(s);
              return (
                // One compact line per shift, so busy days stay short on a phone.
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", margin: "0 -8px", borderRadius: 10, background: me ? C.shiftBg : "transparent", fontSize: 15 }}>
                  <span style={{ fontWeight: me ? 800 : 700, color: C.dark, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "0 1 auto" }}>{me && youLabel ? "You" : s.staff_name}</span>
                  <span style={{ color: C.secondary, whiteSpace: "nowrap", flex: "none" }}>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                  {s.notes && <span title={s.notes} style={{ color: C.muted, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "1 1 0" }}>{s.notes}</span>}
                  <span style={{ marginLeft: "auto", flex: "none" }}><RolePill role={s.role} roles={roles} /></span>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
    </>
  );
}

export function hoursOf(shifts: StaffShiftView[]) {
  return shifts.reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0);
}

/** Read the link's token from the hash, falling back to the last one saved on this device (installed app). */
export function readToken(key: string): string {
  const h = window.location.hash.slice(1);
  if (h) { try { localStorage.setItem(key, h); } catch { /* private mode */ } return h; }
  try { return localStorage.getItem(key) ?? ""; } catch { return ""; }
}

/** Subscribe to a personal shift calendar that updates itself. */
export function CalendarButtons({ token, onReset }: { token: string; onReset: () => Promise<void> }) {
  const host = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https:\/\//, "");
  const feed = `${host}/functions/v1/staff-calendar?t=${token}`;
  const webcal = `webcal://${feed}`;
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  const [copied, setCopied] = useState(false);
  async function copyLink() {
    await navigator.clipboard.writeText(`https://${feed}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <section id="calendar" style={{ ...card, padding: "16px 16px 14px", marginTop: 14, scrollMarginTop: 72 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: C.dark, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}><CalendarDays size={19} /> Shifts in your phone&apos;s calendar</h2>
      <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 12px", lineHeight: 1.5 }}>
        Subscribe once and your published shifts appear in your calendar, and stay up to date when the roster changes.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a href={webcal} className="app-press" style={{ ...btn("primary"), textDecoration: "none" }}>iPhone / Mac</a>
        <button type="button" onClick={copyLink} className="app-press" style={btn()}>{copied ? "Link copied" : "Copy calendar link"}</button>
        <a href={google} target="_blank" rel="noreferrer" className="app-press" style={{ ...btn(), textDecoration: "none" }}>Google Calendar (computer)</a>
      </div>
      <p style={{ fontSize: 13, color: C.muted, margin: "10px 0 0", lineHeight: 1.5 }}>
        For Android or Outlook, copy the link and add it as a calendar subscription by URL. Calendar apps update on their own schedule, often about once a day, so if a change isn&apos;t showing yet, check again later.
      </p>
      <p style={{ fontSize: 13, color: C.muted, margin: "10px 0 0", lineHeight: 1.5 }}>
        If this link was shared with someone else, <button type="button" onClick={() => { if (window.confirm("Reset the calendar link? Your current calendar subscription will stop updating, so you'll need to add the new link.")) onReset(); }} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.secondary, textDecoration: "underline", cursor: "pointer" }}>reset the calendar link</button>. Your personal link stays the same.
      </p>
    </section>
  );
}

/** The only two ways to look at the roster: just your shifts, or everyone's. */
export function MineSwitch({ mine, onChange }: { mine: boolean; onChange: (mine: boolean) => void }) {
  return (
    <div role="radiogroup" aria-label="Show" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2 }}>
      {([[true, "My shifts"], [false, "Everyone"]] as const).map(([v, text]) => (
        <button key={text} type="button" role="radio" aria-checked={mine === v} onClick={() => onChange(v)} className="app-press" style={{
          border: "none", borderRadius: 999, padding: "8px 16px", minHeight: 38, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
          background: mine === v ? C.dark : "transparent", color: mine === v ? C.white : C.secondary, transition: "background-color 180ms ease, color 180ms ease",
        }}>{text}</button>
      ))}
    </div>
  );
}
