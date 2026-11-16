"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import { hasCore, usePlan } from "@/lib/usePlan";
import type { Roster, Shift, Staff } from "@/lib/types";
import { addDays, fmtDay, fmtWeek, thisWeekStart, toISO, weekDates, weekStartOf } from "@/lib/dates";
import { changed, downloadHoursCsv, rosteredHours, workedHours } from "@/lib/worked";
import HoursRow, { type Patch } from "@/components/HoursRow";
import { payDetailsOn } from "@/lib/pay";
import { AppShell, C, Loading, btn, card, haptic } from "@/components/ui";

const fmtH = (h: number) => h.toFixed(2).replace(/\.?0+$/, "") || "0";

function HoursPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { business, email } = useManager();
  const plan = usePlan(business?.id);
  const startDay = business?.week_start_day ?? 1;
  const weekStart = weekStartOf(params.get("w") ?? toISO(new Date()), startDay);
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
      if (cancelled) return;
      setStaff(st.data ?? []); setRoster(ro.data ?? null); setShifts(sh);
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

  async function setApproved(on: boolean) {
    if (!roster) return;
    setBusy(true);
    const { data } = await supabase().from("rosters").update({ hours_approved_at: on ? new Date().toISOString() : null }).eq("id", roster.id).select().single();
    if (data) { setRoster(data); if (on) haptic([12, 60, 24]); }
    setBusy(false);
  }

  if (!business || !staff || plan === null) return <AppShell><Loading /></AppShell>;

  const today = toISO(new Date());
  const approved = !!roster?.hours_approved_at;
  const goWeek = (n: number) => router.push(`/hours?w=${addDays(weekStart, n * 7)}`);
  const roles = business.roles ?? [];
  const pay = payDetailsOn(business);

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
            <p style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: "0 0 6px" }}>Timesheets are part of Core</p>
            <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 16px", lineHeight: 1.5 }}>Confirm the hours people actually worked and approve them for payroll.</p>
            <Link href="/settings/#plan" className="app-press" style={{ ...btn("accent"), textDecoration: "none" }}>See plans</Link>
          </div>
        ) : shifts.length === 0 ? (
          <div style={{ ...card, padding: "32px 24px", textAlign: "center", color: C.secondary, fontSize: 15, lineHeight: 1.5 }}>
            No one is rostered this week. <Link href={`/week?w=${weekStart}`} style={{ color: C.dark, fontWeight: 650 }}>Open the roster</Link>
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
                <button onClick={() => { setApproved(false); setSent(null); }} disabled={busy} className="app-press" style={{ ...btn("ghost"), minHeight: 34, padding: "6px 10px", color: C.dark }}>Edit hours</button>
              </p>
            )}

            {days.map((d) => {
              const dayShifts = shifts.filter((s) => s.date === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
              if (!dayShifts.length) return null;
              const future = d > today;
              return (
                <section key={d} style={{ marginBottom: 14 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 750, color: C.dark, margin: "0 0 8px", display: "flex", gap: 8, alignItems: "baseline" }}>
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
              <h2 style={{ fontSize: 16, fontWeight: 750, color: C.dark, margin: "0 0 10px" }}>This week</h2>
              <div role="table" style={{ display: "grid", gap: 0, fontSize: 14 }}>
                <div role="row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 80px 80px", color: C.muted, fontWeight: 650, fontSize: 13, paddingBottom: 6 }}>
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
                  <span role="cell" style={{ textAlign: "right", color: C.secondary, fontWeight: 650 }}>{fmtH(totalRostered)}h</span>
                  <span role="cell" style={{ textAlign: "right" }}>{fmtH(totalWorked)}h</span>
                </div>
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: "10px 0 14px" }}>
                {edits === 0 ? "Everything as rostered so far." : `${edits} ${edits === 1 ? "shift" : "shifts"} changed from the roster.`} Paid hours, unpaid breaks taken out.
              </p>
              {sent && (
                <div role="status" style={{ background: "#f3f4f6", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px", fontSize: 14, lineHeight: 1.55 }}>
                  <strong style={{ color: C.dark }}>Sent to {xero?.tenant_name ?? "Xero"}:</strong>
                  {sent.map((r) => (
                    <div key={r.name} style={{ color: r.ok ? C.secondary : C.danger }}>{r.ok ? "✓" : "✗"} {r.name}: {r.note}</div>
                  ))}
                  {sent.some((r) => r.ok) && <div style={{ color: C.muted, marginTop: 4 }}>They&apos;re drafts in Xero Payroll: check them there and approve them in your pay run.</div>}
                </div>
              )}
              {!approved && notYet && (
                <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 12px" }}>You can approve once {fmtDay(notYet)} is done. Until then, adjust any days that have happened.</p>
              )}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!approved && (
                  <button onClick={() => setApproved(true)} disabled={busy || !!notYet} className="app-press" style={{ ...btn("accent"), padding: "10px 20px", opacity: notYet ? 0.45 : 1 }}>
                    <Check size={18} /> {busy ? "Approving…" : "Approve hours"}
                  </button>
                )}
                {approved && xero && (
                  <button onClick={sendToXero} disabled={sending} className="app-press" style={roster?.xero_sent_at ? btn() : { ...btn("accent"), padding: "10px 20px" }}>
                    {sending ? "Sending to Xero…" : roster?.xero_sent_at ? "Send again" : "Send to Xero"}
                  </button>
                )}
                {/* With Xero connected the CSV is only a backup, so it steps back. */}
                <button onClick={() => downloadHoursCsv({ shifts, staff, pay, weekStart })} className="app-press" style={xero ? { ...btn("ghost"), color: C.secondary } : btn()}>
                  <Download size={17} /> {xero ? "Download CSV" : "Hours for payroll (CSV)"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export default function Page() {
  return <Suspense fallback={null}><HoursPage /></Suspense>;
}
