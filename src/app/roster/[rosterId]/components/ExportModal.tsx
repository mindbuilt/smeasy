"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { C } from "./tokens";

const API = "https://smeasy-production.up.railway.app";

interface Props {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;
  rosterId: number;
  token: string;
  onClose: () => void;
}

interface PayrollSettings {
  payrollPlatform: string;
}

export default function ExportModal({ weekStart, weekEnd, rosterId, token, onClose }: Props) {
  const [settings, setSettings] = useState<PayrollSettings | null | undefined>(undefined); // undefined = loading
  const [startDate, setStartDate] = useState(weekStart);
  const [endDate, setEndDate] = useState(weekEnd);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/payroll-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSettings(data ?? null))
      .catch(() => setSettings(null));
  }, [token]);

  async function handleExport() {
    if (!settings) return;
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch(`${API}/export/payroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          rosterId,
          payrollPlatform: settings.payrollPlatform,
          startDate,
          endDate,
          breakMinutes,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setExportError(err.error || "Export failed");
        return;
      }

      const blob = await res.blob();

      // Try to get filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const platform = settings.payrollPlatform === "myob" ? "MYOB" : "Xero";
      const filename = match
        ? match[1]
        : `SMEASY_RosterPayroll_${platform}_${startDate}_${endDate}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      onClose();
    } finally {
      setExporting(false);
    }
  }

  const noSettings = settings === null;
  const loadingSettings = settings === undefined;
  const platformLabel = settings?.payrollPlatform === "myob" ? "MYOB Payroll" : "Xero Payroll";

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    color: C.dark,
    background: C.white,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: C.secondary,
    marginBottom: 5,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(33,31,26,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 14,
          padding: 24,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Title */}
        <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 16 }}>
          Export to payroll
        </div>

        {/* Platform status */}
        {loadingSettings && (
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>Loading settings…</p>
        )}

        {noSettings && (
          <div style={{ background: "#fdf1e0", border: "1px solid #d98c1f", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#8a5a10", margin: "0 0 4px 0", fontWeight: 600 }}>
              Set up payroll settings first.
            </p>
            <Link href="/payroll-settings" style={{ fontSize: 13, color: "#8a5a10", fontWeight: 700 }}>
              Go to settings →
            </Link>
          </div>
        )}

        {settings && (
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
            Platform: <strong style={{ color: C.dark }}>{platformLabel}</strong>
          </p>
        )}

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Pay period start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Pay period end</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Unpaid break (min)</label>
            <p style={{ fontSize: 11, color: C.muted, margin: "0 0 6px 0" }}>Deducted from each shift</p>
            <input
              type="number"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              min={0}
              max={120}
              step={5}
              style={{ ...inputStyle, maxWidth: 120 }}
            />
          </div>
        </div>

        {/* MYOB warning */}
        {settings?.payrollPlatform === "myob" && (
          <div style={{ background: "#fdf1e0", border: "1px solid #d98c1f", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#8a5a10", margin: 0, lineHeight: 1.5 }}>
              Some staff may be missing MYOB Payroll IDs. Set them in Staff settings before exporting.
            </p>
          </div>
        )}

        {/* Export error */}
        {exportError && (
          <div style={{ background: "#fde8e8", border: "1px solid #f5c6c6", borderRadius: 8, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: "#b3261e", margin: 0, lineHeight: 1.5 }}>{exportError}</p>
          </div>
        )}

        {/* Footer buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              background: C.white,
              color: C.dark,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={noSettings || loadingSettings || exporting}
            style={{
              padding: "8px 16px",
              background: C.dark,
              color: C.white,
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: noSettings || loadingSettings || exporting ? "default" : "pointer",
              opacity: noSettings || loadingSettings || exporting ? 0.5 : 1,
            }}
          >
            {exporting ? "Exporting…" : "Export & Download"}
          </button>
        </div>
      </div>
    </div>
  );
}
