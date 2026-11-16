"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addDays, toISO } from "@/lib/dates";
import { downloadRosterPdf, PdfShift } from "@/lib/rosterPdf";
import { C, Loading, btn, card, haptic, input } from "@/components/ui";
import { DayList, NextShift, StaffFooter, StaffShell, WeekNav, hoursOf, readToken, MineSwitch } from "@/components/StaffBits";

type TeamShift = PdfShift & { id: string };
type View = {
  business: string; week_start: string; published: boolean; staff: string[]; shifts: TeamShift[];
  state: string | null; roles: string[]; day_notes: { date: string; note: string }[];
};

const ME_KEY = "smeasy_me";
const TOKEN_KEY = "smeasy_team_token";

// Shared team roster: /r/#<team_token>. Read-only, published weeks only.
export default function TeamRoster() {
  const [token, setToken] = useState<string | null>(null);
  // Any date in the week will do: the server rounds it to the business's week start.
  const [week, setWeek] = useState(() => toISO(new Date()));
  const [view, setView] = useState<View | null | "invalid">(null);
  const [me, setMe] = useState("");
  const [mineOnly, setMineOnly] = useState(true);

  useEffect(() => {
    const read = () => {
      setToken(readToken(TOKEN_KEY));
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
    <StaffShell>
      <div style={{ ...card, padding: "24px 20px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: C.dark, margin: "0 0 6px" }}>This roster link isn&apos;t working</h1>
        <p style={{ color: C.secondary, fontSize: 15, margin: 0, lineHeight: 1.5 }}>It may have been replaced. Ask your manager for the new team link.</p>
      </div>
    </StaffShell>
  );
  if (view === null) return <StaffShell><Loading /></StaffShell>;

  const pickMe = (name: string) => { haptic(5); setMe(name); localStorage.setItem(ME_KEY, name); };
  const mine = view.shifts.filter((s) => s.staff_name === me);
  const step = (n: number) => { setWeek(addDays(week, n * 7)); haptic(5); };

  return (
    <StaffShell business={view.business}>
      <WeekNav weekStart={view.week_start} onStep={step} />

      {!view.published ? (
        <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 750, color: C.dark, margin: "0 0 4px" }}>Not out yet</p>
          <p style={{ margin: 0, color: C.secondary, fontSize: 15 }}>This week&apos;s roster hasn&apos;t been published. Check back soon.</p>
        </div>
      ) : (
        <>
          {me && view.staff.includes(me) ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <MineSwitch mine={mineOnly} onChange={setMineOnly} />
              <button type="button" onClick={() => pickMe("")} style={{ background: "none", border: "none", padding: 0, font: "inherit", fontSize: 13, color: C.muted, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Not {me.split(" ")[0]}? Change
              </button>
            </div>
          ) : view.staff.length > 0 && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14, fontSize: 15, fontWeight: 650, color: C.dark }}>
              Which one are you?
              <select value="" onChange={(e) => { if (e.target.value) { pickMe(e.target.value); setMineOnly(true); } }}
                style={{ ...input, width: "auto", minWidth: 180, minHeight: 40, padding: "8px 12px", fontSize: 15 }}>
                <option value="">Pick your name</option>
                {view.staff.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          )}

          {me && mineOnly && <NextShift shifts={mine} roles={view.roles ?? []} totalHours={hoursOf(mine)} count={mine.length} name={me} />}

          <DayList weekStart={view.week_start} shifts={me && mineOnly ? mine : view.shifts} roles={view.roles ?? []} state={view.state}
            dayNotes={view.day_notes ?? []} isMine={(s) => !!me && s.staff_name === me} />

          <button onClick={() => downloadRosterPdf({ business: view.business, weekStart: view.week_start, shifts: view.shifts, roles: view.roles ?? [], state: view.state, dayNotes: view.day_notes ?? [], teamLink: window.location.href })}
            className="app-press" style={{ ...btn(), width: "100%", marginTop: 14, minHeight: 48 }}><FileText size={18} /> Download this week as a PDF</button>
        </>
      )}

      <StaffFooter hint="Add this page to your home screen and it opens like an app, always showing the latest published roster. Want your shifts in your phone's calendar? Ask your manager for your personal link." />
    </StaffShell>
  );
}
