"use client";

import { useState } from "react";
import { C } from "./tokens";
import { StaffMember } from "./types";

const API = "https://smeasy-production.up.railway.app";

interface Props {
  member: StaffMember;
  token: string;
  onSave: (updated: StaffMember) => void;
  onCancel: () => void;
}

export default function StaffModal({ member, token, onSave, onCancel }: Props) {
  const [payrollId, setPayrollId] = useState(member.payrollId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API}/staff/${member.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ payrollId: payrollId.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      onSave({ ...member, payrollId: data.payrollId ?? null });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(33,31,26,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 4 }}>{member.name}</div>
        <p style={{ fontSize: 12, color: C.muted, margin: "0 0 16px 0", lineHeight: 1.5 }}>
          Used as the identifier in payroll exports.
        </p>

        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>
          Payroll ID
        </label>
        <input
          type="text"
          value={payrollId}
          onChange={(e) => setPayrollId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="e.g. EMP001"
          autoFocus
          style={{
            width: "100%",
            padding: "9px 12px",
            border: `1px solid ${error ? C.danger : C.border}`,
            borderRadius: 8,
            fontSize: 14,
            color: C.dark,
            background: C.white,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: error ? 8 : 20,
          }}
        />
        {error && (
          <p style={{ fontSize: 12, color: C.danger, margin: "0 0 16px 0" }}>{error}</p>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
