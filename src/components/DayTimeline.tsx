"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Shift, Staff, TimeOff } from "@/lib/types";
import { fmtTime } from "@/lib/dates";
import { roleSwatch, UNFILLED } from "@/lib/roleColors";
import { C, card } from "@/components/ui";

// A day like a calendar app: hours run down the page, every shift is a block,
// and shifts that overlap sit side by side. Gaps are any stretch between the
// first start and the last finish where nobody (filled) is on.

const STEP = 15; // minutes
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toTime = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const label = (m: number) => fmtTime(toTime(m));
const span = (s: Shift) => {
  const a = toMin(s.start_time);
  let b = toMin(s.end_time);
  if (b <= a) b = 24 * 60; // runs past midnight: show it to the end of the day
  return [a, b] as const;
};

export type Gap = { start: number; end: number; unfilled: Shift[] };

/** Visible hours and the gaps with nobody on. */
export function dayCover(dayShifts: Shift[]) {
  const all = dayShifts.map(span);
  if (!all.length) return { lo: 7 * 60, hi: 17 * 60, first: 0, last: 0, gaps: [] as Gap[] };
  const filled = dayShifts.filter((s) => s.staff_id).map(span);
  const open = dayShifts.filter((s) => !s.staff_id).map(span);
  const first = Math.min(...all.map((x) => x[0]));
  const last = Math.max(...all.map((x) => x[1]));
  const lo = Math.floor(first / 60) * 60;
  const hi = Math.ceil(last / 60) * 60;

  // Runs of nobody-on, split where an unfilled shift starts or stops covering them.
  const runs: { start: number; end: number; u: boolean }[] = [];
  for (let m = first; m < last; m += STEP) {
    const on = filled.some(([a, b]) => a < m + STEP && b > m);
    if (on) continue;
    const u = open.some(([a, b]) => a < m + STEP && b > m);
    const prev = runs[runs.length - 1];
    if (prev && prev.u === u && prev.end === m) prev.end = m + STEP;
    else runs.push({ start: m, end: m + STEP, u });
  }
  const gaps: Gap[] = runs.map(({ start, end }) => {
    const e = Math.min(end, last);
    return { start, end: e, unfilled: dayShifts.filter((s) => !s.staff_id && span(s)[0] < e && span(s)[1] > start) };
  });
  return { lo, hi, first, last, gaps };
}

