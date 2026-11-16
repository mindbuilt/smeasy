"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import type { Business, Roster, Shift, Staff, TimeOff } from "@/lib/types";
import { addDays, dayName, fmtAUD, fmtDay, fmtTime, fmtWeek, shiftHours, thisWeekStart, toISO, weekDates, weekStartOf } from "@/lib/dates";
import { AppShell, Avatar, C, Loading, Modal, btn, card, haptic, input, label } from "@/components/ui";
import { CalendarPlus, CalendarDays, Check, ChevronLeft, ChevronRight, Copy, Download, FileText, Info, Link2, Columns3 as Columns, List, MoreHorizontal, Plus, StickyNote, Undo2, UserPlus, X } from "lucide-react";
import DayTimeline, { dayCover } from "@/components/DayTimeline";
import { downloadHoursCsv } from "@/lib/worked";
import { atStaffLimit, hasCore, usePlan } from "@/lib/usePlan";
import { DEFAULT_WEEKLY_HOURS, FREE_STAFF_LIMIT } from "@/lib/site";
import { downloadRosterPdf } from "@/lib/rosterPdf";
import { roleSwatch, UNFILLED } from "@/lib/roleColors";
import { holidayOn } from "@/lib/holidays";
import { payDetailsOn } from "@/lib/pay";

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
const fmtH = (h: number) => h.toFixed(2).replace(/\.?0+$/, "");
/** Usual weekly paid hours (the roster notes when someone goes above them). */
const limitOf = (p: Staff | undefined) => Number(p?.max_weekly_hours ?? DEFAULT_WEEKLY_HOURS);

async function fetchWeek(weekStart: string, days: string[]) {
  const sb = supabase();
  const [st, ro, to, dn] = await Promise.all([
    sb.from("staff").select("*").eq("active", true).order("name"),
    sb.from("rosters").select("*").eq("week_start", weekStart).maybeSingle(),
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
  const startDay = business?.week_start_day ?? 1;
  const weekStart = weekStartOf(params.get("w") ?? toISO(new Date()), startDay);
  const days = useMemo(() => weekDates(weekStart), [weekStart]);
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
  const [selDay, setSelDay] = useState<string | null>(null);
  const [slide, setSlide] = useState<"left" | "right">("right");
  const [moreOpen, setMoreOpen] = useState(false);
  const plan = usePlan(business?.id);
  const [hiddenHoursNote, setHiddenHoursNote] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("smeasy-hours-note") ?? "" : ""));
  // Desktop: the week grid or one day as a timeline. Phone: the day as a list or a timeline.
  const [deskView, setDeskViewState] = useState<"week" | "day">(() => (typeof window !== "undefined" && localStorage.getItem("smeasy-desk-view") === "day" ? "day" : "week"));
  const [phoneMode, setPhoneModeState] = useState<"list" | "timeline">(() => (typeof window !== "undefined" && localStorage.getItem("smeasy-phone-day") === "timeline" ? "timeline" : "list"));
  const setDeskView = (v: "week" | "day") => { localStorage.setItem("smeasy-desk-view", v); setDeskViewState(v); };
  const setPhoneMode = (v: "list" | "timeline") => { haptic(5); localStorage.setItem("smeasy-phone-day", v); setPhoneModeState(v); };

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    fetchWeek(weekStart, days).then((w) => {
      if (cancelled) return;
      setStaff(w.staff); setRoster(w.roster); setTimeOff(w.timeOff); setShifts(w.shifts); setDayNotes(w.dayNotes);
    });
    return () => { cancelled = true; };
  }, [business, weekStart, days]);

  async function ensureRoster
