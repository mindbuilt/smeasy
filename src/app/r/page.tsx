"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addDays, thisMonday } from "@/lib/dates";
import { downloadRosterPdf, PdfShift } from "@/lib/rosterPdf";
import { Avatar, C, Loading, btn, card, haptic } from "@/components/ui";
import { DayList, NextShift, StaffFooter, StaffShell, WeekNav, hoursOf, readToken } from "@/components/StaffBits";

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
  const [week, setWeek] = useState(thisMonday());
  const [view, setView] = useState<View | null | "invalid">(null);
  const [me, setMe] = useState("");

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
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 650, color: C.secondary, marginBottom: 8 }}>Show my shifts</div>
            <div role="radiogroup" aria-label="Show my shifts" className="no-scrollbar" style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 6px", margin: "0 -2px" }}>
              <NameChip on={!me} onClick={() => pickMe("")} label="Everyone" />
              {view.staff.map((n) => <NameChip key={n} on={me === n} onClick={() => pickMe(n)} label={n} avatar />)}
            </div>
          </div>

          {me && <NextShift shifts={mine} roles={view.roles ?? []} totalHours={hoursOf(mine)} count={mine.length} name={me} />}

          <DayList weekStart={view.week_start} shifts={view.shifts} roles={view.roles ?? []} state={view.state}
            dayNotes={view.day_notes ?? []} isMine={(s) => !!me && s.staff_name === me} />

          <button onClick={() => downloadRosterPdf({ business: view.business, weekStart: view.week_start, shifts: view.shifts, roles: view.roles ?? [], state: view.state, dayNotes: view.day_notes ?? [], teamLink: window.location.href })}
            className="app-press" style={{ ...btn(), width: "100%", marginTop: 14, minHeight: 48 }}><FileText size={18} /> Download this week as a PDF</button>
        </>
      )}

      <StaffFooter hint="Add this page to your home screen and it opens like an app, always showing the latest published roster. Want your shifts in your phone's calendar? Ask your manager for your personal link." />
    </StaffShell>
  );
}

function NameChip({ on, onClick, label, avatar }: { on: boolean; onClick: () => void; label: string; avatar?: boolean }) {
  return (
    <button role="radio" aria-checked={on} onClick={onClick} className="app-press" style={{
      flex: "none", display: "inline-flex", alignItems: "center", gap: 8, padding: avatar ? "5px 14px 5px 5px" : "8px 16px",
      borderRadius: 999, border: `1.5px solid ${on ? C.dark : C.border}`, background: on ? C.dark : C.white, color: on ? C.white : C.dark,
      fontSize: 15, fontWeight: 650, cursor: "pointer", fontFamily: "inherit", transition: "background-color 180ms ease, color 180ms ease",
    }}>
      {avatar && <Avatar name={label} size={28} tone={on ? { bg: C.accent, text: C.dark } : undefined} />}
      {label}
    </button>
  );
}
