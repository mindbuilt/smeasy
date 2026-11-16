"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Shift, Staff } from "@/lib/types";
import { fmtTime } from "@/lib/dates";
import { changed, rosteredHours, worked, workedHours } from "@/lib/worked";
import { roleSwatch } from "@/lib/roleColors";
import { Avatar, C, btn, input } from "@/components/ui";

export type Patch = Partial<Pick<Shift, "actual_start" | "actual_end" | "actual_break_minutes" | "no_show">>;

const fmtH = (h: number) => h.toFixed(2).replace(/\.?0+$/, "") || "0";
const hhmm = (t: string) => t.slice(0, 5);
const BREAKS = [0, 15, 30, 45, 60];

/**
 * One shift on the Hours page: a single line (who, what was worked, hours).
 * Tap it to change the times, mark Didn't work, or go back to as rostered.
 */
export default function HoursRow({ s, first, person, roles, locked, open, onToggle, onChange }: {
  s: Shift; first: boolean; person: Staff | undefined; roles: string[]; locked: boolean;
  open: boolean; onToggle: () => void; onChange: (p: Patch) => void;
}) {
  const w = worked(s);
  const [start, setStart] = useState(w.start);
  const [end, setEnd] = useState(w.end);
  const name = person?.name ?? "Removed staff member";
  const sw = roleSwatch(s.role ?? person?.default_role ?? null, roles);
  const isChanged = changed(s);
  const h = workedHours(s);
  const diff = h - rosteredHours(s);
  const editing = open && !locked;

  // Store a time only when it differs from the roster.
  const saveTime = (field: "actual_start" | "actual_end", value: string, rostered: string) => {
    if (!value) return;
    const next = value === hhmm(rostered) ? null : value;
    if (next !== s[field] && !(next === null && s[field] === null)) onChange({ [field]: next });
  };

  const summary = s.no_show ? "Didn't work"
    : `${fmtTime(w.start)} – ${fmtTime(w.end)}${w.breakMinutes ? ` · ${w.breakMinutes}m` : ""}`;

  return (
    <div style={{ borderTop: first ? "none" : `1px solid ${C.divider}` }}>
      <button type="button" onClick={() => !locked && onToggle()} aria-expanded={locked ? undefined : editing} disabled={locked}
        className={locked ? undefined : "app-press"}
        style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", background: "none", border: "none", textAlign: "left", fontFamily: "inherit", cursor: locked ? "default" : "pointer", color: "inherit" }}>
        <Avatar name={name} size={34} tone={{ bg: sw.bg, text: sw.text }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          {/* While editing, the boxes below show the times, so the summary steps aside. */}
          {!editing && (
            <span style={{ display: "block", fontSize: 14, color: s.no_show ? C.muted : isChanged ? C.dark : C.secondary }}>
              {summary}{isChanged && !s.no_show && <span style={{ color: C.muted }}> · changed</span>}
            </span>
          )}
        </span>
        <span style={{ textAlign: "right", flex: "none" }}>
          <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: C.dark }}>{fmtH(h)}h</span>
          {Math.abs(diff) > 0.001 && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted }}>{diff > 0 ? "+" : "−"}{fmtH(Math.abs(diff))}</span>}
        </span>
        {!locked && <ChevronDown size={18} color={C.muted} style={{ flex: "none", transform: editing ? "rotate(180deg)" : "none", transition: "transform 160ms ease" }} aria-hidden />}
      </button>

      {editing && (
        <div style={{ padding: "0 14px 14px", display: "grid", gap: 10 }}>
          {isChanged && (
            <div style={{ fontSize: 13, color: C.muted }}>
              Rostered {fmtTime(s.start_time)} – {fmtTime(s.end_time)}{s.break_minutes ? `, ${s.break_minutes}m break` : ""}
            </div>
          )}
          {!s.no_show && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              <label style={{ display: "grid", gap: 3, fontSize: 12, color: C.muted, fontWeight: 600 }}>Start
                <input type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)}
                  onBlur={() => saveTime("actual_start", start, s.start_time)} style={{ ...input, minWidth: 0, minHeight: 40, padding: "8px 10px", fontSize: 15 }} />
              </label>
              <label style={{ display: "grid", gap: 3, fontSize: 12, color: C.muted, fontWeight: 600 }}>Finish
                <input type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)}
                  onBlur={() => saveTime("actual_end", end, s.end_time)} style={{ ...input, minWidth: 0, minHeight: 40, padding: "8px 10px", fontSize: 15 }} />
              </label>
              <label style={{ display: "grid", gap: 3, fontSize: 12, color: C.muted, fontWeight: 600 }}>Break
                <select value={w.breakMinutes} style={{ ...input, minWidth: 0, minHeight: 40, padding: "8px 10px", fontSize: 15 }}
                  onChange={(e) => { const m = Number(e.target.value); onChange({ actual_break_minutes: m === s.break_minutes ? null : m }); }}>
                  {[...new Set([...BREAKS, w.breakMinutes])].sort((a, b) => a - b).map((m) => <option key={m} value={m}>{m ? `${m}m` : "None"}</option>)}
                </select>
              </label>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button type="button" onClick={() => onChange({ no_show: !s.no_show })} className="app-press" style={{ ...btn(), minHeight: 36, padding: "6px 12px", fontSize: 14 }}>
              {s.no_show ? "They worked it" : "Didn't work"}
            </button>
            {isChanged && (
              <button type="button" onClick={() => { setStart(hhmm(s.start_time)); setEnd(hhmm(s.end_time)); onChange({ actual_start: null, actual_end: null, actual_break_minutes: null, no_show: false }); }}
                className="app-press" style={{ ...btn("ghost"), minHeight: 36, padding: "6px 10px", fontSize: 14 }}>As rostered</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