(b: Business): Promise<Roster | null> {
    if (roster) return roster;
    const sb = supabase();
    const { data, error } = await sb.from("rosters").insert({ business_id: b.id, week_start: weekStart }).select().single();
    if (error) {
      // Created in another tab meanwhile — fetch it.
      const { data: existing } = await sb.from("rosters").select("*").eq("week_start", weekStart).maybeSingle();
      setRoster(existing ?? null);
      return existing ?? null;
    }
    setRoster(data);
    return data;
  }

  const goWeek = (n: number) => router.push(`/week?w=${addDays(weekStart, n * 7)}`);

  // ── Derived numbers ──────────────────────────────────────────────────────
  const hoursByStaff = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of shifts) if (s.staff_id) m.set(s.staff_id, (m.get(s.staff_id) ?? 0) + shiftHours(s.start_time, s.end_time, s.break_minutes));
    return m;
  }, [shifts]);
  const unfilled = shifts.filter((s) => !s.staff_id);
  const totalHours = [...hoursByStaff.values()].reduce((a, b) => a + b, 0);
  const staffById = useMemo(() => new Map((staff ?? []).map((s) => [s.id, s])), [staff]);
  const pay = payDetailsOn(business);
  const wages = [...hoursByStaff.entries()].reduce((sum, [id, h]) => sum + h * Number(staffById.get(id)?.hourly_rate ?? 0), 0);
  const missingRate = [...hoursByStaff.keys()].filter((id) => staffById.get(id)?.hourly_rate == null).length;
  const pending = timeOff.filter((t) => t.status === "pending");
  // Usual hours (Core): who's rostered above their usual weekly hours. Information, not an alarm.
  const overtimeOn = hasCore(plan);
  const overtime = overtimeOn ? (staff ?? []).flatMap((p) => {
    const h = hoursByStaff.get(p.id) ?? 0;
    return h > limitOf(p) ? [{ p, h, limit: limitOf(p) }] : [];
  }) : [];
  // Hiding the note lasts until the numbers change (or another week).
  const hoursNoteKey = `${weekStart}:${overtime.map(({ p, h }) => `${p.id}=${h}`).join(",")}`;
  const published = roster?.status === "published";
  const isPast = weekStart < thisWeekStart(startDay);
  const roles = business?.roles ?? [];
  const dayInfo = (d: string) => ({ holiday: holidayOn(d, business?.state), note: dayNotes.find((n) => n.date === d)?.note ?? null });

  const offOn = (staffId: string, date: string) =>
    timeOff.find((t) => t.staff_id === staffId && t.status === "approved" && t.start_date <= date && t.end_date >= date);

  // ── Actions ──────────────────────────────────────────────────────────────
  function newShift(staffId: string, date: string, start?: string, end?: string) {
    const person = staffById.get(staffId);
    const last = [...shifts].reverse().find((s) => (s.staff_id ?? "") === staffId);
    const hours = start && end ? shiftHours(start, end, 0) : null;
    setDraft({
      staff_id: staffId, date,
      start_time: start ?? (last ? hhmm(last.start_time) : "09:00"),
      end_time: end ?? (last ? hhmm(last.end_time) : "17:00"),
      break_minutes: hours !== null ? (hours >= 5 ? 30 : 0) : last?.break_minutes ?? 30,
      role: last?.role ?? person?.default_role ?? business?.roles[0] ?? "",
      notes: "",
    });
  }

  function editShift(s: Shift) {
    setDraft({ id: s.id, staff_id: s.staff_id ?? "", date: s.date, start_time: hhmm(s.start_time), end_time: hhmm(s.end_time), break_minutes: s.break_minutes, role: s.role ?? "", notes: s.notes ?? "" });
  }

  async function saveShift(d: Draft, alsoOn: string[] = []) {
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
    let copies: Shift[] = [];
    const extra = alsoOn.filter((x) => x !== d.date);
    if (extra.length) {
      const { data: more, error: moreErr } = await sb.from("shifts").insert(extra.map((date) => ({ ...row, date }))).select();
      if (moreErr) setNotice("Saved that shift, but couldn't add it to the other days. Please try again.");
      copies = more ?? [];
      const clashes = copies.filter((c) => c.staff_id && offOn(c.staff_id, c.date)).length;
      if (copies.length) {
        setNotice(`Added the same shift on ${copies.length} more ${copies.length === 1 ? "day" : "days"}.` + (clashes ? ` ${clashes} clash with approved time off, check the orange days.` : ""));
        setCascadeIds(new Set(copies.map((c) => c.id)));
        setTimeout(() => setCascadeIds(new Set()), 1200);
      }
    }
    setShifts((all) => [...(d.id ? all.map((s) => (s.id === d.id ? data : s)) : [...all, data]), ...copies]);
    haptic(copies.length ? [10, 40, 16] : 10);
    setDraft(null);
  }

  async function addStaff(name: string) {
    if (!business) return false;
    const { data, error } = await supabase().from("staff")
      .insert({ business_id: business.id, name, default_role: business.roles[0] ?? null }).select().single();
    if (error?.code === "P0001") { setNotice(`The Free plan is for up to ${FREE_STAFF_LIMIT} staff. Upgrade to Core for unlimited staff. See Settings → Plan.`); return false; }
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
    const prevWeek = addDays(weekStart, -7);
    const { data: prev } = await sb.from("rosters").select("id").eq("week_start", prevWeek).maybeSingle();
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
    if (data) { setRoster(data); setJustPublished(true); haptic([12, 60, 24]); }
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
      weekStart: weekStart,
      people: (staff ?? []).map((p) => p.name),
      shifts: shifts.map((s) => ({ ...s, staff_name: s.staff_id ? staffById.get(s.staff_id)?.name ?? "" : "" })),
      roles,
      state: business.state,
      dayNotes,
      teamLink: published ? teamLink() : undefined,
    });
  }

  function downloadCSV() {
    // Worked hours where they've been confirmed on the Hours page, rostered hours otherwise.
    downloadHoursCsv({ shifts, staff: staff ?? [], pay, weekStart });
  }


  if (!business || !staff) return <AppShell><Loading /></AppShell>;

  const today = toISO(new Date());
  const day = selDay && days.includes(selDay) ? selDay : days.includes(today) ? today : days[0];
  const pickDay = (d: string) => {
    if (d === day) return;
    setSlide(d > day ? "right" : "left");
    setSelDay(d);
    haptic(5);
  };
  const stepDay = (n: number) => {
    const i = days.indexOf(day) + n;
    if (i < 0) { setSlide("left"); setSelDay(addDays(day, -1)); goWeek(-1); return; }
    if (i > 6) { setSlide("right"); setSelDay(addDays(day, 1)); goWeek(1); return; }
    pickDay(days[i]);
  };
  const filled = shifts.length - unfilled.length;
  const statusTone = published
    ? { bg: "#dcfce7", text: "#166534", label: isPast ? "Done" : "Published" }
    : { bg: "#fef3c7", text: "#92400e", label: "Draft" };

  return (
    <AppShell businessName={business.name} email={email}>
      {/* Week header */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexWrap: isMobile ? "nowrap" : "wrap", marginBottom: isMobile ? 10 : 14 }}>
        <button onClick={() => goWeek(-1)} className="app-press" style={{ ...btn(), width: 42, padding: 0, borderRadius: 999, flex: "none" }} aria-label="Previous week"><ChevronLeft size={20} /></button>
        {isMobile ? null : <button onClick={() => goWeek(1)} className="app-press" style={{ ...btn(), width: 42, padding: 0, borderRadius: 999, flex: "none" }} aria-label="Next week"><ChevronRight size={20} /></button>}
        <div style={{ minWidth: 0, flex: isMobile ? 1 : "none", textAlign: isMobile ? "center" : "left" }}>
          <h1 style={{ fontSize: isMobile ? 19 : 24, fontWeight: 800, color: C.dark, margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8, justifyContent: isMobile ? "center" : "flex-start", flexWrap: "wrap" }}>
            {fmtWeek(weekStart)}
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0, padding: "3px 9px", borderRadius: 999, background: statusTone.bg, color: statusTone.text, transition: "background-color 400ms ease, color 400ms ease" }}>{statusTone.label}</span>
          </h1>
          <div style={{ fontSize: isMobile ? 13 : 14, color: C.muted, marginTop: 2 }}>
            {weekStart === thisWeekStart(startDay) ? "This week" : <Link href="/week" style={{ color: C.secondary }}>Back to this week</Link>}
            {isMobile && shifts.length > 0 && <> · {totalHours.toFixed(1).replace(/\.0$/, "")}h · {filled} {filled === 1 ? "shift" : "shifts"}{unfilled.length > 0 && <span style={{ color: UNFILLED.text, fontWeight: 700 }}> · {unfilled.length} unfilled</span>}</>}
            {!isMobile && !published && <> · your team can&apos;t see this week until you publish</>}
            {!isMobile && published && !isPast && <> · your team can see this week, and changes show straight away</>}
          </div>
        </div>
        {isMobile && <button onClick={() => goWeek(1)} className="app-press" style={{ ...btn(), width: 42, padding: 0, borderRadius: 999, flex: "none" }} aria-label="Next week"><ChevronRight size={20} /></button>}
        {isMobile && <button onClick={() => setMoreOpen(true)} className="app-press" style={{ ...btn("ghost"), width: 42, padding: 0, borderRadius: 999, flex: "none", background: "#eef0f3", color: C.dark }} aria-label="More: copy last week, PDF, hours"><MoreHorizontal size={20} /></button>}
        {!isMobile && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {staff.length > 0 && <ViewToggle value={deskView} onChange={setDeskView} options={[["week", "Week", <Columns size={16} key="w" />], ["day", "Day", <CalendarDays size={16} key="d" />]]} />}
            {staff.length > 0 && !isPast && (
              <button onClick={copyLastWeek} disabled={busy} className="app-press" style={btn()} title="Adds last week's shifts to this week. Shifts already here aren't doubled up.">
                <Copy size={17} /> Copy last week
              </button>
            )}
            {published && <button onClick={copyTeamLink} className="app-press" style={btn()}><Link2 size={17} />{linkCopied ? "Copied" : "Team link"}</button>}
            {shifts.length > 0 && <button onClick={downloadPdf} className="app-press" style={btn()}><FileText size={17} /> PDF</button>}
            {published
              ? <button onClick={unpublish} className="app-press" style={btn("ghost")}>Unpublish</button>
              : <button onClick={publish} disabled={busy || shifts.length === 0} className="app-press" style={{ ...btn("accent"), opacity: shifts.length ? 1 : 0.45, padding: "10px 20px" }}>
                  {busy ? "Publishing…" : "Publish to team"}
                </button>}
          </div>
        )}
      </div>
      {/* Summary */}
      {!isMobile && shifts.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
          <Stat value={totalHours.toFixed(1)} label="paid hours" />
          <Stat value={String(filled)} label={filled === 1 ? "shift" : "shifts"} />
          {unfilled.length > 0 && <Stat value={String(unfilled.length)} label="unfilled" tone="danger" />}
          {pay && wages > 0 && (
            <span style={{ ...card, display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 14, color: C.secondary }}>
              Base wages <strong style={{ color: C.dark }}>≈ {fmtAUD(wages)}</strong>
              {missingRate > 0 && <span style={{ color: C.muted }}>(excl. {missingRate} without a rate)</span>}
              <button onClick={() => setWagesHelp((v) => !v)} aria-expanded={wagesHelp} aria-label="How wages are worked out"
                style={{ background: "none", border: "none", padding: 0, color: C.muted, cursor: "pointer", display: "grid" }}><Info size={16} /></button>
            </span>
          )}
          {!isMobile && <button onClick={downloadCSV} className="app-press" style={{ ...btn("ghost"), marginLeft: "auto", color: C.dark }}
            title="One row per shift, plus totals by person. Open in Excel or send to your bookkeeper."><Download size={17} /> Hours for payroll (CSV)</button>}
        </div>
      )}
      {pay && wagesHelp && wages > 0 && (
        <Banner onClose={() => setWagesHelp(false)}>
          <strong style={{ color: C.dark }}>How this is worked out:</strong> each person&apos;s paid hours this week × the hourly rate you entered for them (Team → Edit).
          It&apos;s base rates only: no penalty rates, overtime, allowances or super, and people without a rate aren&apos;t counted. Turn it off any time in Settings → Pay details.
        </Banner>
      )}
      {notice && <Banner onClose={() => setNotice(null)}>{notice}</Banner>}

      {isMobile && overtime.length > 0 && hoursNoteKey !== hiddenHoursNote && (
        <p style={{ fontSize: 13, color: C.secondary, margin: "-4px 0 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <span>Above usual hours: {overtime.map(({ p, h, limit }) => `${p.name.split(" ")[0]} ${fmtH(h)}h (usually ${fmtH(limit)})`).join(", ")}</span>
          <button onClick={() => { localStorage.setItem("smeasy-hours-note", hoursNoteKey); setHiddenHoursNote(hoursNoteKey); }} aria-label="Hide this note"
            style={{ background: "none", border: "none", padding: 4, color: C.muted, cursor: "pointer", display: "grid", flex: "none" }}><X size={15} /></button>
        </p>
      )}

      {/* Time-off requests */}
      {pending.length > 0 && (
        <section style={{ ...card, padding: "14px 16px", marginBottom: 14, background: C.offBg, boxShadow: "none" }}>
          <h2 style={{ fontSize: 15, fontWeight: 750, color: C.offText, margin: "0 0 8px" }}>Time-off requests</h2>
          {pending.map((t) => {
            const who = staffById.get(t.staff_id)?.name ?? "Someone";
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "6px 0" }}>
                <Avatar name={who} size={34} tone={{ bg: "#ffedd5", text: C.offText }} />
                <span style={{ flex: 1, minWidth: 160, fontSize: 15 }}>
                  <strong>{who}</strong>{" "}
                  <span style={{ color: C.secondary }}>{t.start_date === t.end_date ? fmtDay(t.start_date) : `${fmtDay(t.start_date)} – ${fmtDay(t.end_date)}`}{t.reason && ` · ${t.reason}`}</span>
                </span>
                <button onClick={() => decide(t, "approved")} className="app-press" style={btn("primary")}>Approve</button>
                <button onClick={() => decide(t, "declined")} className="app-press" style={btn()}>Decline</button>
              </div>
            );
          })}
        </section>
      )}

      {!isMobile && !business.state && staff.length > 0 && !hideStateTip && (
        <Banner onClose={() => { localStorage.setItem("smeasy-hide-state-tip", "1"); setHideStateTip(true); }}>
          Want public holidays marked on your roster? <Link href="/settings" style={{ color: C.dark, fontWeight: 600 }}>Set your state</Link> in Settings.
        </Banner>
      )}

      {staff.length === 0 ? (
        <div style={{ ...card, padding: "44px 28px", textAlign: "center" }}>
          <span style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, borderRadius: 18, background: C.shiftBg, color: C.shiftText, marginBottom: 14 }}><UserPlus size={26} /></span>
          <p style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: "0 0 6px" }}>Your roster starts with your team</p>
          <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 18px", lineHeight: 1.5 }}>Add the people you roster, then come back here to build the week.</p>
          <Link href="/team" className="app-press" style={{ ...btn("primary"), textDecoration: "none" }}>Add your team</Link>
        </div>
      ) : isMobile ? (
        <>
          <WeekStrip days={days} day={day} today={today} shifts={shifts} dayInfo={dayInfo} onPick={pickDay} />
          <DayView key={day} slide={slide} d={day} staff={staff} shifts={shifts} roles={roles} offOn={offOn} info={dayInfo(day)}
            onEdit={editShift} onDay={() => setEditingDay(day)} onSwipe={stepDay} cascadeIds={cascadeIds}
            mode={phoneMode} onMode={setPhoneMode} compact isToday={day === today} readOnly={isPast} onNew={(id, a, b) => newShift(id, day, a, b)}
            atStart={day === days[0]} atEnd={day === days[6]}
            empty={isPast ? <div>No shifts this day.</div> : (
              <>
                <div style={{ marginBottom: 12 }}>Tap + to add a shift.</div>
                {shifts.length === 0 && <button onClick={copyLastWeek} disabled={busy} className="app-press" style={btn()}><Copy size={17} /> Copy last week</button>}
              </>
            )} />
          <div style={{ ...card, marginTop: 12 }}><AddStaff onAdd={addStaff} limited={atStaffLimit(plan, staff.length)} /></div>
          {!business.state && !hideStateTip && (
            <div style={{ marginTop: 12 }}>
              <Banner onClose={() => { localStorage.setItem("smeasy-hide-state-tip", "1"); setHideStateTip(true); }}>
                Want public holidays marked on your roster? <Link href="/settings" style={{ color: C.dark, fontWeight: 600 }}>Set your state</Link> in Settings.
              </Banner>
            </div>
          )}
          <div style={{ height: 88 }} aria-hidden />
          {/* Bottom dock: publish (drafts with shifts) + add shift */}
          {(!isPast || (!published && shifts.length > 0)) && typeof document !== "undefined" && createPortal(
            <div className="app" style={{ background: "transparent", position: "fixed", left: 16, right: 16, bottom: "calc(84px + env(safe-area-inset-bottom))", zIndex: 44, display: "flex", gap: 10, alignItems: "center", justifyContent: "flex-end", pointerEvents: "none" }}>
              {!published && shifts.length > 0 && (
                <button onClick={publish} disabled={busy} className="app-press" style={{ ...btn("accent"), flex: 1, minHeight: 56, borderRadius: 999, fontSize: 16, pointerEvents: "auto", boxShadow: "0 6px 16px rgba(101,163,13,0.35), 0 2px 4px rgba(17,24,39,0.12)" }}>
                  {busy ? "Publishing…" : "Publish to team"}
                </button>
              )}
              {!isPast && (
                <button onClick={() => { haptic(6); newShift(staff[0].id, day); }} aria-label={`Add a shift on ${fmtDay(day)}`} className="app-press" style={{
                  width: 58, height: 58, borderRadius: 999, flex: "none", pointerEvents: "auto",
                  background: !published && shifts.length > 0 ? C.dark : C.accent, color: !published && shifts.length > 0 ? C.white : C.dark,
                  border: "none", display: "grid", placeItems: "center", cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(17,24,39,0.22), 0 2px 4px rgba(17,24,39,0.12)",
                }}><Plus size={28} strokeWidth={2.6} /></button>
              )}
            </div>,
            document.body,
          )}
        </>
      ) : deskView === "day" ? (
        <div style={{ maxWidth: 1100 }}>
          <WeekStrip days={days} day={day} today={today} shifts={shifts} dayInfo={dayInfo} onPick={pickDay} />
          <DayView key={day} slide={slide} d={day} staff={staff} shifts={shifts} roles={roles} offOn={offOn} info={dayInfo(day)}
            onEdit={editShift} onDay={() => setEditingDay(day)} onSwipe={stepDay} cascadeIds={cascadeIds}
            mode="timeline" isToday={day === today} readOnly={isPast} onNew={(id, a, b) => newShift(id, day, a, b)}
            atStart={day === days[0]} atEnd={day === days[6]}
            empty={isPast ? <div>No shifts this day.</div> : (
              <>
                <div style={{ marginBottom: 12 }}>No shifts on this day yet.</div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                  <button onClick={() => newShift("", day)} className="app-press" style={btn()}><Plus size={17} /> Add a shift</button>
                  {shifts.length === 0 && <button onClick={copyLastWeek} disabled={busy} className="app-press" style={btn()}><Copy size={17} /> Copy last week</button>}
                </div>
              </>
            )} />
        </div>
      ) : (
        <>
          {shifts.length === 0 && (
            <p style={{ fontSize: 14, color: C.muted, margin: "0 0 10px" }}>
              Click any empty cell to give someone a shift{!isPast && <>, or use <strong style={{ color: C.dark }}>Copy last week</strong></>}.
            </p>
          )}
          <Grid days={days} today={today} staff={staff} shifts={shifts} hours={hoursByStaff} offOn={offOn} onAdd={newShift} onEdit={editShift} cascadeIds={cascadeIds}
            roles={roles} dayInfo={dayInfo} onDay={setEditingDay} addStaff={<AddStaff onAdd={addStaff} limited={atStaffLimit(plan, staff.length)} />}
            onOpenDay={(d) => { setSelDay(d); setDeskView("day"); }} overtimeOn={overtimeOn} />
        </>
      )}

      {moreOpen && (
        <Modal title={fmtWeek(weekStart)} onClose={() => setMoreOpen(false)}>
          {shifts.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              <Stat value={totalHours.toFixed(1)} label="paid hours" />
              <Stat value={String(filled)} label={filled === 1 ? "shift" : "shifts"} />
              {unfilled.length > 0 && <Stat value={String(unfilled.length)} label="unfilled" tone="danger" />}
              {pay && wages > 0 && <Stat value={`≈ ${fmtAUD(wages)}`} label="base wages" />}
            </div>
          )}
          {pay && wages > 0 && (
            <p style={{ fontSize: 13, color: C.muted, margin: "0 0 14px", lineHeight: 1.5 }}>Base wages are paid hours × each person&apos;s hourly rate. No penalty rates, overtime, allowances or super.{missingRate > 0 && ` Excludes ${missingRate} without a rate.`}</p>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {staff.length > 0 && !isPast && <SheetAction icon={<Copy size={19} />} label="Copy last week" hint="Adds last week's shifts. Nothing is doubled up." onClick={() => { setMoreOpen(false); copyLastWeek(); }} />}
            {published && <SheetAction icon={linkCopied ? <Check size={19} /> : <Link2 size={19} />} label={linkCopied ? "Team link copied" : "Copy team link"} hint="Paste it in your staff group chat." onClick={copyTeamLink} />}
            {shifts.length > 0 && <SheetAction icon={<FileText size={19} />} label="Download PDF" hint="A4 roster to print or send." onClick={downloadPdf} />}
            {shifts.length > 0 && <SheetAction icon={<Download size={19} />} label="Hours for payroll (CSV)" hint="One row per shift, plus totals by person." onClick={downloadCSV} />}
            {published && <SheetAction icon={<Undo2 size={19} />} label="Unpublish" hint="Your team stops seeing this week." onClick={() => { setMoreOpen(false); unpublish(); }} />}
          </div>
        </Modal>
      )}

      {editingDay && (
        <DayNoteEditor date={editingDay} holiday={dayInfo(editingDay).holiday} note={dayInfo(editingDay).note ?? ""}
          onClose={() => setEditingDay(null)} onSave={(n) => saveDayNote(editingDay, n)} />
      )}

      {draft && (
        <ShiftEditor draft={draft} staff={staff} roles={business.roles} offOn={offOn} weekDays={days} shifts={shifts} overtimeOn={overtimeOn}
          onClose={() => setDraft(null)} onSave={saveShift} onDelete={deleteShift} />
      )}

      {justPublished && (
        <Modal title="Roster published" onClose={() => setJustPublished(false)}>
          <div style={{ textAlign: "center", padding: "6px 0 14px" }}>
            <span className="publish-badge" style={{ display: "inline-grid", placeItems: "center", width: 76, height: 76, borderRadius: "50%", background: C.accent, boxShadow: "0 8px 22px rgba(101,163,13,0.35)" }}>
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={C.dark} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <p style={{ fontSize: 17, fontWeight: 750, color: C.dark, margin: "14px 0 4px" }}>Your team can see {fmtWeek(weekStart)} now.</p>
            <p style={{ fontSize: 15, color: C.secondary, lineHeight: 1.5, margin: 0 }}>Paste the team link in your group chat, or send the PDF. The link stays the same every week.</p>
          </div>
          {unfilled.length > 0 && (
            <p style={{ fontSize: 14, color: UNFILLED.text, background: UNFILLED.bg, borderRadius: 12, padding: "10px 12px", margin: "0 0 12px" }}>
              {unfilled.length === 1 ? "1 shift still has" : `${unfilled.length} shifts still have`} no one on it. Staff can&apos;t see unfilled shifts, so fill them when you can.
            </p>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            <button onClick={copyTeamLink} className="app-press" style={{ ...btn("primary"), minHeight: 48 }}>{linkCopied ? <><Check size={18} /> Copied. Paste it in your group chat</> : <><Link2 size={18} /> Copy team link</>}</button>
            <button onClick={downloadPdf} className="app-press" style={{ ...btn(), minHeight: 48 }}><FileText size={18} /> Download PDF</button>
            <button onClick={() => setJustPublished(false)} className="app-press" style={btn("ghost")}>Done</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}

function SheetAction({ icon, label, hint, onClick }: { icon: React.ReactNode; label: string; hint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="app-press" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "12px 14px", borderRadius: 14, border: "none", background: "#f3f4f6", cursor: "pointer", fontFamily: "inherit", color: C.dark }}>
      <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, borderRadius: 12, background: C.white, flex: "none" }}>{icon}</span>
      <span><span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{label}</span><span style={{ display: "block", fontSize: 13, color: C.muted }}>{hint}</span></span>
    </button>
  );
}

