"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import type { Business, Roster, Shift, Staff, TimeOff } from "@/lib/types";
import { addDays, fmtAUD, fmtDay, fmtTime, fmtWeek, mondayOf, shiftHours, thisMonday, weekDates } from "@/lib/dates";
import { AppShell, C, Loading, Modal, btn, input, label } from "@/components/ui";
import { downloadRosterPdf } from "@/lib/rosterPdf";

type Draft = {
  id?: string;
  staff_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  role: string;
};

const hhmm = (t: string) => t.slice(0, 5);

async function fetchWeek(monday: string, days: string[]) {
  const sb = supabase();
  const [st, ro, to] = await Promise.all([
    sb.from("staff").select("*").eq("active", true).order("name"),
    sb.from("rosters").select("*").eq("week_start", monday).maybeSingle(),
    sb.from("time_off").select("*").lte("start_date", days[6]).gte("end_date", days[0]).neq("status", "declined"),
  ]);
  const shifts = ro.data
    ? (await sb.from("shifts").select("*").eq("roster_id", ro.data.id).order("start_time")).data ?? []
    : [];
  return { staff: st.data ?? [], roster: ro.data ?? null, timeOff: to.data ?? [], shifts };
}

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => {
    const check = () => setM(window.innerWidth < 720);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return m;
}

function WeekPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { business, email } = useManager();
  const monday = mondayOf(params.get("w") ?? thisMonday());
  const days = useMemo(() => weekDates(monday), [monday]);
  const isMobile = useIsMobile();

  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [cascadeIds, setCascadeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    fetchWeek(monday, days).then((w) => {
      if (cancelled) return;
      setStaff(w.staff); setRoster(w.roster); setTimeOff(w.timeOff); setShifts(w.shifts);
    });
    return () => { cancelled = true; };
  }, [business, monday, days]);

  async function ensureRoster
