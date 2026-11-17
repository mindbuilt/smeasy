"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addDays, fmtDay, toISO } from "@/lib/dates";
import { CalendarPlus, Mail, Plane } from "lucide-react";
import { C, Loading, btn, card, haptic, input, label } from "@/components/ui";
import { CalendarButtons, DayList, NextShift, StaffFooter, StaffShell, WeekNav, hoursOf, readToken, MineSwitch } from "@/components/StaffBits";


type StaffShift = {
  id: string; date: string; start_time: string; end_time: string;
  break_minutes: number; role: string | null; notes: string | null; staff_name: string; mine: boolean;
};
type StaffTimeOff = { id: string; start_date: string; end_date: string; reason: string; status: string };
type View = {
  business: string; staff_name: string; week_start: string; published: boolean;
  state: string | null; roles: string[]; day_notes: { date: string; note: string }[];
  shifts: StaffShift[]; time_off: StaffTimeOff[];
  email?: string | null; email_roster?: boolean;
};

export default function StaffRoster() {
  // Token lives in the URL hash (/s/#<token>): works with the static export
  // and is never sent to the server or written to access logs.
  const [token, setToken] = useState<string | null>(null);
  // Any date in the week will do: the server rounds it to the business's week start.
  const [week, setWeek] = useState(() => toISO(new Date()));
  const [view, setView] = useState<View | null | "invalid">(null);
  const [showTeam, setShowTeam] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    // Open at the top: don't let the browser restore an old scroll position (e.g. from the mail app's browser).
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const read = () => { setToken(readToken("smeasy_staff_token")); window.scrollTo(0, 0); };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const [calToken, setCalToken] = useState<string | null>(null);
  useEffect(() => {
    if (!token) return;
    supabase().rpc("get_calendar_token", { p_token: token }).then(({ data }) => setCalToken(typeof data === "string" ? data : null));
  }, [token]);
  async function resetCalendarLink() {
    const { data } = await supabase().rpc("reset_calendar_token", { p_token: token! });
    if (typeof data === "string") setCalToken(data);
  }

  const validToken = token !== null && /^[0-9a-f-]{36}$/i.test(token);
  const [reload, setReload] = useState(0);
  const load = useCallback(() => setReload((n) => n + 1), []);

  useEffect(() => {
    if (!validToken) return;
    let cancelled = false;
    supabase().rpc("get_staff_roster", { p_token: token!, p_week: week }).then(({ data, error }) => {
      if (!cancelled) setView(error || !data ? "invalid" : (data as unknown as View));
    });
    return () => { cancelled = true; };
  }, [token, validToken, week, reload]);

  if ((token !== null && !validToken) || view === "invalid") return (
    <StaffShell>
      <div style={{ ...card, padding: "24px 20px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 6px" }}>This link isn&apos;t working</h1>
        <p style={{ color: C.secondary, fontSize: 15, margin: 0, lineHeight: 1.5 }}>It may have been replaced. Ask your manager to text you your roster link.</p>
      </div>
    </StaffShell>
  );
  if (view === null) return <StaffShell><Loading /></StaffShell>;

  const mine = view.shifts.filter((s) => s.mine);
  const first = view.staff_name.split(" ")[0];
  const step = (n: number) => { setWeek(addDays(week, n * 7)); haptic(5); };

  return (
    <StaffShell business={view.business}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 14px", letterSpacing: "-0.02em" }}>G&apos;day {first}</h1>
      <WeekNav weekStart={view.week_start} onStep={step} onToday={() => setWeek(toISO(new Date()))} />

      {!view.published ? (
        <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 750, color: C.dark, margin: "0 0 4px" }}>Not out yet</p>
          <p style={{ margin: 0, color: C.secondary, fontSize: 15 }}>This week&apos;s roster hasn&apos;t been published. Check back soon.</p>
        </div>
      ) : (
        <>
          <NextShift shifts={mine} roles={view.roles ?? []} totalHours={hoursOf(mine)} count={mine.length} />
          {view.shifts.length > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                <MineSwitch mine={!showTeam} onChange={(m) => setShowTeam(!m)} />
                {/* Scrolls rather than changing the URL hash, which holds the access token. */}
                <button type="button" onClick={() => document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="app-press" style={{ ...btn("ghost"), marginLeft: "auto", minHeight: 38, padding: "6px 10px", color: C.dark }}>
                  <CalendarPlus size={17} /> Add to calendar
                </button>
              </div>
              <DayList weekStart={view.week_start} shifts={showTeam ? view.shifts : mine} roles={view.roles ?? []} state={view.state}
                dayNotes={view.day_notes ?? []} isMine={(s) => !!s.mine} youLabel />
            </>
          )}
        </>
      )}

      <section style={{ ...card, padding: "16px 16px 14px", marginTop: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: C.dark, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}><Plane size={19} /> Time off</h2>
        {view.time_off.length === 0 && !asking && <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 10px" }}>Need a day off? Ask here and your manager sees it on the roster.</p>}
        {view.time_off.map((t) => {
          const tone = t.status === "approved" ? { bg: "#dcfce7", text: "#166534", label: "Approved" }
            : t.status === "declined" ? { bg: "#fee2e2", text: C.danger, label: "Declined" }
            : { bg: "#fef3c7", text: "#92400e", label: "Waiting" };
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${C.divider}`, fontSize: 15 }}>
              <span style={{ flex: 1 }}>{t.start_date === t.end_date ? fmtDay(t.start_date) : `${fmtDay(t.start_date)} – ${fmtDay(t.end_date)}`}</span>
              <span style={{ fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 999, background: tone.bg, color: tone.text }}>{tone.label}</span>
              {t.status === "pending" && (
                <button onClick={async () => { await supabase().rpc("cancel_time_off", { p_token: token!, p_id: t.id }); load(); }} className="app-press" style={{ background: "none", border: "none", padding: "4px 0", font: "inherit", fontSize: 13, color: C.secondary, textDecoration: "underline", cursor: "pointer" }}>Cancel</button>
              )}
            </div>
          );
        })}
        {asking
          ? <TimeOffForm token={token!} onDone={() => { setAsking(false); haptic([10, 40, 16]); load(); }} onCancel={() => setAsking(false)} />
          : <button onClick={() => setAsking(true)} className="app-press" style={{ ...btn("primary"), marginTop: 8 }}>Request time off</button>}
      </section>

      <RosterEmails token={token!} email={view.email ?? null} on={view.email_roster ?? true} onChanged={load} />

      {calToken && <CalendarButtons token={calToken} onReset={resetCalendarLink} />}

      <StaffFooter hint="This is your personal link. Add it to your home screen and it opens like an app. It stays the same every week, so please don't share it." />
    </StaffShell>
  );
}

function TimeOffForm({ token, onDone, onCancel }: { token: string; onDone: () => void; onCancel: () => void }) {
  const today = toISO(new Date());
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error } = await supabase().rpc("request_time_off", { p_token: token, p_start: from, p_end: to < from ? from : to, p_reason: reason });
    setSending(false);
    if (error) setError(error.message.includes("dates") ? "Pick dates within the next year." : "Couldn't send that request. Please try again.");
    else onDone();
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 10, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={label}>From</label><input type="date" style={input} min={today} value={from} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} required /></div>
        <div><label style={label}>To</label><input type="date" style={input} min={from} value={to} onChange={(e) => setTo(e.target.value)} required /></div>
      </div>
      <div><label style={label}>Reason (optional)</label><input style={input} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Uni exam" /></div>
      {error && <p style={{ color: C.danger, fontSize: 13, margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={sending} className="app-press" style={btn("primary")}>{sending ? "Sending…" : "Send request"}</button>
        <button type="button" onClick={onCancel} style={btn("ghost")}>Cancel</button>
      </div>
    </form>
  );
}

/** Roster emails: add your email, change it, or turn the emails off. "Stop roster emails" links land here with ?stop=1. */
function RosterEmails({ token, email, on, onChanged }: { token: string; email: string | null; on: boolean; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stopped, setStopped] = useState(false);
  // Arriving from "Stop roster emails" in an email: ask first. Scanners that open links must not switch emails off.
  const [askStop, setAskStop] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("stop") === "1");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("stop") !== "1") return;
    window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    const { error } = await supabase().rpc("set_my_email", { p_token: token, p_email: value });
    setSaving(false);
    if (error) { setError(error.message.includes("look right") ? "That email address doesn't look right." : "Couldn't save. Please try again."); return; }
    setEditing(false); haptic(10); onChanged();
  }

  async function toggle(next: boolean) {
    const { error } = await supabase().rpc("set_roster_emails", { p_token: token, p_on: next });
    if (!error) { setStopped(!next); onChanged(); }
  }

  const link = { background: "none", border: "none", padding: 0, font: "inherit", color: C.dark, fontWeight: 650, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 } as const;

  return (
    <section style={{ ...card, padding: "16px 16px 14px", marginTop: 14 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: C.dark, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 8 }}><Mail size={19} /> Roster by email</h2>
      {editing || !email ? (
        <form onSubmit={save} style={{ display: "grid", gap: 10 }}>
          {!email && <p style={{ fontSize: 14, color: C.secondary, margin: 0 }}>Add your email and you&apos;ll get your shifts when the roster comes out.</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" value={value} onChange={(e) => setValue(e.target.value)} placeholder="you@example.com" aria-label="Your email" autoComplete="email" style={input} />
            <button type="submit" disabled={saving} className="app-press" style={{ ...btn("primary"), whiteSpace: "nowrap" }}>{saving ? "Saving…" : !value.trim() && email ? "Remove email" : "Save"}</button>
          </div>
          {error && <p style={{ color: C.danger, fontSize: 13, margin: 0 }}>{error}</p>}
          {editing && <button type="button" onClick={() => { setEditing(false); setValue(email ?? ""); }} style={{ ...btn("ghost"), justifySelf: "start", padding: "4px 0" }}>Cancel</button>}
        </form>
      ) : on ? (
        <>
          {askStop && (
            <div role="alertdialog" aria-label="Stop roster emails" style={{ background: "#f3f4f6", borderRadius: 12, padding: "12px 14px", display: "grid", gap: 10 }}>
              <p style={{ margin: 0, fontSize: 15, color: C.dark, lineHeight: 1.5 }}>Stop roster emails? You won&apos;t get your shifts by email any more. You can turn them back on here.</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => { setAskStop(false); toggle(false); }} className="app-press" style={btn("primary")}>Yes, stop them</button>
                <button onClick={() => setAskStop(false)} className="app-press" style={btn("ghost")}>No, keep them</button>
              </div>
            </div>
          )}
        <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.6 }}>
          Your shifts go to <strong style={{ color: C.dark }}>{email}</strong> when the roster comes out.{" "}
          <button onClick={() => setEditing(true)} style={link}>Change</button>{" · "}
          <button onClick={() => toggle(false)} style={link}>Stop roster emails</button>
        </p>
        </>
      ) : (
        <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.6 }}>
          {stopped ? "Done. You won't get roster emails any more." : "Roster emails are off."}{" "}
          {email && <><button onClick={() => setEditing(true)} style={link}>Change email</button>{" · "}</>}
          <button onClick={() => toggle(true)} style={link}>Turn them back on</button>
        </p>
      )}
    </section>
  );
}
