"use client";

import { C } from "./tokens";
import { StaffMember, Shift } from "./types";

interface Props {
  weekLabel: string;
  rosteredStaff: StaffMember[];
  shifts: Shift[];
  publishing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function shiftHours(startTime: string, endTime: string): number {
  const parse = (t: string) => { const [h, m] = t.split(":").map(Number); return h + m / 60; };
  return parse(endTime) - parse(startTime);
}

export default function PublishModal({ weekLabel, rosteredStaff, shifts, publishing, onConfirm, onCancel }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(33,31,26,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Publish &amp; notify</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{weekLabel} — sends shift notifications by email.</div>

        {/* Staff list */}
        <div style={{ maxHeight: 200, overflowY: "auto", border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 20 }}>
          {rosteredStaff.length === 0 ? (
            <p style={{ padding: 16, fontSize: 13, color: C.muted, margin: 0 }}>No staff rostered yet.</p>
          ) : (
            rosteredStaff.map((member) => {
              const hrs = shifts.filter((s) => s.staffId === member.id).reduce((sum, s) => sum + shiftHours(s.startTime, s.endTime), 0);
              return (
                <div key={member.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${C.divider}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{member.name}</span>
                  <span style={{ fontSize: 13, color: C.muted }}>{hrs.toFixed(1)}h</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={publishing} style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: publishing ? "default" : "pointer", opacity: publishing ? 0.7 : 1 }}>
            {publishing ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