function ViewToggle<T extends string>({ value, onChange, options, label = "View" }: {
  value: T; onChange: (v: T) => void; options: [T, string, React.ReactNode][]; label?: string;
}) {
  return (
    <div role="group" aria-label={label} style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2, flex: "none" }}>
      {options.map(([v, text, icon]) => {
        const on = v === value;
        return (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={on} className="app-press" style={{
            display: "inline-flex", alignItems: "center", gap: 6, border: "none", borderRadius: 999, padding: text ? "7px 14px" : "7px 10px", minHeight: 36,
            fontSize: 14, fontWeight: 650, fontFamily: "inherit", cursor: "pointer",
            background: on ? C.dark : "transparent", color: on ? C.white : C.secondary, transition: "background-color 180ms ease, color 180ms ease",
          }} aria-label={text ? undefined : String(v)} title={text ? undefined : String(v)}>
            {icon}{text}
          </button>
        );
      })}
    </div>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: "danger" }) {
  const danger = tone === "danger";
  return (
    <span style={{ ...card, display: "inline-flex", alignItems: "baseline", gap: 5, padding: "8px 12px", fontSize: 14, color: danger ? UNFILLED.text : C.secondary, background: danger ? UNFILLED.bg : C.white, boxShadow: danger ? "none" : C.shadow }}>
      <strong style={{ fontSize: 17, fontWeight: 800, color: danger ? UNFILLED.text : C.dark }}>{value}</strong>{label}
    </span>
  );
}