(b: Business): Promise<Roster | null> {
    if (roster) return roster;
    const sb = supabase();
    const { data, error } = await sb.from("rosters").insert({ business_id: b.id, week_start: monday }).select().single();
    if (error) {
      // Created in another tab meanwhile — fetch it.
      const { data: existing } = await sb.from("rosters").select("*").eq("week_start", monday).maybeSingle();
      setRoster(existing ?? null);
      return existing ?? null;
    }
    setRoster(data);
    return data;
  }

  const goWeek = (n: number) => router.push(`/week?w=${addDays(monday, n * 7)}`);

  // ── Derived numbers ──────────────────────────────────────────────────────
  const hoursByStaff = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of shifts) m.set(s.staff_id, (m.get(s.staff_id) ?? 0) + shiftHours(s.start_time, s.end_time, s.break_minutes));
    return m;
  }, [shifts]);
  const totalHours = [...hoursByStaff.values()].reduce((a, b) => a + b, 0);
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s])), [staff]);
  const wages = [...hoursByStaff.entries()].reduce((sum, [id, h]) => sum + h * Number(staffById.get(id)?.hourly_rate ?? 0), 0);
  const missingRate = [...hoursByStaff.keys()].filter((id) => staffById.get(id)?.hourly_rate == null).length;
  const pending = timeOff.filter((t) => t.status === "pending");
  const published = roster?.status === "published";
  const isPast = monday < thisMonday();

  const offOn = (staffId: string, date: string) =>
    timeOff.find((t) => t.staff_id === staffId && t.status === "approved" && t.start_date <= date && t.end_date >= date);

  // ── Actions ──────────────────────────────────────────────────────────────
  function newShift(staffId: string, date: string) {
    const person = staffById.get(staffId);
    const last = [...shifts].reverse().find((s) => s.staff_id === staffId);
    setDraft({
      staff_id: staffId, date,
      start_time: last ? hhmm(last.start_time) : "09:00",
      end_time: last ? hhmm(last.end_time) : "17:00",
      break_minutes: last?.break_minutes ?? 30,
      role: last?.role ?? person?.default_role ?? business?.roles[0] ?? "",
    });
  }

  function editShift(s: Shift) {
    setDraft({ id: s.id, staff_id: s.staff_id, date: s.date, start_time: hhmm(s.start_time), end_time: hhmm(s.end_time), break_minutes: s.break_minutes, role: s.role ?? "" });
  }

  async function saveShift(d: Draft) {
    if (!business) return;
    const sb = supabase();
    const r = await ensureRoster(business);
    if (!r) return;
    const row = { business_id: business.id, roster_id: r.id, staff_id: d.staff_id, date: d.date,
      start_time: d.start_time, end_time: d.end_time, break_minutes: d.break_minutes, role: d.role || null };
    const { data, error } = d.id
      ? await sb.from("shifts").update(row).eq("id", d.id).select().single()
      : await sb.from("shifts").insert(row).select().single();
    if (error || !data) { setNotice("Couldn't save that shift. Check the times and try again."); return; }
    setShifts((all) => (d.id ? all.map((s) => (s.id === d.id ? data : s)) : [...all, data]));
    setDraft(null);
  }

  async function deleteShift(id: string) {
    await supabase().from("shifts").delete().eq("id", id);
    setShifts((all) => all.filter((s) => s.id !== id));
    setDraft(null);
  }

  async function copyLastWeek() {
    if (!business || !staff) return;
    setBusy(true);
    const sb = supabase();
    const prevMonday = addDays(monday, -7);
    const { data: prev } = await sb.from("rosters").select("id").eq("week_start", prevMonday).maybeSingle();
    const { data: prevShifts } = prev
      ? await sb.from("shifts").select("*").eq("roster_id", prev.id)
      : { data: [] as Shift[] };
    const activeIds = new Set(staff.map((s) => s.id));
    const toCopy = (prevShifts ?? []).filter((s) => activeIds.has(s.staff_id));
    if (toCopy.length === 0) {
      setNotice("Last week has no shifts to copy.");
      setBusy(false);
      return;
    }
    const r = await ensureRoster(business);
    if (r) {
      const { data } = await sb.from("shifts").insert(toCopy.map((s) => ({
        business_id: business.id, roster_id: r.id, staff_id: s.staff_id, date: addDays(s.date, 7),
        start_time: s.start_time, end_time: s.end_time, break_minutes: s.break_minutes, role: s.role,
      }))).select();
      setShifts(data ?? []);
      const ids = new Set((data ?? []).map((s) => s.id));
      setCascadeIds(ids);
      setTimeout(() => setCascadeIds(new Set()), 1200);
      const clashes = (data ?? []).filter((s) => offOn(s.staff_id, s.date)).length;
      setNotice(`Copied ${data?.length ?? 0} shifts from last week.` + (clashes ? ` ${clashes} clash with approved time off — check the orange days.` : ""));
    }
    setBusy(false);
  }

  async function publish() {
    if (!roster) return;
    setBusy(true);
    const { data } = await supabase().from("rosters").update({ status: "published" }).eq("id", roster.id).select().single();
    if (data) { setRoster(data); setJustPublished(true); }
    setBusy(false);
  }

  async function unpublish() {
    if (!roster) return;
    const { data } = await supabase().from("rosters").update({ status: "draft" }).eq("id", roster.id).select().single();
    if (data) setRoster(data);
  }

  async function decide(t: TimeOff, status: "approved" | "declined") {
    await supabase().from("time_off").update({ status }).eq("id", t.id);
    setTimeOff((all) => (status === "declined" ? all.filter((x) => x.id !== t.id) : all.map((x) => (x.id === t.id ? { ...x, status } : x))));
  }

  const teamLink = () => `${window.location.origin}/r/#${business!.team_token}`;

  async function copyTeamLink() {
    await navigator.clipboard.writeText(teamLink());
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  }

  function downloadPdf() {
    if (!business) return;
    downloadRosterPdf({
      business: business.name,
      weekStart: monday,
      people: (staff ?? []).map((p) => p.name),
      shifts: shifts.map((s) => ({ ...s, staff_name: staffById.get(s.staff_id)?.name ?? "" })),
      teamLink: published ? teamLink() : undefined,
    });
  }

  function downloadCSV() {
    // One row per shift (bookkeepers need the day and times for weekend and
    // public-holiday rates), then a per-person summary. "Actual hours" starts
    // equal to rostered hours so the manager can adjust it before sending.
    const head = ["Name", "Date", "Day", "Start", "Finish", "Unpaid break (min)", "Rostered hours", "Actual hours", "Role"];
    const rows: string[][] = [head];
    const sorted = [...shifts].sort((a, b) =>
      (staffById.get(a.staff_id)?.name ?? "").localeCompare(staffById.get(b.staff_id)?.name ?? "") ||
      a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
    for (const s of sorted) {
      const p = staffById.get(s.staff_id);
      const hrs = shiftHours(s.start_time, s.end_time, s.break_minutes).toFixed(2);
      rows.push([p?.name ?? "", s.date, fmtDay(s.date).split(" ")[0],
        hhmm(s.start_time), hhmm(s.end_time), String(s.break_minutes), hrs, hrs, s.role ?? ""]);
    }
    rows.push([], ["Totals by person"], ["Name", "Rostered hours", "Actual hours"]);
    for (const p of [...(staff ?? [])].sort((a, b) => a.name.localeCompare(b.name))) {
      const h = hoursByStaff.get(p.id);
      if (!h) continue;
      rows.push([p.name, h.toFixed(2), h.toFixed(2)]);
    }
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `hours-${monday}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }


  if (!business || !staff) return <AppShell><Loading /></AppShell>;

  return (
    <AppShell businessName={business.name} email={email}>
      {/* Week bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => goWeek(-1)} style={{ ...btn(), padding: "8px 12px" }} aria-label="Previous week">‹</button>
          <button onClick={() => goWeek(1)} style={{ ...btn(), padding: "8px 12px" }} aria-label="Next week">›</button>
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: 0 }}>{fmtWeek(monday)}</h1>
          <div style={{ fontSize: 13, color: C.muted }}>
            {monday === thisMonday() ? "This week" : <Link href="/week" style={{ color: C.secondary }}>Back to this week</Link>}
            {" · "}
            <span style={{ fontWeight: 600, color: published ? "#1a6b2f" : C.offText, transition: "color 0.4s ease" }}>
              {isPast && published ? <><span aria-hidden>&#10003;</span> Done</> : published ? "Published" : "Draft"}
            </span>
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {shifts.length === 0 && staff.length > 0 && (
            <button onClick={copyLastWeek} disabled={busy} style={btn()}>Copy last week</button>
          )}
          {published && <button onClick={copyTeamLink} style={btn()}>{linkCopied ? "Link copied ✓" : "Copy team link"}</button>}
          {shifts.length > 0 && <button onClick={downloadPdf} style={btn()}>PDF</button>}
          {shifts.length > 0 && <button onClick={downloadCSV} style={btn()}>Hours CSV</button>}
          {published
            ? <button onClick={unpublish} style={btn("ghost")}>Unpublish</button>
            : <button onClick={publish} disabled={busy || shifts.length === 0} style={{
                ...btn("primary"), opacity: shifts.length ? 1 : 0.5,
                transition: "all 0.3s ease",
                ...(busy ? { background: "#1a6b2f", borderColor: "#1a6b2f" } : {}),
              }}>{busy ? "Publishing…" : "Publish to team"}</button>}
        </div>
      </div>

      {/* Summary */}
      {shifts.length > 0 && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 14, color: C.secondary, marginBottom: 14 }}>
          <span><strong style={{ color: C.dark }}>{totalHours.toFixed(1)}</strong> paid hours</span>
          <span><strong style={{ color: C.dark }}>{shifts.length}</strong> shifts</span>
          {wages > 0 && (
            <span>
              Wages <strong style={{ color: C.dark }}>≈ {fmtAUD(wages)}</strong>
              {missingRate > 0 && <span style={{ color: C.muted }}> (excludes {missingRate} without a rate)</span>}
            </span>
          )}
        </div>
      )}

      {published && (
        <Banner>Published — your team can see this week on the team link. Changes you make now show up for them straight away.</Banner>
      )}
      {notice && <Banner onClose={() => setNotice(null)}>{notice}</Banner>}

      {/* Time-off requests */}
      {pending.length > 0 && (
        <div style={{ background: C.offBg, border: `1px solid ${C.offBorder}`, borderRadius: C.r2, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.offText, marginBottom: 6 }}>Time-off requests</div>
          {pending.map((t) => (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "4px 0", fontSize: 14 }}>
              <span style={{ flex: 1, minWidth: 180 }}>
                <strong>{staffById.get(t.staff_id)?.name ?? "Someone"}</strong>{" "}
                {t.start_date === t.end_date ? fmtDay(t.start_date) : `${fmtDay(t.start_date)} – ${fmtDay(t.end_date)}`}
                {t.reason && <span style={{ color: C.secondary }}> · {t.reason}</span>}
              </span>
              <button onClick={() => decide(t, "approved")} style={{ ...btn("primary"), padding: "6px 12px", fontSize: 13 }}>Approve</button>
              <button onClick={() => decide(t, "declined")} style={{ ...btn(), padding: "6px 12px", fontSize: 13 }}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {staff.length === 0 ? (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden>&#128197;</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: "0 0 6px" }}>Your roster starts with your team</p>
          <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 16px", lineHeight: 1.5 }}>Add the people you roster, then come back here to build the week.</p>
          <Link href="/team" style={{ ...btn("primary"), textDecoration: "none", display: "inline-block" }}>Add team members</Link>
        </div>
      ) : isMobile ? (
        <DayCards days={days} staff={staff} shifts={shifts} offOn={offOn} onAdd={newShift} onEdit={editShift} cascadeIds={cascadeIds} />
      ) : (
        <Grid days={days} staff={staff} shifts={shifts} hours={hoursByStaff} offOn={offOn} onAdd={newShift} onEdit={editShift} cascadeIds={cascadeIds} />
      )}

      {draft && (
        <ShiftEditor draft={draft} staff={staff} roles={business.roles} offOn={offOn}
          onClose={() => setDraft(null)} onSave={saveShift} onDelete={deleteShift} />
      )}

      {justPublished && (
        <Modal title="Done — roster published" onClose={() => setJustPublished(false)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: "#e8f5e9", borderRadius: C.r2 }}>
            <span style={{ fontSize: 20 }} role="img" aria-label="checkmark">&#x2714;</span>
            <span style={{ fontSize: 14, color: "#1a6b2f", fontWeight: 600 }}>Your team can see this week&apos;s roster now.</span>
          </div>
          <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.5, marginTop: 0 }}>
            Paste the team link in your group chat, or send the PDF. The link stays the same every week.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            <button onClick={copyTeamLink} style={btn("primary")}>{linkCopied ? "Link copied ✓ — paste it in your group chat" : "Copy team link"}</button>
            <button onClick={downloadPdf} style={btn()}>Download PDF</button>
            <button onClick={() => setJustPublished(false)} style={btn("ghost")}>Done</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function Banner({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "10px 14px", fontSize: 13, color: C.secondary, marginBottom: 14 }}>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>✕</button>}
    </div>
  );
}

type OffOn = (staffId: string, date: string) => TimeOff | undefined;

function Chip({ s, onClick, cascade, cascadeDelay = 0 }: { s: Shift; onClick: () => void; cascade?: boolean; cascadeDelay?: number }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={cascade ? "cascade-in" : undefined} style={{
      display: "block", width: "100%", textAlign: "left", background: C.shiftBg, border: `1px solid ${C.shiftBorder}`,
      color: C.shiftText, borderRadius: C.r1, padding: "4px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer", lineHeight: 1.3,
      ...(cascade ? { animationDelay: `${cascadeDelay}ms` } : {}),
    }}>
      {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
      {s.role && <span style={{ display: "block", fontWeight: 500, opacity: 0.8 }}>{s.role}</span>}
    </button>
  );
}

function OffChip({ t }: { t: TimeOff }) {
  return (
    <div style={{ background: C.offBg, border: `1px solid ${C.offBorder}`, color: C.offText, borderRadius: C.r1, padding: "4px 6px", fontSize: 12, fontWeight: 700 }}>
      Off{t.reason ? ` · ${t.reason}` : ""}
    </div>
  );
}

function Grid({ days, staff, shifts, hours, offOn, onAdd, onEdit, cascadeIds }: {
  days: string[]; staff: Staff[]; shifts: Shift[]; hours: Map<string, number>; offOn: OffOn;
  onAdd: (staffId: string, date: string) => void; onEdit: (s: Shift) => void; cascadeIds: Set<string>;
}) {
  const cols = "160px repeat(7, minmax(90px, 1fr)) 60px";
  let cascadeIdx = 0;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, background: C.bg, borderBottom: `1px solid ${C.border}`, minWidth: 860 }}>
        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Team</div>
        {days.map((d) => (
          <div key={d} style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>
            {fmtDay(d).replace(/ \w+$/, "")}
          </div>
        ))}
        <div style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>HRS</div>
      </div>
      {staff.map((p) => (
        <div key={p.id} style={{ display: "grid", gridTemplateColumns: cols, borderBottom: `1px solid ${C.divider}`, minWidth: 860 }}>
          <div style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, color: C.dark, display: "flex", alignItems: "center" }}>{p.name}</div>
          {days.map((d) => {
            const mine = shifts.filter((s) => s.staff_id === p.id && s.date === d);
            const off = offOn(p.id, d);
            return (
              <div key={d} onClick={() => onAdd(p.id, d)} title="Add shift"
                style={{ padding: 4, minHeight: 52, borderLeft: `1px solid ${C.divider}`, cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, justifyContent: "center" }}>
                {off && <OffChip t={off} />}
                {mine.map((s) => { const isCascade = cascadeIds.has(s.id); const delay = isCascade ? cascadeIdx++ * 40 : 0; return <Chip key={s.id} s={s} onClick={() => onEdit(s)} cascade={isCascade} cascadeDelay={delay} />; })}
                {!off && mine.length === 0 && <div style={{ textAlign: "center", color: C.faint, fontSize: 16 }}>+</div>}
              </div>
            );
          })}
          <div style={{ padding: "10px 6px", fontSize: 14, fontWeight: 600, color: C.dark, textAlign: "center", borderLeft: `1px solid ${C.divider}`, alignSelf: "center" }}>
            {hours.get(p.id) ? hours.get(p.id)!.toFixed(1) : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function DayCards({ days, staff, shifts, offOn, onAdd, onEdit, cascadeIds }: {
  days: string[]; staff: Staff[]; shifts: Shift[]; offOn: OffOn;
  onAdd: (staffId: string, date: string) => void; onEdit: (s: Shift) => void; cascadeIds: Set<string>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {days.map((d) => {
        const dayShifts = shifts.filter((s) => s.date === d);
        const offs = staff.map((p) => ({ p, t: offOn(p.id, d) })).filter((x) => x.t);
        return (
          <div key={d} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 14px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{fmtDay(d)}</span>
              <button onClick={() => onAdd(staff[0].id, d)} style={{ ...btn("ghost"), marginLeft: "auto", padding: "4px 8px", fontSize: 13 }}>+ Add shift</button>
            </div>
            {dayShifts.length === 0 && offs.length === 0 && <div style={{ padding: "10px 14px", fontSize: 13, color: C.faint }}>Nothing yet — tap + to add a shift</div>}
            {dayShifts.map((s) => (
              <button key={s.id} onClick={() => onEdit(s)} className={cascadeIds.has(s.id) ? "cascade-in" : undefined} style={{ display: "flex", width: "100%", gap: 10, alignItems: "center", padding: "10px 14px", background: "none", border: "none", borderTop: `1px solid ${C.divider}`, cursor: "pointer", textAlign: "left" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.dark, flex: 1 }}>{staff.find((p) => p.id === s.staff_id)?.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.shiftText, background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: C.r1, padding: "3px 8px" }}>
                  {fmtTime(s.start_time)}–{fmtTime(s.end_time)}{s.role ? ` · ${s.role}` : ""}
                </span>
              </button>
            ))}
            {offs.map(({ p, t }) => (
              <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", borderTop: `1px solid ${C.divider}` }}>
                <span style={{ fontSize: 14, color: C.secondary, flex: 1 }}>{p.name}</span>
                <OffChip t={t!} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ShiftEditor({ draft, staff, roles, offOn, onClose, onSave, onDelete }: {
  draft: Draft; staff: Staff[]; roles: string[]; offOn: OffOn;
  onClose: () => void; onSave: (d: Draft) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [saving, setSaving] = useState(false);
  const hours = d.start_time && d.end_time && d.start_time !== d.end_time ? shiftHours(d.start_time, d.end_time, d.break_minutes) : 0;
  const overnight = d.end_time && d.start_time && d.end_time < d.start_time;
  const off = offOn(d.staff_id, d.date);

  return (
    <Modal title={`${d.id ? "Edit" : "Add"} shift · ${fmtDay(d.date)}`} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(d); setSaving(false); }} style={{ display: "grid", gap: 12 }}>
        <div><label style={label}>Who</label>
          <select style={input} value={d.staff_id} onChange={(e) => setD({ ...d, staff_id: e.target.value })}>
            {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {off && <p style={{ margin: 0, fontSize: 13, color: C.offText }}>Heads up: they have approved time off this day.</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={label}>Start</label><input style={input} type="time" step={900} required value={d.start_time} onChange={(e) => setD({ ...d, start_time: e.target.value })} /></div>
          <div><label style={label}>Finish</label><input style={input} type="time" step={900} required value={d.end_time} onChange={(e) => setD({ ...d, end_time: e.target.value })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={label}>Unpaid break</label>
            <select style={input} value={d.break_minutes} onChange={(e) => setD({ ...d, break_minutes: Number(e.target.value) })}>
              {[0, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m === 0 ? "None" : `${m} min`}</option>)}
            </select>
          </div>
          <div><label style={label}>Role</label>
            <select style={input} value={d.role} onChange={(e) => setD({ ...d, role: e.target.value })}>
              <option value="">—</option>
              {roles.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>
          {hours > 0 ? `${hours.toFixed(2).replace(/\.?0+$/, "")} paid hours` : "Start and finish can't be the same"}
          {overnight ? " · finishes after midnight" : ""}
        </p>
        <button type="submit" disabled={saving || hours === 0} style={{ ...btn("primary"), opacity: saving || hours === 0 ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save shift"}
        </button>
        {d.id && <button type="button" onClick={() => onDelete(d.id!)} style={btn("danger")}>Delete shift</button>}
      </form>
    </Modal>
  );
}

export default function Page() {
  return <Suspense fallback={null}><WeekPage /></Suspense>;
}
