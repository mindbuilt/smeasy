"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { addDays, fmtDay, fmtTime, fmtWeek, shiftHours, thisMonday, weekDates } from "@/lib/dates";
import { downloadRosterPdf, PdfShift } from "@/lib/rosterPdf";
import { C, btn, input } from "@/components/ui";

type TeamShift = PdfShift & { id: string };
type View = { business: string; week_start: string; published: boolean; staff: string[]; shifts: TeamShift[] };

const ME_KEY = "smeasy_me";

// Shared team roster: /r/#<team_token>. Read-only, published weeks only.
export default function TeamRoster() {
  const [token, setToken] = useState<string | null>(null);
  const [week, setWeek] = useState(thisMonday());
  const [view, setView] = useState<View | null | "invalid">(null);
  const [me, setMe] = useState("");

  useEffect(() => {
    const read = () => {
      setToken(window.location.hash.slice(1) || "");
      setMe(localStorage.getItem(ME_KEY) ?? "");
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const validToken = token !== null && /^[0-9a-f-]{36}$/i.test(token);

  useEffect(() => {
    if (!validToken) return;
    let cancelled = false;
    supabase().rpc("get_team_roster", { p_token: token!, p_week: week }).then(({ data, error }) => {
      if (!cancelled) setView(error || !data ? "invalid" : (data as unknown as View));
    });
    return () => { cancelled = true; };
  }, [token, validToken, week]);

  if ((token !== null && !validToken) || view === "invalid") return (
    <Shell>
      <h1 style={{ fontSize: 20, color: C.dark }}>This roster link isn&apos;t working</h1>
      <p style={{ color: C.secondary, fontSize: 15 }}>It may have been replaced. Ask your manager for the new team link.</p>
    </Shell>
  );
  if (view === null) return <Shell><p style={{ color: C.muted }}>Loading…</p></Shell>;

  const pickMe = (name: string) => { setMe(name); localStorage.setItem(ME_KEY, name); };
  const mine = view.shifts.filter((s) => s.staff_name === me);
  const myHours = mine.reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0);

  return (
    <Shell business={view.business}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <button onClick={() => setWeek(addDays(week, -7))} style={{ ...btn(), padding: "8px 12px" }} aria-label="Previous week">‹</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>{fmtWeek(view.week_start)}</div>
          <div style={{ fontSize: 12, color: C.muted }}>{view.week_start === thisMonday() ? "This week" : " "}</div>
        </div>
        <button onClick={() => setWeek(addDays(week, 7))} style={{ ...btn(), padding: "8px 12px" }} aria-label="Next week">›</button>
      </div>

      {!view.published ? (
        <Card><p style={{ margin: 0, color: C.secondary, fontSize: 15 }}>This week&apos;s roster hasn&apos;t been published yet.</p></Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            <select value={me} onChange={(e) => pickMe(e.target.value)} style={{ ...input, flex: 1, minWidth: 180 }} aria-label="Highlight my shifts">
              <option value="">Highlight my shifts…</option>
              {view.staff.map((n) => <option key={n}>{n}</option>)}
            </select>
            <button onClick={() => downloadRosterPdf({ business: view.business, weekStart: view.week_start, shifts: view.shifts, teamLink: window.location.href })}
              style={btn()}>Download PDF</button>
          </div>

          {me && (
            <Card>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{me}&apos;s shifts · {myHours.toFixed(1).replace(/\.0$/, "")} hours</div>
              {mine.length === 0 ? <div style={{ fontSize: 15, color: C.secondary }}>Not rostered on this week.</div> : mine.map((s) => (
                <div key={s.id} style={{ display: "flex", gap: 10, padding: "6px 0", fontSize: 15 }}>
                  <strong style={{ width: 96, color: C.dark }}>{fmtDay(s.date)}</strong>
                  <span style={{ fontWeight: 700, color: C.shiftText }}>{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: C.muted }}>{s.role}</span>
                </div>
              ))}
            </Card>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
            {weekDates(view.week_start).map((d) => {
              const day = view.shifts.filter((s) => s.date === d);
              return (
                <Card key={d}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: day.length ? 6 : 0 }}>{fmtDay(d)}</div>
                  {day.length === 0 && <div style={{ fontSize: 13, color: C.faint }}>No shifts</div>}
                  {day.map((s) => {
                    const isMe = s.staff_name === me;
                    return (
                      <div key={s.id} style={{ display: "flex", gap: 10, padding: "4px 0", fontSize: 14, color: isMe ? C.shiftText : C.secondary, fontWeight: isMe ? 700 : 400 }}>
                        <span style={{ flex: 1 }}>{s.staff_name}</span>
                        <span>{fmtTime(s.start_time)}–{fmtTime(s.end_time)}</span>
                        {s.role && <span style={{ color: C.muted, fontWeight: 400, minWidth: 64, textAlign: "right" }}>{s.role}</span>}
                      </div>
                    );
                  })}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <p style={{ fontSize: 12, color: C.muted, marginTop: 28 }}>Bookmark this page or add it to your home screen — it always shows the latest published roster. <a href="/privacy/" style={{ color: C.muted }}>Privacy</a></p>
    </Shell>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "12px 16px" }}>{children}</div>;
}

function Shell({ business, children }: { business?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 20, height: 20, borderRadius: C.r1, background: C.accent, display: "block" }} />
        <span style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>{business ? `${business} roster` : "Smeasy"}</span>
      </header>
      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 16px 48px" }}>{children}</main>
    </div>
  );
}