function AddStaff({ onAdd, limited }: { onAdd: (name: string) => Promise<boolean>; limited?: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  if (limited) {
    return (
      <div style={{ padding: "14px 16px", fontSize: 14, color: C.secondary, lineHeight: 1.5 }}>
        The Free plan is for up to {FREE_STAFF_LIMIT} staff. <Link href="/settings/#plan" style={{ color: C.dark, fontWeight: 700 }}>Upgrade to Core</Link> for unlimited staff.
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="app-press" style={{ background: "none", border: "none", padding: "14px 16px", fontSize: 15, fontWeight: 650, color: C.secondary, cursor: "pointer", fontFamily: "inherit", width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ display: "inline-grid", placeItems: "center", width: 34, height: 34, borderRadius: "50%", border: `1.5px dashed ${C.faint}` }}><UserPlus size={17} /></span>
        Add someone to the team
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
      if (ok) { haptic(10); setName(""); setOpen(false); }
    }} style={{ display: "flex", gap: 8, padding: 10, alignItems: "center", flexWrap: "wrap" }}>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Sam Nguyen" aria-label="New team member name"
        style={{ ...input, flex: "1 1 200px", maxWidth: 320 }} />
      <button type="submit" disabled={saving || !name.trim()} className="app-press" style={{ ...btn("primary"), opacity: name.trim() ? 1 : 0.5 }}>{saving ? "Adding…" : "Add"}</button>
      <button type="button" onClick={() => { setOpen(false); setName(""); }} className="app-press" style={btn("ghost")}>Cancel</button>
      <span style={{ fontSize: 13, color: C.muted, flexBasis: "100%" }}>Add their mobile and role later on the Team page.</span>
    </form>
  );
}

