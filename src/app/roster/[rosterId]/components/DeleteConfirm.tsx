"use client";

import { C } from "./tokens";

interface Props {
  kind: "shift" | "timeoff";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirm({ kind, onConfirm, onCancel }: Props) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(33,31,26,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 16 }}>
      <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 8 }}>
          {kind === "shift" ? "Delete shift?" : "Remove time-off?"}
        </div>
        <p style={{ fontSize: 13, color: C.secondary, marginBottom: 20 }}>This can&apos;t be undone.</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 16px", background: C.danger, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
