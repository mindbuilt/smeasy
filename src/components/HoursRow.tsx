"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { Shift, Staff } from "@/lib/types";
import { fmtTime } from "@/lib/dates";
import { changed, rosteredHours, worked, workedHours } from "@/lib/worked";
import { roleSwatch } from "@/lib/roleColors";
import { Avatar, C, btn, input } from "@/components/ui";

export type Patch = Partial<Pick<Shift, "actual_start" | "actual_end" | "actual_break_minutes" | "no_show">>;

const fmtH = (h: number) => h.toFixed(2).replace(/\.?0+$/, "") || "0";
const hhmm = (t: string) => t.slice(0, 5);
const BREAKS = [0, 15, 30, 45, 60];

/** One shift on the Hours page: rostered times, what was worked, and the hours. */
export default function HoursRow({ s, first, person, roles, locked, onChange }: {
  s: Shift; first: boolean; person: Staff | undefined; roles: string[]; locked: boolean; onChange: (p: Patch) => void;
}) {
  const w = worked(s);
  const [start, setStart] = useState(w.start);
  const [end, setEnd] = useState(w.end);
  const name = person?.name ?? "Removed staff member";
  const sw = roleSwatch(s.role ?? person?.default_role ?? null, roles);
  const isChanged = changed(s);
  const h = workedHours(s);
  const diff = h - rosteredHours(s);

  // Store a time only when it differs from the roster.
  const saveTime = (field: "actual_start" | "actual_end", value: string, rostered: string) => {
    if (!value) return;
    const next = value === hhmm(rostered) ? null : value;
    if (next !== s[field] && !(next === null && s[field] === null)) onChange({ [field]: next });
  };

  return (
    <div className="hrs-row" style={{ borderTop: first ? "none" : `1px solid ${C.divider}`, opacity: s.no_show ? 0.75 : 1 }}>
      <div className="hrs-who" style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
        <Avatar name={name} size={34} tone={{ bg: sw.bg, text: sw.text }} />
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
          <span style={{ display: "block", fontSize: 13, color: C.muted }}>
            Rostered {fmtTime(s.start_time)}–{fmtTime(s.end_time)}{s.break_minutes ? `, ${s.break_minutes}m break` : ""}
          </span>
        </span>
      </div>

      {s.no_show ? (
        <div className="hrs-times" style={{ fontSize: 14, color: C.secondary, alignSelf: "center" }}>Didn&apos;t work this shift</div>
      ) : (
        <div className="hrs-times">
          <label style={{ display: "grid", gap: 3, fontSize: 12, color: C.muted, fontWeight: 600 }}>Start
            <input type="time" step={900} value={start} disabled={locked} onChange={(e) => setStart(e.target.value)}
              onBlur={() => saveTime("actual_start", start, s.start_time)} style={{ ...input, minHeight: 40, padding: "8px 10px", fontSize: 15 }} />
          </label>
          <label style={{ display: "grid", gap: 3, fontSize: 12, color: C.muted, fontWeight: 600 }}>Finish
            <input type="time" step={900} value={end} disabled={locked} onChange={(e) => setEnd(e.target.value)}
              onBlur={() => saveTime("actual_end", end, s.end_time)} style={{ ...input, minHeight: 40, padding: "8px 10px", fontSize: 15 }} />
          </label>
          <label style={{ display: "grid", gap: 3, fontSize: 12, color: C.muted, fontWeight: 600 }}>Break
            <select value={w.breakMinutes} disabled={locked} style={{ ...input, minHeight: 40, padding: "8px 10px", fontSize: 15 }}
              onChange={(e) => { const m = Number(e.target.value); onChange({ actual_break_minutes: m === s.break_minutes ? null : m }); }}>
              {[...new Set([...BREAKS, w.breakMinutes])].sort((a, b) => a - b).map((m) => <option key={m} value={m}>{m ? `${m}m` : "None"}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="hrs-end" style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
        <span style={{ textAlign: "right", minWidth: 52 }}>
          <span style={{ display: "block", fontSize: 16, fontWeight: 800, color: C.dark }}>{fmtH(h)}h</span>
          {Math.abs(diff) > 0.001 && <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.muted }}>{diff > 0 ? "+" : "−"}{fmtH(Math.abs(diff))}</span>}
        </span>
        {!locked && (
          <span style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
            <button type="button" onClick={() => onChange({ no_show: !s.no_show })} className="app-press"
              style={{ ...btn("ghost"), minHeight: 30, padding: "4px 8px", fontSize: 13, color: C.secondary }}>
              {s.no_show ? "Worked it" : "Didn't work"}
            </button>
            {isChanged && (
              <button type="button" onClick={() => { setStart(hhmm(s.start_time)); setEnd(hhmm(s.end_time)); onChange({ actual_start: null, actual_end: null, actual_break_minutes: null, no_show: false }); }}
                className="app-press" style={{ ...btn("ghost"), minHeight: 26, padding: "2px 8px", fontSize: 12, color: C.muted }} title="Back to the rostered times">
                <RotateCcw size={13} /> As rostered
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

