"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addDays, fmtDay, fmtTime, fmtWeek, shiftHours, thisMonday, toISO, weekDates } from "@/lib/dates";
import Link from "next/link";
import { C, btn, input, label } from "@/components/ui";
import { CalendarButtons, DayExtras, RolePill } from "@/components/StaffBits";

function nameHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return h % 360;
}

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
  const [week, setWeek] = useState(thisMonday());
  const [view, setView] = useState<View | null | "invalid">(null);
  const [showTeam, setShowTeam] = useState(false);
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    const read = () => setToken(window.location.hash.slice(1) || "");
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

  if (token !== null && !validToken) return (
    <Shell>
      <h1 style={{ fontSize: 20, color: C.dark }}>This link isn&apos;t working</h1>
      <p style={{ color: C.secondary, fontSize: 15 }}>Ask your manager to text you your roster link.</p>
    </Shell>
  );
  if (view === null) return <Shell><p style={{ color: C.muted }}>Loading…</p></Shell>;
  if (view === "invalid") return (
    <Shell>
      <h1 style={{ fontSize: 20, color: C.dark }}>This link isn&apos;t working</h1>
      <p style={{ color: C.secondary, fontSize: 15 }}>It may have been replaced. Ask your manager to text you your new roster link.</p>
    </Shell>
  );

  const mine = view.shifts.filter((s) => s.mine);
  const myHours = mine.reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0);
  const first = view.staff_name.split(" ")[0];

  const hue = nameHue(view.staff_name);

  return (
    <Shell business={view.business} accentHue={hue}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: "0 0 2px" }}>Hi {first}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "12px 0 16px" }}>
        <button onClick={() => setWeek(addDays(week, -7))} style={{ ...btn(), padding: "8px 12px" }} aria-label="Previous week">‹</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{fmtWeek(view.week_start)}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{view.week_start === thisMonday() ? "This week" : " "}</div>
        </div>
        <button onClick={() => setWeek(addDays(week, 7))} style={{ ...btn(), padding: "8px 12px" }} aria-label="Next week">›</button>
      </div>

      {!view.published ? (
        <Card>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }} aria-hidden>&#9203;</div>
            <p style={{ margin: 0, color: C.secondary, fontSize: 15 }}>This week&apos;s roster isn&apos;t out yet. Check back soon.</p>
          </div>
        </Card>
      ) : mine.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }} aria-hidden>&#127774;</div>
            <p style={{ margin: 0, color: C.secondary, fontSize: 15 }}>You&apos;re not rostered on this week. Enjoy the time off!</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Your shifts · {myHours.toFixed(1).replace(/\.0$/, "")} hours</div>
          {mine.map((s) => (
            <div key={s.id} style={{ padding: "10px 0", borderTop: `1px solid ${C.divider}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, width: 96 }}>{fmtDay(s.date)}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                <span style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
                  <RolePill role={s.role} roles={view.roles ?? []} />
                  {s.break_minutes ? <span style={{ fontSize: 12, color: C.muted }}>{s.break_minutes}m break</span> : null}
                </span>
              </div>
              <DayExtras date={s.date} state={view.state} dayNotes={view.day_notes ?? []} />
              {s.notes && <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>📝 {s.notes}</div>}
            </div>
          ))}
        </Card>
      )}

      {view.published && view.shifts.length > mine.length && (
        <>
          <button onClick={() => setShowTeam((v) => !v)} style={{ ...btn("ghost"), padding: "10px 0" }}>
            {showTeam ? "Hide" : "See"} who else is on
          </button>
          {showTeam && (
            <Card>
              {weekDates(view.week_start).map((d) => {
                const day = view.shifts.filter((s) => s.date === d);
                if (!day.length) return null;
                return (
                  <div key={d} style={{ padding: "8px 0", borderTop: `1px solid ${C.divider}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 2 }}>{fmtDay(d)}</div>
                    <DayExtras date={d} state={view.state} dayNotes={view.day_notes ?? []} />
                    {day.map((s) => (
                      <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14, padding: "2px 0", color: s.mine ? C.dark : C.secondary, fontWeight: s.mine ? 700 : 400 }}>
                        <span style={{ flex: 1 }}>{s.mine ? "You" : s.staff_name} · {fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                        <RolePill role={s.role} roles={view.roles ?? []} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}

      <div style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 8px" }}>Time off</h2>
        {view.time_off.map((t) => (
          <div key={t.id} style={{ fontSize: 14, color: C.secondary, padding: "4px 0" }}>
            {t.start_date === t.end_date ? fmtDay(t.start_date) : `${fmtDay(t.start_date)} – ${fmtDay(t.end_date)}`}
            {" · "}
            <strong style={{ color: t.status === "approved" ? "#1a6b2f" : t.status === "declined" ? C.danger : C.offText }}>
              {t.status === "pending" ? "Waiting for approval" : t.status === "approved" ? "Approved" : "Declined"}
            </strong>
          </div>
        ))}
        {asking
          ? <TimeOffForm token={token!} onDone={() => { setAsking(false); load(); }} onCancel={() => setAsking(false)} />
          : <button onClick={() => setAsking(true)} style={{ ...btn(), marginTop: 8 }}>Request time off</button>}
      </div>

      <CalendarButtons token={token!} />

      <p style={{ fontSize: 12, color: C.muted, marginTop: 32 }}>Bookmark this page — it&apos;s your personal link and stays the same every week.</p>
      <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
        <Link href="/" style={{ color: C.secondary }}>SMEasy</Link>
        {" · "}
        <Link href="/privacy/" style={{ color: C.secondary }}>Privacy</Link>
      </p>
    </Shell>
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
    <form onSubmit={submit} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: 16, marginTop: 8, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div><label style={label}>From</label><input type="date" style={input} min={today} value={from} onChange={(e) => { setFrom(e.target.value); if (to < e.target.value) setTo(e.target.value); }} required /></div>
        <div><label style={label}>To</label><input type="date" style={input} min={from} value={to} onChange={(e) => setTo(e.target.value)} required /></div>
      </div>
      <div><label style={label}>Reason (optional)</label><input style={input} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Uni exam" /></div>
      {error && <p style={{ color: C.danger, fontSize: 13, margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={sending} style={btn("primary")}>{sending ? "Sending…" : "Send request"}</button>
        <button type="button" onClick={onCancel} style={btn("ghost")}>Cancel</button>
      </div>
    </form>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "12px 16px" }}>{children}</div>;
}

function Shell({ business, children, accentHue }: { business?: string; children: React.ReactNode; accentHue?: number }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ width: 20, height: 20, borderRadius: C.r1, background: C.accent, display: "block" }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>{business ?? "SMEasy"}</span>
        </Link>
      </header>
      {accentHue != null && <div style={{ height: 3, background: `hsl(${accentHue} 65% 60%)` }} />}
      <main style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px 48px" }}>{children}</main>
    </div>
  );
}
