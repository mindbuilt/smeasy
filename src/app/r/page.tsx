"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addDays, toISO } from "@/lib/dates";
import { downloadRosterPdf, PdfShift } from "@/lib/rosterPdf";
import { C, Loading, btn, card, haptic } from "@/components/ui";
import { DayList, StaffFooter, StaffShell, WeekNav, readToken } from "@/components/StaffBits";

type TeamShift = PdfShift & { id: string };
type View = {
  business: string; week_start: string; published: boolean; staff: string[]; shifts: TeamShift[];
  state: string | null; roles: string[]; day_notes: { date: string; note: string }[];
};

const TOKEN_KEY = "smeasy_team_token";

// Shared team roster: /r/#<team_token>. Read-only, published weeks only. It's one link for the
// whole team, so it can't know who's looking: "my shifts" lives on each person's personal link,
// which they get in their roster emails.
export default function TeamRoster() {
  const [token, setToken] = useState<string | null>(null);
  // Any date in the week will do: the server rounds it to the business's week start.
  const [week, setWeek] = useState(() => toISO(new Date()));
  const [view, setView] = useState<View | null | "invalid">(null);

  useEffect(() => {
    const read = () => { setToken(readToken(TOKEN_KEY)); window.scrollTo(0, 0); };
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

  const step = (n: number) => { setWeek(addDays(week, n * 7)); haptic(5); };

  return (
    <StaffShell business={view.business}>
      <WeekNav weekStart={view.week_start} onStep={step} onToday={() => setWeek(toISO(new Date()))} />

      {!view.published ? (
        <div style={{ ...card, padding: "28px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 17, fontWeight: 750, color: C.dark, margin: "0 0 4px" }}>Not out yet</p>
          <p style={{ margin: 0, color: C.secondary, fontSize: 15 }}>This week&apos;s roster hasn&apos;t been published. Check back soon.</p>
        </div>
      ) : (
        <>
          <DayList weekStart={view.week_start} shifts={view.shifts} roles={view.roles ?? []} state={view.state}
            dayNotes={view.day_notes ?? []} isMine={() => false} />

          <button onClick={() => downloadRosterPdf({ business: view.business, weekStart: view.week_start, shifts: view.shifts, roles: view.roles ?? [], state: view.state, dayNotes: view.day_notes ?? [], teamLink: window.location.href })}
            className="app-press" style={{ ...btn(), width: "100%", marginTop: 14, minHeight: 48 }}><FileText size={18} /> Download this week as a PDF</button>
        </>
      )}

      <StaffFooter hint="Add this page to your home screen and it opens like an app, always showing the latest published roster." />
    </StaffShell>
  );
}