function Banner({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div role="status" style={{ ...card, display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", fontSize: 14, lineHeight: 1.5, color: C.secondary, marginBottom: 12 }}>
      <span style={{ color: C.shiftText, display: "grid", marginTop: 1 }}><Info size={18} /></span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss" style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, display: "grid", padding: 2 }}><X size={18} /></button>}
    </div>
  );
}

type OffOn = (staffId: string, date: string) => TimeOff | undefined;
type DayInfo = (d: string) => { holiday: string | null; note: string | null };

const HOLIDAY = { bg: "#fdf2f8", text: "#9d174d" };

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

/* ── Phone: week strip + one day at a time ─────────────────────────────── */

function WeekStrip({ days, day, today, shifts, dayInfo, onPick }: {
  days: string[]; day: string; today: string; shifts: Shift[]; dayInfo: DayInfo; onPick: (d: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Days" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, ...card, padding: 6, marginBottom: 14 }}>
      {days.map((d) => {
        const on = d === day;
        const n = shifts.filter((s) => s.date === d).length;
        const gaps = shifts.some((s) => s.date === d && !s.staff_id);
        const hol = !!dayInfo(d).holiday;
        return (
          <button key={d} role="tab" aria-selected={on} onClick={() => onPick(d)} className="app-press" style={{
            border: "none", cursor: "pointer", borderRadius: 12, padding: "8px 0 7px", fontFamily: "inherit",
            background: on ? C.dark : hol ? HOLIDAY.bg : "transparent", color: on ? C.white : C.dark,
            transition: "background-color 220ms ease, color 220ms ease",
          }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: on ? "#d1d5db" : d === today ? C.shiftText : C.muted }}>{dayName(d)}</span>
            <span style={{ display: "block", fontSize: 18, fontWeight: 800, lineHeight: 1.3 }}>{Number(d.slice(8))}</span>
            <span aria-hidden style={{ display: "block", height: 6, margin: "3px auto 0", width: n ? Math.min(6 + n * 4, 22) : 6, borderRadius: 6,
              background: gaps ? "#ef4444" : n ? (on ? C.accent : "#84cc16") : on ? "#374151" : "#e5e7eb", transition: "width 240ms ease" }} />
          </button>
        );
      })}
    </div>
  );
}

function DayView({ d, slide, staff, shifts, roles, offOn, info, onEdit, onDay, onSwipe, cascadeIds, empty, atStart, atEnd, mode = "list", onMode, compact, isToday, readOnly, onNew }: {
  d: string; slide: "left" | "right"; staff: Staff[]; shifts: Shift[]; roles: string[]; offOn: OffOn;
  info: { holiday: string | null; note: string | null }; onEdit: (s: Shift) => void; onDay: () => void; onSwipe: (n: number) => void;
  cascadeIds: Set<string>; empty: React.ReactNode; atStart: boolean; atEnd: boolean;
  mode?: "list" | "timeline"; onMode?: (m: "list" | "timeline") => void; compact?: boolean; isToday: boolean; readOnly: boolean;
  onNew: (staffId: string, start?: string, end?: string) => void;
}) {
  // The day follows your thumb; let go past the threshold to move a day, otherwise it settles back.
  const start = useRef<{ x: number; y: number; lock: "x" | "y" | null } | null>(null);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dayShifts = shifts.filter((s) => s.date === d)
    .sort((a, b) => Number(!!a.staff_id) - Number(!!b.staff_id) || a.start_time.localeCompare(b.start_time));
  const offs = staff.map((p) => ({ p, t: offOn(p.id, d) })).filter((x) => x.t);
  return (
    <section aria-label={fmtDay(d)}
      onTouchStart={(e) => { start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, lock: null }; }}
      onTouchMove={(e) => {
        const st = start.current;
        if (!st) return;
        const mx = e.touches[0].clientX - st.x;
        const my = e.touches[0].clientY - st.y;
        if (!st.lock && (Math.abs(mx) > 10 || Math.abs(my) > 10)) st.lock = Math.abs(mx) > Math.abs(my) ? "x" : "y";
        if (st.lock !== "x") return;
        const edge = (mx > 0 && atStart) || (mx < 0 && atEnd);
        setDragging(true);
        setDx(edge ? mx * 0.35 : mx);
      }}
      onTouchEnd={() => {
        const st = start.current;
        start.current = null;
        setDragging(false);
        if (st?.lock === "x" && Math.abs(dx) > 70) { haptic(6); onSwipe(dx < 0 ? 1 : -1); return; }
        setDx(0);
      }}
      style={{ touchAction: "pan-y" }}>
      <div className={slide === "right" ? "day-in-right" : "day-in-left"} style={{
        display: "grid", gap: 10, alignContent: "start",
        transform: dx ? `translateX(${dx}px)` : undefined, opacity: dx ? Math.max(0.55, 1 - Math.abs(dx) / 500) : undefined,
        transition: dragging ? "none" : "transform 320ms cubic-bezier(.16,1,.3,1), opacity 320ms cubic-bezier(.16,1,.3,1)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>{fmtDay(d)}</h2>
            <div style={{ fontSize: 14, color: C.secondary }}><CoverageText c={coverage(shifts, d)} /></div>
          </div>
          {onMode && <ViewToggle label="Show the day as" value={mode} onChange={onMode} options={[["list", "", <List size={18} key="l" />], ["timeline", "", <CalendarDays size={18} key="t" />]]} />}
          <button onClick={onDay} className="app-press" style={{ ...btn("ghost"), padding: "8px 10px", minHeight: 38, color: C.dark }} aria-label={info.note ? "Edit day note" : "Add a day note"}>
            <StickyNote size={17} />{!onMode && <> {info.note ? "Edit note" : "Day note"}</>}
          </button>
        </div>
        {(info.holiday || info.note) && (
          <div style={{ ...card, boxShadow: "none", background: info.holiday ? HOLIDAY.bg : "#f3f4f6", padding: "10px 14px", fontSize: 14, lineHeight: 1.45 }}>
            {info.holiday && <div style={{ fontWeight: 700, color: HOLIDAY.text }}>Public holiday · {info.holiday}</div>}
            {info.note && <div style={{ color: C.secondary }}>{info.note}</div>}
          </div>
        )}
        {dayShifts.length === 0 && offs.length === 0 && (
          <div style={{ ...card, padding: "26px 18px", textAlign: "center", color: C.muted, fontSize: 15 }}>
            <span style={{ display: "inline-grid", placeItems: "center", width: 44, height: 44, borderRadius: 14, background: "#f3f4f6", marginBottom: 8, color: C.secondary }}><CalendarPlus size={22} /></span>
            {empty}
          </div>
        )}
        {mode === "timeline" && (dayShifts.length > 0 || offs.length > 0 || !compact) && (
          <DayTimeline dayShifts={dayShifts} staff={staff} roles={roles} offs={offs.map(({ p, t }) => ({ p, t: t! }))}
            isToday={isToday} compact={compact} readOnly={readOnly} onEdit={onEdit} onNew={onNew} />
        )}
        {mode === "list" && dayShifts.map((s) => <ShiftCard key={s.id} s={s} staff={staff} roles={roles} onEdit={onEdit} fresh={cascadeIds.has(s.id)} />)}
        {mode === "list" && offs.map(({ p, t }) => (
          <div key={p.id} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: C.offBg, boxShadow: "none" }}>
            <Avatar name={p.name} tone={{ bg: "#ffedd5", text: C.offText }} />
            <span style={{ flex: 1, fontSize: 15, fontWeight: 650 }}>{p.name}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.offText }}>Off{t!.reason ? ` · ${t!.reason}` : ""}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ShiftCard({ s, staff, roles, onEdit, fresh }: { s: Shift; staff: Staff[]; roles: string[]; onEdit: (s: Shift) => void; fresh?: boolean }) {
  const open = !s.staff_id;
  const sw = open ? UNFILLED : roleSwatch(s.role, roles);
  const name = open ? "Unfilled" : staff.find((p) => p.id === s.staff_id)?.name ?? "";
  const hrs = shiftHours(s.start_time, s.end_time, s.break_minutes);
  return (
    <button onClick={() => onEdit(s)} className={`app-press app-lift${fresh ? " cascade-in" : ""}`} style={{
      ...card, display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", textAlign: "left", cursor: "pointer",
      fontFamily: "inherit", border: open ? `1.5px dashed ${UNFILLED.border}` : "1px solid transparent", background: open ? UNFILLED.bg : C.white,
    }}>
      {open
        ? <span aria-hidden style={{ width: 40, height: 40, borderRadius: "50%", border: `1.5px dashed ${UNFILLED.border}`, display: "grid", placeItems: "center", color: UNFILLED.text, fontWeight: 800 }}>?</span>
        : <Avatar name={name} size={40} tone={{ bg: sw.bg, text: sw.text }} />}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: open ? UNFILLED.text : C.dark }}>{name}</span>
        <span style={{ display: "block", fontSize: 14, color: C.secondary }}>
          {fmtTime(s.start_time)} – {fmtTime(s.end_time)} · {hrs.toFixed(hrs % 1 ? 1 : 0)}h{s.break_minutes ? ` (${s.break_minutes}m break)` : ""}
        </span>
        {s.notes && <span style={{ display: "block", fontSize: 13, color: C.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.notes}</span>}
      </span>
      {s.role && <span style={{ fontSize: 13, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: sw.bg, color: sw.text, whiteSpace: "nowrap" }}>{s.role}</span>}
    </button>
  );
}

/* ── Desktop: the week grid ─────────────────────────────────────────────── */

function Chip({ s, roles, onClick, cascade, cascadeDelay = 0 }: {
  s: Shift; roles: string[]; onClick: () => void; cascade?: boolean; cascadeDelay?: number;
}) {
  const open = !s.staff_id;
  const sw = open ? UNFILLED : roleSwatch(s.role, roles);
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} className={`app-press${cascade ? " cascade-in" : ""}`} title={s.notes ?? undefined} style={{
      display: "block", width: "100%", textAlign: "left", background: sw.bg, border: open ? `1.5px dashed ${sw.border}` : "1px solid transparent",
      color: sw.text, borderRadius: 10, padding: "6px 8px", fontSize: 13, fontWeight: 750, cursor: "pointer", lineHeight: 1.3, fontFamily: "inherit",
      ...(cascade ? { animationDelay: `${cascadeDelay}ms` } : {}),
    }}>
      {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
      {(s.role || open) && <span style={{ display: "block", fontWeight: 550, opacity: 0.9 }}>{open ? `Unfilled${s.role ? ` · ${s.role}` : ""}` : s.role}</span>}
      {s.notes && <span style={{ display: "block", fontWeight: 450, opacity: 0.85, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.notes}</span>}
    </button>
  );
}

function Grid({ days, today, staff, shifts, hours, offOn, onAdd, onEdit, cascadeIds, roles, dayInfo, onDay, addStaff, onOpenDay, overtimeOn }: {
  days: string[]; today: string; staff: Staff[]; shifts: Shift[]; hours: Map<string, number>; offOn: OffOn; overtimeOn: boolean;
  onAdd: (staffId: string, date: string) => void; onEdit: (s: Shift) => void; cascadeIds: Set<string>;
  roles: string[]; dayInfo: DayInfo; onDay: (d: string) => void; addStaff: React.ReactNode; onOpenDay: (d: string) => void;
}) {
  // One shared time scale for the week's cover bars, so days line up.
  const covers = days.map((d) => dayCover(shifts.filter((s) => s.date === d)));
  const withShifts = covers.filter((c, i) => shifts.some((s) => s.date === days[i]));
  const wLo = withShifts.length ? Math.min(...withShifts.map((c) => c.lo)) : 0;
  const wHi = withShifts.length ? Math.max(...withShifts.map((c) => c.hi)) : 1;
  const cols = "190px repeat(7, minmax(104px, 1fr)) 64px";
  const hasUnfilled = shifts.some((s) => !s.staff_id);
  let cascadeIdx = 0;
  const row = (key: string, name: React.ReactNode, staffId: string, total: React.ReactNode, tint?: string) => (
    <div key={key} style={{ display: "grid", gridTemplateColumns: cols, borderTop: `1px solid ${C.divider}`, minWidth: 960, background: tint }}>
      <div style={{ padding: "10px 14px", fontSize: 15, fontWeight: 650, color: C.dark, display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>{name}</div>
      {days.map((d) => {
        const mine = shifts.filter((s) => (s.staff_id ?? "") === staffId && s.date === d);
        const off = staffId ? offOn(staffId, d) : undefined;
        return (
          <div key={d} className="grid-cell" role="button" tabIndex={0} aria-label={`Add shift ${fmtDay(d)}`}
            onClick={() => onAdd(staffId, d)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAdd(staffId, d); } }} title="Add shift"
            style={{ padding: 5, minHeight: 60, cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, justifyContent: "center", minWidth: 0, background: d === today ? "rgba(183,224,33,0.06)" : undefined }}>
            {off && <div style={{ background: C.offBg, color: C.offText, borderRadius: 10, padding: "6px 8px", fontSize: 13, fontWeight: 700 }}>Off{off.reason ? ` · ${off.reason}` : ""}</div>}
            {mine.map((s) => { const isCascade = cascadeIds.has(s.id); const delay = isCascade ? cascadeIdx++ * 40 : 0; return <Chip key={s.id} s={s} roles={roles} onClick={() => onEdit(s)} cascade={isCascade} cascadeDelay={delay} />; })}
            {!off && mine.length === 0 && <span className="grid-plus" aria-hidden><Plus size={18} /></span>}
          </div>
        );
      })}
      <div style={{ padding: "10px 6px", fontSize: 15, fontWeight: 750, color: C.dark, textAlign: "center", alignSelf: "center" }}>{total}</div>
    </div>
  );

  return (
    <div style={{ ...card, overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: cols, minWidth: 960 }}>
        <div style={{ padding: "12px 14px", fontSize: 13, fontWeight: 650, color: C.muted, alignSelf: "end" }}>Staff</div>
        {days.map((d) => {
          const info = dayInfo(d);
          const isToday = d === today;
          return (
            <button key={d} onClick={() => onDay(d)} title={info.note ? "Edit day note" : "Add a note for this day"} className="app-press"
              style={{ padding: "10px 6px 8px", textAlign: "center", border: "none", background: info.holiday ? HOLIDAY.bg : "transparent", cursor: "pointer", fontFamily: "inherit", minWidth: 0, borderRadius: 12, margin: 4 }}>
              <span style={{ display: "block", fontSize: 12, fontWeight: 650, color: isToday ? C.shiftText : C.muted }}>{dayName(d)}</span>
              <span style={{ display: "inline-grid", placeItems: "center", minWidth: 32, height: 32, borderRadius: 999, fontSize: 17, fontWeight: 800, color: isToday ? C.dark : C.dark, background: isToday ? C.accent : "transparent" }}>{Number(d.slice(8))}</span>
              {info.holiday && <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: HOLIDAY.text, marginTop: 2 }}>{info.holiday}</span>}
              {info.note && <span style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }} title={info.note}>{info.note}</span>}
            </button>
          );
        })}
        <div style={{ padding: "12px 6px", fontSize: 13, fontWeight: 650, color: C.muted, textAlign: "center", alignSelf: "end" }}>Hrs</div>
      </div>
      {row("unfilled", <span title="Shifts you need covered but haven't given to anyone yet. Staff don't see them." style={{ color: UNFILLED.text, display: "flex", alignItems: "center", gap: 10 }}><span aria-hidden style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px dashed ${UNFILLED.border}`, display: "grid", placeItems: "center", fontWeight: 800, flex: "none" }}>?</span><span style={{ lineHeight: 1.2 }}>Unfilled<span style={{ display: "block", fontSize: 12, fontWeight: 500, color: C.muted }}>Need covering</span></span></span>, "", "", hasUnfilled ? UNFILLED.bg : undefined)}
      {staff.map((p) => {
        const h = hours.get(p.id) ?? 0;
        const over = overtimeOn && h > limitOf(p);
        const total = !h ? <span style={{ color: C.faint }}>—</span>
          : over ? <span title={`Above ${p.name.split(" ")[0]}'s usual ${fmtH(limitOf(p))}h a week`}>{h.toFixed(1)}<span style={{ display: "block", fontSize: 11, fontWeight: 600, color: C.muted }}>+{fmtH(h - limitOf(p))}</span></span>
          : h.toFixed(1);
        return row(p.id, <><Avatar name={p.name} size={32} tone={p.default_role ? (() => { const sw = roleSwatch(p.default_role, roles); return { bg: sw.bg, text: sw.text }; })() : undefined} /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span></>, p.id, total);
      })}
      <div style={{ borderTop: `1px solid ${C.divider}`, minWidth: 960 }}>{addStaff}</div>
      <div style={{ display: "grid", gridTemplateColumns: cols, minWidth: 960, background: "#fafbfc", borderTop: `1px solid ${C.divider}`, borderRadius: `0 0 ${C.r2}px ${C.r2}px` }}>
        <div style={{ padding: "10px 14px", fontSize: 13, fontWeight: 650, color: C.muted }}>Cover<span style={{ display: "block", fontSize: 12, fontWeight: 500 }}>Red = nobody on</span></div>
        {days.map((d, i) => {
          const cv = covers[i];
          const has = shifts.some((s) => s.date === d);
          const at = (m: number) => `${((m - wLo) / (wHi - wLo)) * 100}%`;
          return (
            <button key={d} onClick={() => onOpenDay(d)} disabled={!has} className="app-press" title={has ? "See this day by time" : undefined}
              aria-label={has ? `${fmtDay(d)}: ${cv.gaps.length ? `${cv.gaps.length} ${cv.gaps.length === 1 ? "gap" : "gaps"} with nobody on` : "covered"}. Open day view` : undefined}
              style={{ padding: "10px 6px", fontSize: 13, color: C.secondary, textAlign: "center", border: "none", background: "transparent", fontFamily: "inherit", cursor: has ? "pointer" : "default", minWidth: 0 }}>
              <CoverageText c={coverage(shifts, d)} />
              {has && (
                <span aria-hidden style={{ display: "block", position: "relative", height: 8, margin: "7px 2px 0", borderRadius: 4, background: "#eef0f3", overflow: "hidden" }}>
                  <span style={{ position: "absolute", top: 0, bottom: 0, left: at(cv.first), width: `calc(${at(cv.last)} - ${at(cv.first)})`, background: "#9ca3af" }} />
                  {cv.gaps.map((g) => <span key={g.start} style={{ position: "absolute", top: 0, bottom: 0, left: at(g.start), width: `max(3px, calc(${at(g.end)} - ${at(g.start)}))`, background: UNFILLED.border }} />)}
                </span>
              )}
              {has && cv.gaps.length > 0 && <span style={{ display: "block", marginTop: 4, fontSize: 12, fontWeight: 700, color: UNFILLED.text }}>{cv.gaps.length === 1 ? "1 gap" : `${cv.gaps.length} gaps`}</span>}
            </button>
          );
        })}
        <div />
      </div>
    </div>
  );
}

