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
import { roleSwatch, UNFILLED } from "@/lib/roleColors";
import { holidayOn } from "@/lib/holidays";

type DayNote = { id: string; date: string; note: string };

type Draft = {
  id?: string;
  staff_id: string; // "" = unfilled (no one yet)
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  role: string;
  notes: string;
};

const hhmm = (t: string) => t.slice(0, 5);

async function fetchWeek(monday: string, days: string[]) {
  const sb = supabase();
  const [st, ro, to, dn] = await Promise.all([
    sb.from("staff").select("*").eq("active", true).order("name"),
    sb.from("rosters").select("*").eq("week_start", monday).maybeSingle(),
    sb.from("time_off").select("*").lte("start_date", days[6]).gte("end_date", days[0]).neq("status", "declined"),
    sb.from("day_notes").select("id, date, note").gte("date", days[0]).lte("date", days[6]),
  ]);
  const shifts = ro.data
    ? (await sb.from("shifts").select("*").eq("roster_id", ro.data.id).order("start_time")).data ?? []
    : [];
  return { staff: st.data ?? [], roster: ro.data ?? null, timeOff: to.data ?? [], shifts, dayNotes: (dn.data ?? []) as DayNote[] };
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
  const [dayNotes, setDayNotes] = useState<DayNote[]>([]);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [hideStateTip, setHideStateTip] = useState(() => typeof window !== "undefined" && localStorage.getItem("smeasy-hide-state-tip") === "1");
  const [wagesHelp, setWagesHelp] = useState(false);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    fetchWeek(monday, days).then((w) => {
      if (cancelled) return;
      setStaff(w.staff); setRoster(w.roster); setTimeOff(w.timeOff); setShifts(w.shifts); setDayNotes(w.dayNotes);
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
    for (const s of shifts) if (s.staff_id) m.set(s.staff_id, (m.get(s.staff_id) ?? 0) + shiftHours(s.start_time, s.end_time, s.break_minutes));
    return m;
  }, [shifts]);
  const unfilled = shifts.filter((s) => !s.staff_id);
  const totalHours = [...hoursByStaff.values()].reduce((a, b) => a + b, 0);
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s])), [staff]);
  const wages = [...hoursByStaff.entries()].reduce((sum, [id, h]) => sum + h * Number(staffById.get(id)?.hourly_rate ?? 0), 0);
  const missingRate = [...hoursByStaff.keys()].filter((id) => staffById.get(id)?.hourly_rate == null).length;
  const pending = timeOff.filter((t) => t.status === "pending");
  const published = roster?.status === "published";
  const isPast = monday < thisMonday();
  const roles = business?.roles ?? [];
  const dayInfo = (d: string) => ({ holiday: holidayOn(d, business?.state), note: dayNotes.find((n) => n.date === d)?.note ?? null });

  const offOn = (staffId: string, date: string) =>
    timeOff.find((t) => t.staff_id === staffId && t.status === "approved" && t.start_date <= date && t.end_date >= date);

  // ── Actions ──────────────────────────────────────────────────────────────
  function newShift(staffId: string, date: string) {
    const person = staffById.get(staffId);
    const last = [...shifts].reverse().find((s) => (s.staff_id ?? "") === staffId);
    setDraft({
      staff_id: staffId, date,
      start_time: last ? hhmm(last.start_time) : "09:00",
      end_time: last ? hhmm(last.end_time) : "17:00",
      break_minutes: last?.break_minutes ?? 30,
      role: last?.role ?? person?.default_role ?? business?.roles[0] ?? "",
      notes: "",
    });
  }

  function editShift(s: Shift) {
    setDraft({ id: s.id, staff_id: s.staff_id ?? "", date: s.date, start_time: hhmm(s.start_time), end_time: hhmm(s.end_time), break_minutes: s.break_minutes, role: s.role ?? "", notes: s.notes ?? "" });
  }

  async function saveShift(d: Draft) {
    if (!business) return;
    const sb = supabase();
    const r = await ensureRoster(business);
    if (!r) return;
    const row = { business_id: business.id, roster_id: r.id, staff_id: d.staff_id || null, date: d.date,
      start_time: d.start_time, end_time: d.end_time, break_minutes: d.break_minutes, role: d.role || null,
      notes: d.notes.trim() || null };
    const { data, error } = d.id
      ? await sb.from("shifts").update(row).eq("id", d.id).select().single()
      : await sb.from("shifts").insert(row).select().single();
    if (error || !data) { setNotice("Couldn't save that shift. Check the times and try again."); return; }
    setShifts((all) => (d.id ? all.map((s) => (s.id === d.id ? data : s)) : [...all, data]));
    setDraft(null);
  }

  async function addStaff(name: string) {
    if (!business) return false;
    const { data } = await supabase().from("staff")
      .insert({ business_id: business.id, name, default_role: business.roles[0] ?? null }).select().single();
    if (!data) return false;
    setStaff((all) => [...(all ?? []), data].sort((a, b) => a.name.localeCompare(b.name)));
    return true;
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
    const key = (staffId: string | null, date: string, start: string, end: string) => `${staffId ?? ""}|${date}|${hhmm(start)}|${hhmm(end)}`;
    const already = new Set(shifts.map((s) => key(s.staff_id, s.date, s.start_time, s.end_time)));
    const fromLastWeek = (prevShifts ?? []).filter((s) => !s.staff_id || activeIds.has(s.staff_id));
    const toCopy = fromLastWeek.filter((s) => !already.has(key(s.staff_id, addDays(s.date, 7), s.start_time, s.end_time)));
    if (toCopy.length === 0) {
      setNotice(fromLastWeek.length ? "Everything from last week is already on this week." : "Last week has no shifts to copy.");
      setBusy(false);
      return;
    }
    const r = await ensureRoster(business);
    if (r) {
      const { data } = await sb.from("shifts").insert(toCopy.map((s) => ({
        business_id: business.id, roster_id: r.id, staff_id: s.staff_id, date: addDays(s.date, 7),
        start_time: s.start_time, end_time: s.end_time, break_minutes: s.break_minutes, role: s.role, notes: s.notes,
      }))).select();
      setShifts((all) => [...all, ...(data ?? [])]);
      const ids = new Set((data ?? []).map((s) => s.id));
      setCascadeIds(ids);
      setTimeout(() => setCascadeIds(new Set()), 1200);
      const clashes = (data ?? []).filter((s) => s.staff_id && offOn(s.staff_id, s.date)).length;
      const n = data?.length ?? 0;
      const skipped = fromLastWeek.length - toCopy.length;
      setNotice(`Copied ${n} ${n === 1 ? "shift" : "shifts"} from last week.` + (skipped ? ` Skipped ${skipped} already on this week.` : "") + (clashes ? ` ${clashes} clash with approved time off — check the orange days.` : ""));
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

  async function saveDayNote(date: string, note: string) {
    if (!business) return;
    const sb = supabase();
    const existing = dayNotes.find((n) => n.date === date);
    const text = note.trim();
    if (!text) {
      if (existing) await sb.from("day_notes").delete().eq("id", existing.id);
      setDayNotes((all) => all.filter((n) => n.date !== date));
    } else {
      const { data } = await sb.from("day_notes")
        .upsert({ business_id: business.id, date, note: text }, { onConflict: "business_id,date" })
        .select("id, date, note").single();
      if (data) setDayNotes((all) => [...all.filter((n) => n.date !== date), data]);
    }
    setEditingDay(null);
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
      shifts: shifts.map((s) => ({ ...s, staff_name: s.staff_id ? staffById.get(s.staff_id)?.name ?? "" : "" })),
      roles,
      state: business.state,
      dayNotes,
      teamLink: published ? teamLink() : undefined,
    });
  }

  function downloadCSV() {
    // One row per shift (bookkeepers need the day and times for weekend and
    // public-holiday rates), then a per-person summary. "Actual hours" starts
    // equal to rostered hours so the manager can adjust it before sending.
    const head = ["Name", "Date", "Day", "Start", "Finish", "Unpaid break (min)", "Rostered hours", "Actual hours", "Role"];
    const rows: string[][] = [head];
    const sorted = shifts.filter((s) => s.staff_id).sort((a, b) =>
      (staffById.get(a.staff_id!)?.name ?? "").localeCompare(staffById.get(b.staff_id!)?.name ?? "") ||
      a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
    for (const s of sorted) {
      const p = staffById.get(s.staff_id!);
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
            {!published && <span> — your team can&apos;t see this week until you publish</span>}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {staff.length > 0 && !isPast && (
            <button onClick={copyLastWeek} disabled={busy} style={btn()} title="Adds last week's shifts to this week. Shifts already here aren't doubled up.">Copy last week</button>
          )}
          {published && <button onClick={copyTeamLink} style={btn()}>{linkCopied ? "Link copied ✓" : "Copy team link"}</button>}
          {shifts.length > 0 && <button onClick={downloadPdf} style={btn()}>PDF</button>}
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
          <span><strong style={{ color: C.dark }}>{shifts.length - unfilled.length}</strong> {shifts.length - unfilled.length === 1 ? "shift" : "shifts"}</span>
          {unfilled.length > 0 && (
            <span style={{ color: UNFILLED.text, fontWeight: 600 }}>{unfilled.length} unfilled</span>
          )}
          {wages > 0 && (
            <span>
              Wages <strong style={{ color: C.dark }}>≈ {fmtAUD(wages)}</strong>
              {missingRate > 0 && <span style={{ color: C.muted }}> (excludes {missingRate} without a rate)</span>}
              {" "}<button onClick={() => setWagesHelp((v) => !v)} aria-expanded={wagesHelp} aria-label="How wages are worked out"
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 999, width: 18, height: 18, padding: 0, fontSize: 11, fontWeight: 700, color: C.muted, cursor: "pointer", lineHeight: "16px", fontFamily: "inherit" }}>?</button>
            </span>
          )}
          <button onClick={downloadCSV} style={{ background: "none", border: "none", padding: 0, marginLeft: "auto", color: C.secondary, textDecoration: "underline", cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}
            title="One row per shift, plus totals by person. Open in Excel or send to your bookkeeper.">Download hours for payroll (CSV)</button>
        </div>
      )}
      {wagesHelp && wages > 0 && (
        <Banner onClose={() => setWagesHelp(false)}>
          <strong style={{ color: C.dark }}>How wages are worked out:</strong> each person&apos;s paid hours this week × the hourly rate you entered for them (Team → Edit → More details).
          It&apos;s a rough guide at base rates only. It doesn&apos;t include penalty rates, overtime, allowances or super, and people without a rate aren&apos;t counted.
        </Banner>
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

      {!business.state && staff.length > 0 && !hideStateTip && (
        <Banner onClose={() => { localStorage.setItem("smeasy-hide-state-tip", "1"); setHideStateTip(true); }}>
          Want public holidays marked on your roster? <Link href="/settings" style={{ color: C.dark }}>Set your state</Link> in Settings.
        </Banner>
      )}
      {staff.length > 0 && shifts.length === 0 && (
        <Banner>
          {isMobile ? <>Tap <strong style={{ color: C.dark }}>+ Add shift</strong> on a day</> : <>Click <strong style={{ color: C.dark }}>+</strong> in a person&apos;s row</>} to give them a shift
          {!isPast && <>, or use <strong style={{ color: C.dark }}>Copy last week</strong></>}.
        </Banner>
      )}

      {staff.length === 0 ? (
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "40px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }} aria-hidden>&#128197;</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: "0 0 6px" }}>Your roster starts with your team</p>
          <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 16px", lineHeight: 1.5 }}>Add the people you roster, then come back here to build the week.</p>
          <Link href="/team" style={{ ...btn("primary"), textDecoration: "none", display: "inline-block" }}>Add team members</Link>
        </div>
      ) : isMobile ? (
        <>
          <DayCards days={days} staff={staff} shifts={shifts} offOn={offOn} onAdd={newShift} onEdit={editShift} cascadeIds={cascadeIds}
            roles={roles} dayInfo={dayInfo} onDay={setEditingDay} />
          <div style={{ marginTop: 10, background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2 }}><AddStaff onAdd={addStaff} /></div>
        </>
      ) : (
        <Grid days={days} staff={staff} shifts={shifts} hours={hoursByStaff} offOn={offOn} onAdd={newShift} onEdit={editShift} cascadeIds={cascadeIds}
          roles={roles} dayInfo={dayInfo} onDay={setEditingDay} addStaff={<AddStaff onAdd={addStaff} />} />
      )}

      {editingDay && (
        <DayNoteEditor date={editingDay} holiday={dayInfo(editingDay).holiday} note={dayInfo(editingDay).note ?? ""}
          onClose={() => setEditingDay(null)} onSave={(n) => saveDayNote(editingDay, n)} />
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
          {unfilled.length > 0 && (
            <p style={{ fontSize: 14, color: UNFILLED.text, margin: "0 0 10px" }}>
              {unfilled.length === 1 ? "1 shift still has" : `${unfilled.length} shifts still have`} no one on it. Staff can&apos;t see unfilled shifts — fill them when you can.
            </p>
          )}
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

function AddStaff({ onAdd }: { onAdd: (name: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.secondary, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left" }}>
        + Add someone to the team
      </button>
    );
  }
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      setSaving(true);
      const ok = await onAdd(name.trim());
      setSaving(false);
      if (ok) { setName(""); setOpen(false); }
    }} style={{ display: "flex", gap: 8, padding: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Sam Nguyen" aria-label="New team member name"
        style={{ ...input, maxWidth: 280 }} />
      <button type="submit" disabled={saving || !name.trim()} style={{ ...btn("primary"), opacity: name.trim() ? 1 : 0.5 }}>{saving ? "Adding…" : "Add"}</button>
      <button type="button" onClick={() => { setOpen(false); setName(""); }} style={btn("ghost")}>Cancel</button>
      <span style={{ fontSize: 12, color: C.muted }}>Add their mobile and role later on the Team page.</span>
    </form>
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
type DayInfo = (d: string) => { holiday: string | null; note: string | null };

function Chip({ s, roles, onClick, cascade, cascadeDelay = 0 }: {
  s: Shift; roles: string[]; onClick: () => void; cascade?: boolean; cascadeDelay?: number;
}) {
  const open = !s.staff_id;
  const sw = open ? UNFILLED : roleSwatch(s.role, roles);
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={cascade ? "cascade-in" : undefined} title={s.notes ?? undefined} style={{
      display: "block", width: "100%", textAlign: "left", background: sw.bg, border: `1px ${open ? "dashed" : "solid"} ${sw.border}`,
      color: sw.text, borderRadius: C.r1, padding: "4px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer", lineHeight: 1.3, fontFamily: "inherit",
      ...(cascade ? { animationDelay: `${cascadeDelay}ms` } : {}),
    }}>
      {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
      {(s.role || open) && <span style={{ display: "block", fontWeight: 500, opacity: 0.85 }}>{open ? `Unfilled${s.role ? ` · ${s.role}` : ""}` : s.role}</span>}
      {s.notes && <span style={{ display: "block", fontWeight: 400, fontStyle: "italic", opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.notes}</span>}
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

function coverage(shifts: Shift[], d: string) {
  const day = shifts.filter((s) => s.date === d);
  const filled = day.filter((s) => s.staff_id);
  const people = new Set(filled.map((s) => s.staff_id)).size;
  const hrs = filled.reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0);
  return { people, hrs, gaps: day.length - filled.length };
}

function CoverageText({ c }: { c: ReturnType<typeof coverage> }) {
  if (!c.people && !c.gaps) return <span style={{ color: C.faint }}>—</span>;
  return (
    <>
      {c.people} on · {c.hrs.toFixed(c.hrs % 1 ? 1 : 0)}h
      {c.gaps > 0 && <span style={{ color: UNFILLED.text, fontWeight: 700 }}> · {c.gaps} unfilled</span>}
    </>
  );
}

function DayHeaderExtras({ info }: { info: { holiday: string | null; note: string | null } }) {
  return (
    <>
      {info.holiday && <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#8a2350", textTransform: "none" }}>Public holiday · {info.holiday}</span>}
      {info.note && <span style={{ display: "block", fontSize: 11, fontWeight: 500, color: C.secondary, textTransform: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={info.note}>{info.note}</span>}
    </>
  );
}

function Grid({ days, staff, shifts, hours, offOn, onAdd, onEdit, cascadeIds, roles, dayInfo, onDay, addStaff }: {
  days: string[]; staff: Staff[]; shifts: Shift[]; hours: Map<string, number>; offOn: OffOn;
  onAdd: (staffId: string, date: string) => void; onEdit: (s: Shift) => void; cascadeIds: Set<string>;
  roles: string[]; dayInfo: DayInfo; onDay: (d: string) => void; addStaff: React.ReactNode;
}) {
  const cols = "160px repeat(7, minmax(90px, 1fr)) 60px";
  const hasUnfilled = shifts.some((s) => !s.staff_id);
  let cascadeIdx = 0;
  const row = (key: string, name: React.ReactNode, staffId: string, total: React.ReactNode, tint?: string) => (
    <div key={key} style={{ display: "grid", gridTemplateColumns: cols, borderBottom: `1px solid ${C.divider}`, minWidth: 860, background: tint }}>
      <div style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600, color: C.dark, display: "flex", alignItems: "center" }}>{name}</div>
      {days.map((d) => {
        const mine = shifts.filter((s) => (s.staff_id ?? "") === staffId && s.date === d);
        const off = staffId ? offOn(staffId, d) : undefined;
        return (
          <div key={d} onClick={() => onAdd(staffId, d)} title="Add shift"
            style={{ padding: 4, minHeight: 52, borderLeft: `1px solid ${C.divider}`, cursor: "pointer", display: "flex", flexDirection: "column", gap: 3, justifyContent: "center", minWidth: 0 }}>
            {off && <OffChip t={off} />}
            {mine.map((s) => { const isCascade = cascadeIds.has(s.id); const delay = isCascade ? cascadeIdx++ * 40 : 0; return <Chip key={s.id} s={s} roles={roles} onClick={() => onEdit(s)} cascade={isCascade} cascadeDelay={delay} />; })}
            {!off && mine.length === 0 && <div style={{ textAlign: "center", color: C.faint, fontSize: 16 }}>+</div>}
          </div>
        );
      })}
      <div style={{ padding: "10px 6px", fontSize: 14, fontWeight: 600, color: C.dark, textAlign: "center", borderLeft: `1px solid ${C.divider}`, alignSelf: "center" }}>{total}</div>
    </div>
  );

  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, background: C.bg, borderBottom: `1px solid ${C.border}`, minWidth: 860 }}>
        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Staff</div>
        {days.map((d) => {
          const info = dayInfo(d);
          return (
            <button key={d} onClick={() => onDay(d)} title={info.note ? "Edit day note" : "Add a note for this day"}
              style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", textAlign: "center", border: "none", borderLeft: `1px solid ${C.divider}`, background: info.holiday ? "#fbe3ec" : "transparent", cursor: "pointer", fontFamily: "inherit", minWidth: 0 }}>
              {fmtDay(d).replace(/ \w+$/, "")}
              <DayHeaderExtras info={info} />
            </button>
          );
        })}
        <div style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>HRS</div>
      </div>
      {hasUnfilled && row("unfilled", <span style={{ color: UNFILLED.text }}>Unfilled</span>, "", "", "#fffaf9")}
      {staff.map((p) => row(p.id, p.name, p.id, hours.get(p.id) ? hours.get(p.id)!.toFixed(1) : "—"))}
      <div style={{ borderBottom: `1px solid ${C.divider}`, minWidth: 860 }}>{addStaff}</div>
      <div style={{ display: "grid", gridTemplateColumns: cols, minWidth: 860, background: C.bg }}>
        <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Cover</div>
        {days.map((d) => (
          <div key={d} style={{ padding: "8px 4px", fontSize: 12, color: C.secondary, textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>
            <CoverageText c={coverage(shifts, d)} />
          </div>
        ))}
        <div style={{ borderLeft: `1px solid ${C.divider}` }} />
      </div>
    </div>
  );
}

function DayCards({ days, staff, shifts, offOn, onAdd, onEdit, cascadeIds, roles, dayInfo, onDay }: {
  days: string[]; staff: Staff[]; shifts: Shift[]; offOn: OffOn;
  onAdd: (staffId: string, date: string) => void; onEdit: (s: Shift) => void; cascadeIds: Set<string>;
  roles: string[]; dayInfo: DayInfo; onDay: (d: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {days.map((d) => {
        const dayShifts = shifts.filter((s) => s.date === d)
          .sort((a, b) => Number(!!a.staff_id) - Number(!!b.staff_id) || a.start_time.localeCompare(b.start_time));
        const offs = staff.map((p) => ({ p, t: offOn(p.id, d) })).filter((x) => x.t);
        const info = dayInfo(d);
        return (
          <div key={d} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: info.holiday ? "#fbe3ec" : C.bg, borderBottom: `1px solid ${C.border}` }}>
              <button onClick={() => onDay(d)} style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>{fmtDay(d)}</span>
                <span style={{ fontSize: 12, color: C.secondary, marginLeft: 8 }}><CoverageText c={coverage(shifts, d)} /></span>
                <DayHeaderExtras info={info} />
              </button>
              <button onClick={() => onAdd(staff[0].id, d)} style={{ ...btn("ghost"), padding: "4px 8px", fontSize: 13 }}>+ Add shift</button>
            </div>
            {dayShifts.length === 0 && offs.length === 0 && <div style={{ padding: "10px 14px", fontSize: 13, color: C.faint }}>Nothing yet — tap + to add a shift</div>}
            {dayShifts.map((s) => {
              const open = !s.staff_id;
              const sw = open ? UNFILLED : roleSwatch(s.role, roles);
              return (
                <button key={s.id} onClick={() => onEdit(s)} className={cascadeIds.has(s.id) ? "cascade-in" : undefined} style={{ display: "flex", width: "100%", gap: 10, alignItems: "center", padding: "10px 14px", background: "none", border: "none", borderTop: `1px solid ${C.divider}`, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: open ? UNFILLED.text : C.dark }}>{open ? "Unfilled" : staff.find((p) => p.id === s.staff_id)?.name}</span>
                    {s.notes && <span style={{ display: "block", fontSize: 12, color: C.secondary, fontStyle: "italic" }}>{s.notes}</span>}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sw.text, background: sw.bg, border: `1px ${open ? "dashed" : "solid"} ${sw.border}`, borderRadius: C.r1, padding: "3px 8px", whiteSpace: "nowrap" }}>
                    {fmtTime(s.start_time)}–{fmtTime(s.end_time)}{s.role ? ` · ${s.role}` : ""}
                  </span>
                </button>
              );
            })}
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

function DayNoteEditor({ date, holiday, note, onClose, onSave }: {
  date: string; holiday: string | null; note: string; onClose: () => void; onSave: (n: string) => Promise<void>;
}) {
  const [text, setText] = useState(note);
  const [saving, setSaving] = useState(false);
  return (
    <Modal title={fmtDay(date)} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(text); setSaving(false); }} style={{ display: "grid", gap: 12 }}>
        {holiday && <p style={{ margin: 0, fontSize: 14, color: "#8a2350", fontWeight: 600 }}>Public holiday: {holiday}</p>}
        <div>
          <label style={label} htmlFor="daynote">Note for this day (your team sees it once published)</label>
          <input id="daynote" style={input} maxLength={200} value={text} autoFocus onChange={(e) => setText(e.target.value)} placeholder="e.g. Function — 40 people from 6pm" />
        </div>
        <button type="submit" disabled={saving} style={btn("primary")}>{saving ? "Saving…" : "Save note"}</button>
        {note && <button type="button" onClick={() => onSave("")} style={btn("danger")}>Remove note</button>}
        {holiday && <p style={{ margin: 0, fontSize: 12, color: C.muted }}>Public holidays come from a published Australian holiday calendar. Check your state&apos;s official list if in doubt.</p>}
      </form>
    </Modal>
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
  const off = d.staff_id ? offOn(d.staff_id, d.date) : undefined;

  return (
    <Modal title={`${d.id ? "Edit" : "Add"} shift · ${fmtDay(d.date)}`} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(d); setSaving(false); }} style={{ display: "grid", gap: 12 }}>
        <div><label style={label}>Who</label>
          <select style={input} value={d.staff_id} onChange={(e) => setD({ ...d, staff_id: e.target.value })}>
            {staff.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="">No one yet (unfilled)</option>
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
        <div><label style={label}>Note (optional — staff see it)</label>
          <input style={input} maxLength={200} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="e.g. Open up — keys in the safe" />
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