/** Side-by-side lanes for overlapping shifts, Google Calendar style (per cluster). */
function layout(dayShifts: Shift[]) {
  const items = dayShifts.map((s) => ({ s, a: span(s)[0], b: span(s)[1], lane: 0, lanes: 1 }))
    .sort((x, y) => x.a - y.a || Number(!!y.s.staff_id) - Number(!!x.s.staff_id) || y.b - x.b);
  let cluster: typeof items = [];
  let clusterEnd = -1;
  const close = () => { const n = Math.max(0, ...cluster.map((i) => i.lane)) + 1; cluster.forEach((i) => (i.lanes = n)); cluster = []; };
  for (const it of items) {
    if (it.a >= clusterEnd && cluster.length) close();
    const used = new Set(cluster.filter((c) => c.b > it.a).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    it.lane = lane;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.b);
  }
  if (cluster.length) close();
  return items;
}

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => { const d = new Date(); setNow(d.getHours() * 60 + d.getMinutes()); };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function DayTimeline({ dayShifts, staff, roles, offs, isToday, compact, readOnly, onEdit, onNew }: {
  dayShifts: Shift[]; staff: Staff[]; roles: string[]; offs: { p: Staff; t: TimeOff }[];
  isToday: boolean; compact?: boolean; readOnly?: boolean;
  onEdit: (s: Shift) => void;
  /** New shift: staffId "" for unfilled. Times in "HH:MM". */
  onNew: (staffId: string, start?: string, end?: string) => void;
}) {
  const now = useNow();
  const cov = dayCover(dayShifts);
  const { lo, hi } = cov;
  const H = compact ? 52 : 60; // px per hour
  const y = (m: number) => ((m - lo) / 60) * H;
  const hours = Array.from({ length: (hi - lo) / 60 + 1 }, (_, i) => lo + i * 60);
  const gutter = compact ? 46 : 58;
  const blocks = layout(dayShifts);
  const unfilled = dayShifts.filter((s) => !s.staff_id);
  const onIds = new Set(dayShifts.map((s) => s.staff_id));
  const offIds = new Set(offs.map((o) => o.p.id));
  const notOn = staff.filter((p) => !onIds.has(p.id) && !offIds.has(p.id));
  const first = (n: string) => n.split(" ")[0];

  // Click empty space: a new shift starting on that hour (pick who in the editor).
  const addAt = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    const m = lo + Math.floor((e.clientY - r.top) / H) * 60;
    onNew("", toTime(m), toTime(Math.min(m + 4 * 60, 24 * 60 - 1)));
  };

  if (!dayShifts.length) {
    return offs.length ? <OffList offs={offs} notOn={[]} /> : null;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* What needs doing */}
      {cov.gaps.length === 0 ? (
        <div role="status" style={{ ...card, boxShadow: "none", background: C.shiftBg, color: C.shiftText, padding: "10px 14px", fontSize: 14, fontWeight: 650 }}>
          Someone&apos;s on all day, {label(cov.first)} to {label(cov.last)}.
          {unfilled.length > 0 && <span style={{ color: UNFILLED.text }}> {unfilled.length === 1 ? "1 unfilled shift" : `${unfilled.length} unfilled shifts`} still to give out.</span>}
        </div>
      ) : (
        <div style={{ ...card, boxShadow: "none", background: UNFILLED.bg, padding: "10px 14px", display: "grid", gap: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 750, color: UNFILLED.text }}>
            {cov.gaps.length === 1 ? "1 gap" : `${cov.gaps.length} gaps`} with nobody on
          </div>
          {cov.gaps.map((g) => (
            <div key={g.start} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.secondary }}>
              <span style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", columnGap: 10 }}>
                <strong style={{ color: C.dark, fontWeight: 700, whiteSpace: "nowrap" }}>{label(g.start)} – {label(g.end)}</strong>
                <span>{g.unfilled.length ? "Unfilled shift, no one on it yet" : "Nothing rostered"}</span>
              </span>
              {!readOnly && (g.unfilled.length
                ? <button onClick={() => onEdit(g.unfilled[0])} className="app-press" style={gapBtn}>{compact ? "Assign" : "Give it to someone"}</button>
                : <button onClick={() => onNew("", toTime(g.start), toTime(g.end))} className="app-press" style={gapBtn}><Plus size={15} strokeWidth={2.6} /> {compact ? "Add shift" : "Fill this gap"}</button>)}
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card, padding: compact ? "16px 10px 16px 0" : "20px 16px 20px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: `${gutter}px minmax(0, 1fr)` }}>
          {/* Hour labels */}
          <div aria-hidden style={{ position: "relative", height: y(hi) }}>
            {hours.map((h) => (
              <span key={h} style={{ position: "absolute", right: 8, top: y(h), transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: C.muted, whiteSpace: "nowrap" }}>{label(h)}</span>
            ))}
          </div>

          {/* The day */}
          <div onClick={addAt} className={readOnly ? undefined : "tl-track"} title={readOnly ? undefined : "Click an empty time to add a shift"}
            style={{ position: "relative", height: y(hi), cursor: readOnly ? undefined : "copy" }}>
            {hours.map((h) => <span key={h} aria-hidden style={{ position: "absolute", left: 0, right: 0, top: y(h), borderTop: `1px solid ${C.divider}`, pointerEvents: "none" }} />)}

            {/* Gaps: a red band right across the day */}
            {cov.gaps.map((g) => (
              <div key={`g${g.start}`} aria-hidden style={{
                position: "absolute", left: 0, right: 0, top: y(g.start), height: y(g.end) - y(g.start), pointerEvents: "none",
                background: `repeating-linear-gradient(135deg, ${UNFILLED.bg} 0 6px, #fde2dd 6px 12px)`,
                borderTop: `1.5px dashed ${UNFILLED.border}`, borderBottom: `1.5px dashed ${UNFILLED.border}`, boxSizing: "border-box",
              }}>
                {!g.unfilled.length && (
                  <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 750, color: UNFILLED.text, background: C.white, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>
                    Nobody on
                  </span>
                )}
              </div>
            ))}

            {/* Shifts */}
            {blocks.map(({ s, a, b, lane, lanes }) => {
              const open = !s.staff_id;
              const sw = open ? UNFILLED : roleSwatch(s.role, roles);
              const who = open ? "Unfilled" : staff.find((p) => p.id === s.staff_id)?.name ?? "";
              const h = y(b) - y(a);
              const roomy = h >= 40; // name over time
              const showRole = h >= 72;
              const w = 100 / lanes;
              return (
                <button key={s.id} onClick={() => onEdit(s)} className="app-press"
                  title={`${who}: ${fmtTime(s.start_time)}–${fmtTime(s.end_time)}${s.role ? ` · ${s.role}` : ""}${s.notes ? `\n${s.notes}` : ""}`}
                  aria-label={`${who}, ${fmtTime(s.start_time)} to ${fmtTime(s.end_time)}${s.role ? `, ${s.role}` : ""}`}
                  style={{
                    position: "absolute", top: y(a) + 1, height: Math.max(h - 2, 20), left: `calc(${lane * w}% + 2px)`, width: `calc(${w}% - 4px)`,
                    background: sw.bg, color: sw.text, borderRadius: 8, boxSizing: "border-box", overflow: "hidden",
                    border: open ? `1.5px dashed ${sw.border}` : "none", borderLeft: `3px ${open ? "dashed" : "solid"} ${sw.border}`,
                    padding: compact ? "4px 6px" : "6px 9px", textAlign: "left", fontFamily: "inherit", cursor: "pointer", lineHeight: 1.25,
                    display: "flex", flexDirection: roomy ? "column" : "row", gap: roomy ? 1 : 6, alignItems: roomy ? "stretch" : "center",
                  }}>
                  <span title={who} style={{ fontSize: compact ? 13 : 14, fontWeight: 750, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: "none", maxWidth: "100%" }}>
                    {open ? "Unfilled" : first(who)}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
                    {fmtTime(s.start_time)}–{fmtTime(s.end_time)}
                  </span>
                  {showRole && s.role && <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.role}</span>}
                </button>
              );
            })}

            {isToday && now !== null && now >= lo && now <= hi && (
              <span aria-hidden style={{ position: "absolute", left: -4, right: 0, top: y(now), borderTop: `2px solid ${C.dark}`, pointerEvents: "none" }}>
                <span style={{ position: "absolute", left: 0, top: -5, width: 8, height: 8, borderRadius: "50%", background: C.dark }} />
              </span>
            )}
          </div>
        </div>
      </div>

      <OffList offs={offs} notOn={notOn} />
    </div>
  );
}

function OffList({ offs, notOn }: { offs: { p: Staff; t: TimeOff }[]; notOn: Staff[] }) {
  if (!offs.length && !notOn.length) return null;
  return (
    <div style={{ fontSize: 14, color: C.muted, display: "grid", gap: 4, padding: "0 4px", lineHeight: 1.45 }}>
      {offs.length > 0 && <div><strong style={{ color: C.offText }}>Off:</strong> {offs.map(({ p, t }) => `${p.name}${t.reason ? ` (${t.reason})` : ""}`).join(", ")}</div>}
      {notOn.length > 0 && <div><strong style={{ color: C.secondary }}>Not rostered:</strong> {notOn.map((p) => p.name).join(", ")}</div>}
    </div>
  );
}

const gapBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 4, border: "none", borderRadius: 999, padding: "6px 12px",
  background: C.white, color: UNFILLED.text, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
  boxShadow: `inset 0 0 0 1.5px ${UNFILLED.border}`, minHeight: 32, whiteSpace: "nowrap", flex: "none",
};
