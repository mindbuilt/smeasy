"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addDays, toISO } from "@/lib/dates";
import { downloadRosterPdf, PdfShift } from "@/lib/rosterPdf";
import { C, Loading, btn, card, haptic, input } from "@/components/ui";
import { Mail } from "lucide-react";
import { DayList, StaffFooter, StaffShell, WeekNav, readToken } from "@/components/StaffBits";

type TeamShift = PdfShift & { id: string };
type View = {
  business: string; week_start: string; published: boolean; staff: string[]; shifts: TeamShift[];
  state: string | null; roles: string[]; day_notes: { date: string; note: string }[];
};

const TOKEN_KEY = "smeasy_team_token";

// Shared team roster: /r/#<team_token>. Read-only, published weeks only. It's one link for the
// whole team, so it can't know who's looking: "my shifts" lives on each person's personal link.
export default function TeamRoster() {
  const [token, setToken] = useState<string | null>(null);
  // Any date in the week will do: the server rounds it to the business's week start.
  const [week, setWeek] = useState(() => toISO(new Date()));
  const [view, setView] = useState<View | null | "invalid">(null);

  useEffect(() => {
    const read = () => setToken(readToken(TOKEN_KEY));
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
      <WeekNav weekStart={view.week_start} onStep={step} />

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

      {validToken && <SendMyLink token={token!} />}

      <StaffFooter hint="Add this page to your home screen and it opens like an app, always showing the latest published roster." />
    </StaffShell>
  );
}

/** "Just my shifts": email yourself your personal link (only works for an email on the team). */
function SendMyLink({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    await supabase().functions.invoke("send-my-link", { body: { team_token: token, email } });
    haptic(10);
    setState("sent");
  }
  return (
    <section style={{ ...card, padding: "16px 16px 14px", marginTop: 14 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: C.dark, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}><Mail size={19} /> Just your shifts</h2>
      {state === "sent" ? (
        <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5 }}>
          If that email is on the team, your personal link is on its way. It shows your shifts first, and lets you request time off and add shifts to your calendar.
        </p>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5 }}>Get your personal link by email. It opens on your own shifts.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="The email your manager has for you" aria-label="Your email" autoComplete="email" style={input} />
            <button type="submit" disabled={state === "sending" || !email.trim()} className="app-press" style={{ ...btn("primary"), whiteSpace: "nowrap", opacity: email.trim() ? 1 : 0.5 }}>{state === "sending" ? "Sending…" : "Email me"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
