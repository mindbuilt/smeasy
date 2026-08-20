"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  divider: "#f0ede4",
  muted: "#8a8678",
  secondary: "#5b584f",
};

const ROLES = ["Floor", "Kitchen", "Barista", "Bar", "Manager", "Other"];

interface PayItemRecord {
  xeroRateName: string;
  myobCategoryName: string;
}

interface ApiSettings {
  payrollPlatform: string;
  payItems: Array<{ smeasyRole: string; xeroRateName: string | null; myobCategoryName: string | null }>;
  trackingCategories: Array<{
    venueName: string;
    departmentName: string | null;
    xeroCategory1: string | null;
    xeroCategory2: string | null;
    myobJobCode: string | null;
  }>;
}

function emptyPayItems(): Record<string, PayItemRecord> {
  return Object.fromEntries(ROLES.map((r) => [r, { xeroRateName: "", myobCategoryName: "" }]));
}

export default function PayrollSettingsPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [platform, setPlatform] = useState<"xero" | "myob">("xero");
  const [payItems, setPayItems] = useState<Record<string, PayItemRecord>>(emptyPayItems());
  const [venue, setVenue] = useState("");
  const [department, setDepartment] = useState("");
  const [xeroCategory1, setXeroCategory1] = useState("");
  const [xeroCategory2, setXeroCategory2] = useState("");
  const [myobJobCode, setMyobJobCode] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = localStorage.getItem("smeasy_token");
    const role = localStorage.getItem("smeasy_role");
    if (!tk || role !== "manager") { router.replace("/auth/login"); return; }
    setToken(tk);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/payroll-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: ApiSettings | null) => {
        if (data) {
          setPlatform(data.payrollPlatform === "myob" ? "myob" : "xero");
          const items = emptyPayItems();
          for (const pi of data.payItems) {
            if (items[pi.smeasyRole] !== undefined) {
              items[pi.smeasyRole] = {
                xeroRateName: pi.xeroRateName ?? "",
                myobCategoryName: pi.myobCategoryName ?? "",
              };
            }
          }
          setPayItems(items);
          const tc = data.trackingCategories[0];
          if (tc) {
            setVenue(tc.venueName ?? "");
            setDepartment(tc.departmentName ?? "");
            setXeroCategory1(tc.xeroCategory1 ?? "");
            setXeroCategory2(tc.xeroCategory2 ?? "");
            setMyobJobCode(tc.myobJobCode ?? "");
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      const body = {
        payrollPlatform: platform,
        payItems: ROLES.map((role) => ({
          smeasyRole: role,
          xeroRateName: payItems[role]?.xeroRateName || null,
          myobCategoryName: payItems[role]?.myobCategoryName || null,
        })),
        trackingCategories: [
          {
            venueName: venue,
            departmentName: department || null,
            xeroCategory1: xeroCategory1 || null,
            xeroCategory2: xeroCategory2 || null,
            myobJobCode: myobJobCode || null,
          },
        ],
      };
      const res = await fetch(`${API}/payroll-settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        showToast("Saved!");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  }

  function updatePayItem(role: string, field: keyof PayItemRecord, value: string) {
    setPayItems((prev) => ({ ...prev, [role]: { ...prev[role], [field]: value } }));
  }

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
    fontSize: 13,
    fontWeight: 600,
    color: C.secondary,
    marginBottom: 5,
  };

  if (!token || loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif' }}>

      {/* Header */}
      <div style={{ height: 58, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 5, flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 16, color: C.dark }}>Smeasy</span>
          </div>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>Payroll Settings</span>
        </div>
        <Link href="/dashboard" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>
          ← Dashboard
        </Link>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Platform selector */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Payroll platform</div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["xero", "myob"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: platform === p ? "none" : `1px solid ${C.border}`,
                  background: platform === p ? C.dark : C.white,
                  color: platform === p ? C.white : C.dark,
                }}
              >
                {p === "xero" ? "Xero Payroll" : "MYOB Payroll"}
              </button>
            ))}
          </div>
        </div>

        {/* Pay items */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 4 }}>Pay items</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>Map each role to a pay item in your payroll software.</div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>SMEASY Role</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Xero Rate Name</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>MYOB Category</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROLES.map((role) => (
              <div key={role} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignItems: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{role}</div>
                <input
                  type="text"
                  value={payItems[role]?.xeroRateName ?? ""}
                  onChange={(e) => updatePayItem(role, "xeroRateName", e.target.value)}
                  placeholder="e.g. Ordinary Time"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={payItems[role]?.myobCategoryName ?? ""}
                  onChange={(e) => updatePayItem(role, "myobCategoryName", e.target.value)}
                  placeholder="e.g. Base Hourly"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Location & tracking */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 16 }}>Location &amp; tracking</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>Venue name <span style={{ color: "#b3261e" }}>*</span></label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. The Crown Hotel"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Department <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Front of House"
                style={inputStyle}
              />
            </div>

            {platform === "xero" && (
              <>
                <div>
                  <label style={labelStyle}>Tracking Category 1</label>
                  <input
                    type="text"
                    value={xeroCategory1}
                    onChange={(e) => setXeroCategory1(e.target.value)}
                    placeholder="e.g. Location"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Tracking Category 2</label>
                  <input
                    type="text"
                    value={xeroCategory2}
                    onChange={(e) => setXeroCategory2(e.target.value)}
                    placeholder="e.g. Department"
                    style={inputStyle}
                  />
                </div>
              </>
            )}

            {platform === "myob" && (
              <div>
                <label style={labelStyle}>Job Code</label>
                <input
                  type="text"
                  value={myobJobCode}
                  onChange={(e) => setMyobJobCode(e.target.value)}
                  placeholder="e.g. VENUE-01"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: "100%",
            padding: "12px",
            background: C.dark,
            color: C.white,
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.dark, color: C.white, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
