"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addDays, fmtDay, toISO } from "@/lib/dates";
import { Plane, Users } from "lucide-react";
import { C, Loading, btn, card, haptic, input, label } from "@/components/ui";
import { CalendarButtons, DayList, NextShift, StaffFooter, StaffShell, WeekNav, hoursOf, readToken } from "@/components/StaffBits";


type StaffShift = {
  id: string; date: string; start_time: string; end_time: string;
  break_minutes: number; role: string | null; notes: string | null; staff_name: string; mine: boolean;
};
type StaffTimeOff = { id: string; start_date: string; end_date: string; reason: string; status: string };
type View = {
  business: string; staff_name: string; week_start: string; published: boolean;
  state: string | null; roles: string[]; day_notes: { date: string; note: string }[];
  shifts: StaffShift[]; time_off: StaffTimeOff[];
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
    const read = () => setToken(readToken("smeasy_staff_token"));
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const validToken = token !== null && /^[0-9a-f-]{36}$/i.test(token);
  const [reload, setReload] = useState(0);
  const load = () => setReload((n) => n + 1);

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
      <WeekNav weekStart={view.week_start} onStep={step} />

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
              <button onClick={() => setShowTeam((v) => !v)} aria-expanded={showTeam} className="app-press" style={{ ...btn(), width: "100%", minHeight: 48, marginBottom: 10 }}>
                <Users size={18} /> {showTeam ? "Show just my shifts" : "See the whole team's week"}
              </button>
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
            </div>
          );
        })}
        {asking
          ? <TimeOffForm token={token!} onDone={() => { setAsking(false); haptic([10, 40, 16]); load(); }} onCancel={() => setAsking(false)} />
          : <button onClick={() => setAsking(true)} className="app-press" style={{ ...btn("primary"), marginTop: 8 }}>Request time off</button>}
      </section>

      <CalendarButtons token={token!} />

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


