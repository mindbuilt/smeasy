"use client";

import { C, ROLES } from "./tokens";
import { CellModalState, ModalMode } from "./types";

interface Props {
  modal: CellModalState;
  warnings: string[];
  loading: boolean;
  onChange: (updated: CellModalState) => void;
  onSave: () => void;
  onCancel: () => void;
  onDeleteClick: () => void;
}

export default function CellModal({ modal, warnings, loading, onChange, onSave, onCancel, onDeleteClick }: Props) {
  const hasExisting = !!(modal.existingShift || modal.existingTimeOff);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(33,31,26,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>

        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{modal.staffName}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{modal.dayLabel}</div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: 4, marginBottom: 18, background: C.bg, borderRadius: 8, padding: 3 }}>
          {(["shift", "timeoff"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => onChange({ ...modal, mode: m })}
              style={{
                flex: 1, padding: "7px 0", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600,
                border: modal.mode === m ? "none" : `1px solid ${C.border}`,
                background: modal.mode === m ? C.dark : C.white,
                color: modal.mode === m ? C.white : C.secondary,
              }}
            >
              {m === "shift" ? "Shift" : "Time-off"}
            </button>
          ))}
        </div>

        {modal.mode === "shift" ? (
          <>
            {/* Start / End */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              {(["startTime", "endTime"] as const).map((field) => (
                <div key={field} style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>
                    {field === "startTime" ? "Start" : "End"}
                  </label>
                  <input
                    type="time"
                    value={modal[field]}
                    onChange={(e) => onChange({ ...modal, [field]: e.target.value })}
                    style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }}
                  />
                </div>
              ))}
            </div>

            {/* Role */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Role</label>
              <select
                value={modal.role}
                onChange={(e) => onChange({ ...modal, role: e.target.value })}
                style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }}
              >
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Compliance warnings */}
            {warnings.length > 0 && (
              <div style={{ background: C.offBg, border: `1px solid ${C.warnBorder}`, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
                {warnings.map((w, i) => (
                  <div key={i} style={{ fontSize: 11, fontWeight: 700, color: C.offText, marginBottom: i < warnings.length - 1 ? 4 : 0 }}>
                    ⚠ {w}
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "#a08454", marginTop: 6 }}>A rough check — confirm your award.</div>
              </div>
            )}
          </>
        ) : (
          /* Time-off mode */
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Reason (optional)</label>
            <input
              type="text"
              value={modal.reason}
              onChange={(e) => onChange({ ...modal, reason: e.target.value })}
              placeholder="e.g. Doctor appointment"
              style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          {hasExisting && (
            <button onClick={onDeleteClick} style={{ padding: "8px 14px", background: "none", color: C.danger, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
              Delete
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onCancel} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onSave} disabled={loading} style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
