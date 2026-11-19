"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import { hasCore, hasPro, usePlan } from "@/lib/usePlan";
import type { Roster, Shift, Staff } from "@/lib/types";
import { addDays, fmtDay, fmtWeek, thisWeekStart, toISO, weekDates, weekStartOf } from "@/lib/dates";
import { changed, downloadHoursCsv, rosteredHours, workedHours } from "@/lib/worked";
import HoursRow, { type Patch } from "@/components/HoursRow";
import { AppShell, C, Loading, Modal, btn, card, haptic, input, label } from "@/components/ui";
import type { Database } from "@/lib/database.types";

type Change = Database["public"]["Tables"]["hours_changes"]["Row"];
const fmtT = (t: unknown) => (typeof t === "string" ? fmtTimeShort(t) : "");
function fmtTimeShort(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "am" : "pm"}`;
}

const fmtH = (h: number) => h.toFixed(2).replace(/\.?0+$/, "") || "0";

function HoursPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { business, email } = useManager();
  const plan = usePlan(business?.id);
  const startDay = business?.week_start_day ?? 1;
  const weekStart = weekStartOf(params.get("w") ?? toISO(new Date()), startDay);
  useEffect(() => { sessionStorage.setItem("smeasy_week", weekStart); }, [weekStart]);
  const days = useMemo(() => weekDates(weekStart), [weekStart]);

  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null); // one row open at a time
  const [xero, setXero] = useState<{ tenant_name: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ name: string; ok: boolean; note: string }[] | null>(null);
  // The last send's results: this session's, else the ones saved on the week (so they survive a reload).
  const results = sent ?? (roster?.xero_results as { name: string; ok: boolean; note: string }[] | null) ?? null;
  const [reopening, setReopening] = useState(false);
  const [reason, setReason] = useState("");
  const [history, setHistory] = useState<Change[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    (async () => {
      const sb = supabase();
      const [st, ro] = await Promise.all([
        sb.from("staff").select("*").order("name"), // removed staff too, so past weeks keep their names
        sb.from("rosters").select("*").eq("week_start", weekStart).maybeSingle(),
      ]);
      const { data: xc } = await sb.from("xero_connections").select("tenant_name").maybeSingle();
      if (!cancelled) setXero(xc ?? null);
      const sh = ro.data ? (await sb.from("shifts").select("*").eq("roster_id", ro.data.id).not("staff_id", "is", null).order("start_time")).data ?? [] : [];
      const hc = ro.data ? (await sb.from("hours_changes").select("*").eq("roster_id", ro.data.id).order("changed_at")).data ?? [] : [];
      if (cancelled) return;
      setStaff(st.data ?? []); setRoster(ro.data ?? null); setShifts(sh); setHistory(hc);
    })();
    return () => { cancelled = true; };
  }, [business, weekStart]);

  const staffById = useMemo(() => new Map((staff ?? []).map((p) => [p.id, p])), [staff]);

  async function update(s: Shift, patch: Patch) {
    const next = { ...s, ...patch };
    setShifts((all) => all.map((x) => (x.id === s.id ? next : x)));
    const { error } = await supabase().from("shifts").update(patch).eq("id", s.id);
    if (error) {
      setShifts((all) => all.map((x) => (x.id === s.id ? s : x)));
      setNotice("Couldn't save that change. Please try again.");
    }
  }

  async function sendToXero() {
    if (!roster) return;
    setSending(true); setSent(null); setNotice(null);
    const { data, error } = await supabase().functions.invoke("xero", { body: { action: "send", roster_id: roster.id } });
    setSending(false);
    if (error || !data) {
      let msg = "Couldn't send to Xero. Please try again.";
      try { const b = await (error as { context?: Response })?.context?.json(); if (b?.error) msg = b.error; } catch { /* keep default */ }
      setNotice(msg); return;
    }
    setSent(data.results);
    if (data.results.some((r: { ok: boolean }) => r.ok)) { setRoster({ ...roster, xero_sent_at: new Date().toISOString() }); haptic([10, 40, 16]); }
  }

  // Approving freezes the week's worked times in the database; reload them, and the history.
  async function reload(rosterId: string) {
    const sb = supabase();
    const [{ data: sh }, { data: hc }] = await Promise.all([
      sb.from("shifts").select("*").eq("roster_id", rosterId).not("staff_id", "is", null).order("start_time"),
      sb.from("hours_changes").select("*").eq("roster_id", rosterId).order("changed_at"),
    ]);
    setShifts(sh ?? []); setHistory(hc ?? []);
  }

  async function approve() {
    if (!roster) return;
    setBusy(true);
    const { data } = await supabase().from("rosters").update({ hours_approved_at: new Date().toISOString() }).eq("id", roster.id).select().single();
    if (data) { setRoster(data); haptic([12, 60, 24]); await reload(data.id); }
    setBusy(false);
  }

  // Approved hours are records: changing them needs a reason, which is kept with every change.
  async function reopen() {
    if (!roster || !reason.trim()) return;
    setBusy(true);
    const { data, error } = await supabase().from("rosters").update({ hours_approved_at: null, reopen_reason: reason.trim() }).eq("id", roster.id).select().single();
    setBusy(false);
    if (error || !data) { setNotice("Couldn't reopen the week. Please try again."); return; }
    setRoster(data); setReopening(false); setReason(""); setSent(null);
    await reload(data.id);
  }

  if (!business || !staff || plan === null) return <AppShell><Loading /></AppShell>;

  const today = toISO(new Date());
  const approved = !!roster?.hours_approved_at;
  const goWeek = (n: number) => router.replace(`/hours?w=${addDays(weekStart, n * 7)}`);
  const roles = business.roles ?? [];

  // Totals by person, rostered vs worked.
  const people = [...new Set(shifts.map((s) => s.staff_id!))]
    .map((id) => ({ p: staffById.get(id), rostered: 0, worked: 0, id }))
    .map((t) => {
      for (const s of shifts.filter((x) => x.staff_id === t.id)) { t.rostered += rosteredHours(s); t.worked += workedHours(s); }
      return t;
    })
    .sort((a, b) => (a.p?.name ?? "").localeCompare(b.p?.name ?? ""));
  const totalRostered = people.reduce((h, t) => h + t.rostered, 0);
  const totalWorked = people.reduce((h, t) => h + t.worked, 0);
  const edits = shifts.filter(changed).length;
  // The last rostered day that hasn't happened yet: approval waits for it.
  const notYet = shifts.map((s) => s.date).filter((d) => d > today).sort().pop() ?? null;
  const shortDate = (iso: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(iso));

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Week header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <button onClick={() => goWeek(-1)} className="app-press" style={{ ...btn(), width: 42, padding: 0, borderRadius: 999, flex: "none" }} aria-label="Previous week"><ChevronLeft size={20} /></button>
          <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <h1 style={{ fontSize: "clamp(18px, 4.6vw, 22px)", fontWeight: 800, color: C.dark, margin: 0, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              {fmtWeek(weekStart)}
            </h1>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 3, display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
              {weekStart === thisWeekStart(startDay) ? "This week" : <Link href="/hours" style={{ color: C.secondary }}>Back to this week</Link>}
              {shifts.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: approved ? "#dcfce7" : "#eef0f3", color: approved ? "#166534" : C.secondary }}>
                  {approved ? "Approved" : "Not approved"}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => goWeek(1)} className="app-press" style={{ ...btn(), width: 42, padding: 0, borderRadius: 999, flex: "none" }} aria-label="Next week"><ChevronRight size={20} /></button>
        </div>

        {notice && <p role="status" style={{ ...card, padding: "10px 14px", fontSize: 14, color: C.danger, margin: "0 0 12px" }}>{notice}</p>}

        {!hasCore(plan) ? (
          <div style={{ ...card, padding: "28px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: C.dark, margin: "0 0 6px" }}>Timesheets are part of Plus</p>
            <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 16px", lineHeight: 1.5 }}>Confirm the hours people actually worked, then approve the timesheet for payroll.</p>
            <Link href="/plan/" className="app-press" style={{ ...btn("accent"), textDecoration: "none" }}>See plans</Link>
          </div>
        ) : shifts.length === 0 ? (
          <div style={{ ...card, padding: "32px 24px", textAlign: "center", color: C.secondary, fontSize: 15, lineHeight: 1.5 }}>
            No one is rostered this week. <Link href={`/week?w=${weekStart}`} style={{ color: C.dark, fontWeight: 700 }}>Open the roster</Link>
          </div>
        ) : (
          <>
            {approved && (
              <p style={{ ...card, padding: "10px 14px", fontSize: 14, color: C.secondary, margin: "0 0 14px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Check size={17} color="#166534" aria-hidden />
                <span style={{ flex: 1 }}>
                  Approved {shortDate(roster!.hours_approved_at!)}
                  {roster?.xero_sent_at && <> · Sent to {xero?.tenant_name ?? "Xero"} {shortDate(roster.xero_sent_at)}</>}
                </span>
                {!reopening && <button onClick={() => setReopening(true)} disabled={busy} className="app-press" style={{ ...btn("ghost"), minHeight: 34, padding: "6px 10px", color: C.dark }}>Edit timesheets</button>}
              </p>
            )}
            {approved && reopening && (
              <form onSubmit={(e) => { e.preventDefault(); reopen(); }} style={{ ...card, padding: "14px 16px", margin: "-6px 0 14px", display: "grid", gap: 10 }}>
                <label style={{ ...label, marginBottom: 0 }} htmlFor="reopen-reason">What needs correcting?</label>
                <input id="reopen-reason" autoFocus value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Sam stayed until 5:30 on Wednesday" style={input} />
                <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>Approved timesheets are your time records, so SMEasy keeps a note of every change and why.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" disabled={busy || !reason.trim()} className="app-press" style={{ ...btn("primary"), opacity: reason.trim() ? 1 : 0.5 }}>Edit timesheets</button>
                  <button type="button" onClick={() => { setReopening(false); setReason(""); }} className="app-press" style={btn("ghost")}>Cancel</button>
                </div>
              </form>
            )}

            {days.map((d) => {
              const dayShifts = shifts.filter((s) => s.date === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
              if (!dayShifts.length) return null;
              const future = d > today;
              return (
                <section key={d} style={{ marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: "0 0 8px", display: "flex", gap: 8, alignItems: "baseline" }}>
                    {fmtDay(d)}{future && <span style={{ fontSize: 13, fontWeight: 500, color: C.muted }}>Not yet worked</span>}
                  </h2>
                  <div className="hrs-list" style={{ ...card, overflow: "hidden" }}>
                    {dayShifts.map((s, i) => (
                      <HoursRow key={s.id} s={s} first={i === 0} person={staffById.get(s.staff_id!)} roles={roles}
                        locked={approved || future} open={openRow === s.id} onToggle={() => setOpenRow((o) => (o === s.id ? null : s.id))}
                        onChange={(patch) => update(s, patch)} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Totals + approve */}
            <section style={{ ...card, padding: "16px 18px", marginTop: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: "0 0 10px" }}>This week</h2>
              <div role="table" style={{ display: "grid", gap: 0, fontSize: 14 }}>
                <div role="row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 80px 80px", color: C.muted, fontWeight: 700, fontSize: 13, paddingBottom: 6 }}>
                  <span role="columnheader">Person</span><span role="columnheader" style={{ textAlign: "right" }}>Rostered</span><span role="columnheader" style={{ textAlign: "right" }}>Worked</span>
                </div>
                {people.map((t) => (
                  <div role="row" key={t.id} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 80px 80px", padding: "7px 0", borderTop: `1px solid ${C.divider}`, color: C.dark }}>
                    <span role="cell" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.p?.name ?? "Removed staff member"}</span>
                    <span role="cell" style={{ textAlign: "right", color: C.secondary }}>{fmtH(t.rostered)}h</span>
                    <span role="cell" style={{ textAlign: "right", fontWeight: 700 }}>{fmtH(t.worked)}h</span>
                  </div>
                ))}
                <div role="row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 80px 80px", padding: "9px 0 0", borderTop: `1px solid ${C.border}`, fontWeight: 800, color: C.dark }}>
                  <span role="cell">Total</span>
                  <span role="cell" style={{ textAlign: "right", color: C.secondary, fontWeight: 700 }}>{fmtH(totalRostered)}h</span>
                  <span role="cell" style={{ textAlign: "right" }}>{fmtH(totalWorked)}h</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: "10px 0 14px" }}>
                {edits === 0 ? "Everything as rostered so far." : `${edits} ${edits === 1 ? "shift" : "shifts"} changed from the roster.`} Paid hours, unpaid breaks taken out.
              </p>
              {results && approved && (
                <div role="status" style={{ background: "#f3f4f6", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
                  <strong style={{ color: C.dark }}>
                    {results.filter((r) => r.ok).length} sent to {xero?.tenant_name ?? "Xero"}{results.some((r) => !r.ok) ? `, ${results.filter((r) => !r.ok).length} need fixing` : ""}:
                  </strong>
                  {results.map((r) => (
                    <div key={r.name} style={{ color: r.ok ? C.secondary : C.danger }}>{r.ok ? "✓" : "✗"} {r.name}: {r.note}</div>
                  ))}
                  {results.some((r) => r.ok) && <div style={{ color: C.muted, marginTop: 4 }}>They&apos;re drafts in Xero Payroll: check them there and approve them in your pay run.</div>}
                </div>
              )}
              {!approved && notYet && (
                <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 12px" }}>You can approve once {fmtDay(notYet)} is done. Until then, adjust any days that have happened.</p>
              )}
              {!approved && !notYet && (
                <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 12px" }}>Approving locks these timesheets as your time record. Shifts in the week can&apos;t be deleted after that.</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!approved && (
                  <button onClick={approve} disabled={busy || !!notYet} className="app-press" style={{ ...btn("accent"), padding: "10px 20px", opacity: notYet ? 0.45 : 1 }}>
                    <Check size={18} /> {busy ? "Approving…" : "Approve timesheets"}
                  </button>
                )}
                {approved && !xero && hasPro(plan) && (
                  <Link href="/settings/#payroll" className="app-press" style={{ ...btn(), padding: "10px 20px", textDecoration: "none" }}>Connect Xero</Link>
                )}
                {approved && xero && hasPro(plan) && (
                  <button onClick={sendToXero} disabled={sending} className="app-press" style={roster?.xero_sent_at ? btn() : { ...btn("accent"), padding: "10px 20px" }}>
                    {sending ? "Sending to Xero…" : roster?.xero_sent_at ? "Send again" : "Send to Xero"}
                  </button>
                )}
                {/* With Xero connected the CSV is only a backup, so it steps back. */}
                <button onClick={() => downloadHoursCsv({ shifts, staff, weekStart })} className="app-press" style={xero && hasPro(plan) ? { ...btn("ghost"), color: C.secondary } : btn()}>
                  <Download size={17} /> {xero && hasPro(plan) ? "Download CSV" : "Timesheets for payroll (CSV)"}
                </button>
                <button onClick={() => setExporting(true)} className="app-press" style={{ ...btn("ghost"), color: C.secondary }}>Export dates…</button>
              </div>
            </section>

            {history.length > 0 && (
              <section style={{ marginTop: 14 }}>
                <button onClick={() => setShowHistory((v) => !v)} aria-expanded={showHistory} style={{ ...btn("ghost"), padding: "4px 0", minHeight: 30, color: C.secondary }}>
                  {showHistory ? "Hide" : "Show"} changes after approval ({history.length})
                </button>
                {showHistory && (
                  <div style={{ ...card, padding: "6px 16px", marginTop: 6 }}>
                    {history.map((h) => {
                      const b = (h.before ?? {}) as Record<string, unknown>, a2 = (h.after ?? {}) as Record<string, unknown>;
                      const what = h.kind === "reopened" ? `Reopened: ${h.reason ?? ""}`
                        : a2.no_show ? "Marked as didn't work"
                        : b.no_show ? "Marked as worked"
                        : [b.start !== a2.start && `start ${fmtT(b.start)} → ${fmtT(a2.start)}`, b.end !== a2.end && `finish ${fmtT(b.end)} → ${fmtT(a2.end)}`,
                           b.break !== a2.break && `break ${b.break ?? 0}m → ${a2.break ?? 0}m`].filter(Boolean).join(", ");
                      return (
                        <div key={h.id} style={{ fontSize: 14, color: C.secondary, padding: "8px 0", borderTop: `1px solid ${C.divider}`, lineHeight: 1.45 }}>
                          <span style={{ color: C.muted }}>{shortDate(h.changed_at)}</span>
                          {h.person && <> · <strong style={{ color: C.dark, fontWeight: 700 }}>{h.person}</strong>{h.shift_date && `, ${fmtDay(h.shift_date)}`}</>}
                          {" · "}{what}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
        {exporting && <ExportRange staff={staff} onClose={() => setExporting(false)} />}
      </div>
    </AppShell>
  );
}

export default function Page() {
  return <Suspense fallback={null}><HoursPage /></Suspense>;
}

/** Export a date range of hours (e.g. a financial year) in one CSV, for keeping records. */
function ExportRange({ staff, onClose }: { staff: Staff[]; onClose: () => void }) {
  const today = toISO(new Date());
  const fyStart = `${Number(today.slice(0, 4)) - (Number(today.slice(5, 7)) < 7 ? 1 : 0)}-07-01`;
  const [from, setFrom] = useState(fyStart);
  const [to, setTo] = useState(today);
  const [approvedOnly, setApprovedOnly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { data } = await supabase().from("shifts").select("*, rosters!inner(hours_approved_at)")
      .gte("date", from).lte("date", to).not("staff_id", "is", null).order("date").limit(20000);
    const rows = ((data ?? []) as unknown as (Shift & { rosters: { hours_approved_at: string | null } | null })[])
      .filter((s) => !approvedOnly || s.rosters?.hours_approved_at)
      .map((s) => { const copy = { ...s } as Partial<typeof s>; delete copy.rosters; return copy as Shift; });
    setBusy(false);
    if (!rows.length) { setMsg("No hours in those dates."); return; }
    downloadHoursCsv({ shifts: rows, staff, weekStart: from, fileName: `hours-${from}-to-${to}.csv` });
    onClose();
  }

  return (
    <Modal title="Export timesheets" onClose={onClose}>
      <form onSubmit={run} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={label} htmlFor="ex-from">From</label><input id="ex-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} style={input} required /></div>
          <div><label style={label} htmlFor="ex-to">To</label><input id="ex-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} style={input} required /></div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: C.dark }}>
          <input type="checkbox" checked={approvedOnly} onChange={(e) => setApprovedOnly(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.dark }} />
          Approved weeks only
        </label>
        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>Time and wage records must be kept for 7 years. Keep a copy of each year&apos;s hours with your payroll records.</p>
        {msg && <p style={{ fontSize: 14, color: C.secondary, margin: 0 }}>{msg}</p>}
        <button type="submit" disabled={busy} className="app-press" style={{ ...btn("primary"), minHeight: 48 }}><Download size={17} /> {busy ? "Preparing…" : "Download CSV"}</button>
      </form>
    </Modal>
  );
}