/* ── Editors ────────────────────────────────────────────────────────────── */

function DayNoteEditor({ date, holiday, note, onClose, onSave }: {
  date: string; holiday: string | null; note: string; onClose: () => void; onSave: (n: string) => Promise<void>;
}) {
  const [text, setText] = useState(note);
  const [saving, setSaving] = useState(false);
  return (
    <Modal title={fmtDay(date)} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(text); setSaving(false); }} style={{ display: "grid", gap: 12 }}>
        {holiday && <p style={{ margin: 0, fontSize: 15, color: HOLIDAY.text, fontWeight: 650, background: HOLIDAY.bg, padding: "10px 12px", borderRadius: 12 }}>Public holiday: {holiday}</p>}
        <div>
          <label style={label} htmlFor="daynote">Note for this day (your team sees it once published)</label>
          <input id="daynote" style={input} maxLength={200} value={text} autoFocus onChange={(e) => setText(e.target.value)} placeholder="e.g. Function — 40 people from 6pm" />
        </div>
        <button type="submit" disabled={saving} className="app-press" style={{ ...btn("primary"), minHeight: 48 }}>{saving ? "Saving…" : "Save note"}</button>
        {note && <button type="button" onClick={() => onSave("")} className="app-press" style={btn("danger")}>Remove note</button>}
      </form>
    </Modal>
  );
}

function Pill({ on, onClick, children, tone }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: { bg: string; text: string } }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className="app-press" style={{
      border: `1.5px solid ${on ? C.dark : C.border}`, background: on ? (tone?.bg ?? C.dark) : C.white, color: on ? (tone ? tone.text : C.white) : C.dark,
      borderRadius: 999, padding: "8px 14px", fontSize: 14, fontWeight: 650, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 6,
    }}>{children}</button>
  );
}

function ShiftEditor({ draft, staff, roles, offOn, weekDays, shifts, overtimeOn, onClose, onSave, onDelete }: {
  draft: Draft; staff: Staff[]; roles: string[]; offOn: OffOn; weekDays: string[]; shifts: Shift[]; overtimeOn: boolean;
  onClose: () => void; onSave: (d: Draft, alsoOn: string[]) => Promise<void>; onDelete: (id: string) => Promise<void>;
}) {
  const [d, setD] = useState(draft);
  const [alsoOn, setAlsoOn] = useState<string[]>([]);
  const others = weekDays.filter((x) => x !== d.date);
  const weekdays = weekDays.slice(0, 5).filter((x) => x !== d.date);
  const toggleDay = (x: string) => { haptic(4); setAlsoOn((a) => (a.includes(x) ? a.filter((y) => y !== x) : [...a, x])); };
  // A day where this person already works the same hours would be a double-up.
  const sameShiftOn = (x: string) => shifts.some((s) => (s.staff_id ?? "") === d.staff_id && s.date === x && s.start_time.slice(0, 5) === d.start_time && s.end_time.slice(0, 5) === d.end_time);
  const [saving, setSaving] = useState(false);
  const hours = d.start_time && d.end_time && d.start_time !== d.end_time ? shiftHours(d.start_time, d.end_time, d.break_minutes) : 0;
  const overnight = d.end_time && d.start_time && d.end_time < d.start_time;
  const off = d.staff_id ? offOn(d.staff_id, d.date) : undefined;
  // What this person's week comes to if this is saved (on every chosen day).
  const person = staff.find((p) => p.id === d.staff_id);
  const days = 1 + alsoOn.filter((x) => !sameShiftOn(x)).length;
  const weekHours = person ? shifts.filter((s) => s.staff_id === person.id && s.id !== d.id)
    .reduce((h, s) => h + shiftHours(s.start_time, s.end_time, s.break_minutes), 0) + hours * days : 0;
  const overBy = overtimeOn && person ? weekHours - limitOf(person) : 0;

  return (
    <Modal title={`${d.id ? "Edit" : "Add"} shift · ${fmtDay(d.date)}`} onClose={onClose}>
      <form onSubmit={async (e) => { e.preventDefault(); setSaving(true); await onSave(d, alsoOn.filter((x) => !sameShiftOn(x))); setSaving(false); }} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16 }}>
        {/* minmax(0, 1fr): lets the sideways-scrolling "Who" row scroll instead of widening the sheet past the screen (5+ staff) */}
        <div style={{ minWidth: 0 }}>
          <span style={label}>Who</span>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 2px 6px", margin: "0 -2px" }}>
            {staff.map((p) => {
              const on = d.staff_id === p.id;
              return (
                <button key={p.id} type="button" onClick={() => { haptic(4); setD({ ...d, staff_id: p.id, role: d.role || p.default_role || "" }); }} aria-pressed={on} className="app-press" style={{
                  flex: "none", width: 72, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, textAlign: "center",
                }}>
                  <span style={{ display: "inline-grid", borderRadius: "50%", padding: 3, boxShadow: on ? `0 0 0 2.5px ${C.dark}` : "none", transition: "box-shadow 160ms ease" }}>
                    <Avatar name={p.name} size={46} tone={on ? { bg: C.accent, text: C.dark } : undefined} />
                  </span>
                  <span style={{ display: "block", fontSize: 13, fontWeight: on ? 750 : 550, color: C.dark, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name.split(" ")[0]}</span>
                </button>
              );
            })}
            <button type="button" onClick={() => setD({ ...d, staff_id: "" })} aria-pressed={d.staff_id === ""} className="app-press" style={{ flex: "none", width: 72, border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, textAlign: "center" }}>
              <span style={{ display: "inline-grid", borderRadius: "50%", padding: 3, boxShadow: d.staff_id === "" ? `0 0 0 2.5px ${UNFILLED.border}` : "none" }}>
                <span style={{ width: 46, height: 46, borderRadius: "50%", border: `1.5px dashed ${UNFILLED.border}`, display: "grid", placeItems: "center", color: UNFILLED.text, fontWeight: 800 }}>?</span>
              </span>
              <span style={{ display: "block", fontSize: 13, fontWeight: 550, color: UNFILLED.text, marginTop: 4 }}>No one yet</span>
            </button>
          </div>
          {off && <p style={{ margin: "4px 0 0", fontSize: 14, color: C.offText }}>Heads up: they have approved time off this day.</p>}
          {overBy > 0 && person && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: C.muted }}>
              Brings {person.name.split(" ")[0]} to {fmtH(weekHours)}h this week (usually {fmtH(limitOf(person))}h).
            </p>
          )}
          {d.staff_id === "" && <p style={{ margin: "6px 0 0", fontSize: 14, color: UNFILLED.text, background: UNFILLED.bg, borderRadius: 12, padding: "8px 12px", lineHeight: 1.45 }}>Saved as an unfilled shift: a gap you still need to cover. It shows in red on your roster until you give it to someone. Staff can&apos;t see it.</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 10 }}>
          <div><label style={label} htmlFor="s-start">Start</label><input id="s-start" style={input} type="time" step={900} required value={d.start_time} onChange={(e) => setD({ ...d, start_time: e.target.value })} /></div>
          <div><label style={label} htmlFor="s-end">Finish</label><input id="s-end" style={input} type="time" step={900} required value={d.end_time} onChange={(e) => setD({ ...d, end_time: e.target.value })} /></div>
        </div>
        <div>
          <span style={label}>Unpaid break</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[0, 15, 30, 45, 60].map((m) => <Pill key={m} on={d.break_minutes === m} onClick={() => setD({ ...d, break_minutes: m })}>{m === 0 ? "None" : `${m}m`}</Pill>)}
          </div>
        </div>
        {roles.length > 0 && (
          <div>
            <span style={label}>Role</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {roles.map((r) => { const sw = roleSwatch(r, roles); return <Pill key={r} on={d.role === r} tone={{ bg: sw.bg, text: sw.text }} onClick={() => setD({ ...d, role: d.role === r ? "" : r })}>{r}</Pill>; })}
            </div>
          </div>
        )}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
            <span style={{ ...label, marginBottom: 0 }}>{d.id ? "Copy to other days" : "Also add on"}</span>
            <button type="button" onClick={() => setAlsoOn(weekdays)} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 650, color: C.shiftText, cursor: "pointer", fontFamily: "inherit" }}>Weekdays</button>
            <button type="button" onClick={() => setAlsoOn(others)} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 650, color: C.shiftText, cursor: "pointer", fontFamily: "inherit" }}>Every day</button>
            {alsoOn.length > 0 && <button type="button" onClick={() => setAlsoOn([])} style={{ background: "none", border: "none", padding: 0, fontSize: 13, fontWeight: 650, color: C.muted, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}>Clear</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
            {weekDays.map((x) => {
              const self = x === d.date;
              const on = self || alsoOn.includes(x);
              const dup = !self && sameShiftOn(x);
              const away = !self && d.staff_id ? !!offOn(d.staff_id, x) : false;
              return (
                <button key={x} type="button" disabled={self || dup} onClick={() => toggleDay(x)} aria-pressed={on}
                  title={self ? "This shift" : dup ? "Already has this shift" : away ? "Approved time off this day" : undefined}
                  className="app-press" style={{
                    border: `1.5px solid ${on ? C.dark : away ? C.offBorder : C.border}`, borderRadius: 12, padding: "6px 0",
                    background: on ? C.dark : dup ? "#f3f4f6" : C.white, color: on ? C.white : dup ? C.faint : C.dark,
                    cursor: self || dup ? "default" : "pointer", fontFamily: "inherit", opacity: self ? 0.55 : 1,
                  }}>
                  <span style={{ display: "block", fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{dayName(x)}</span>
                  <span style={{ display: "block", fontSize: 16, fontWeight: 800 }}>{Number(x.slice(8))}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div><label style={label} htmlFor="s-note">Note (optional, staff see it)</label>
          <input id="s-note" style={input} maxLength={200} value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="e.g. Open up — keys in the safe" />
        </div>
        <button type="submit" disabled={saving || hours === 0} className="app-press" style={{ ...btn("primary"), minHeight: 50, fontSize: 16, opacity: saving || hours === 0 ? 0.55 : 1 }}>
          {saving ? "Saving…" : hours > 0
            ? (() => { const n = 1 + alsoOn.filter((x) => !sameShiftOn(x)).length; return n > 1 ? `Save on ${n} days · ${hours.toFixed(2).replace(/\.?0+$/, "")}h each` : `Save shift · ${hours.toFixed(2).replace(/\.?0+$/, "")}h${overnight ? " (past midnight)" : ""}`; })()
            : "Start and finish can't be the same"}
        </button>
        {d.id && <button type="button" onClick={() => onDelete(d.id!)} className="app-press" style={btn("danger")}>Delete shift</button>}
      </form>
    </Modal>
  );
}

export default function Page() {
  return <Suspense fallback={null}><WeekPage /></Suspense>;
}
