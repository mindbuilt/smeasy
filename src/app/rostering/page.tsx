"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ─── API ─────────────────────────────────────────────────────────────────────

const API = "https://smeasy-production.up.railway.app";

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTab = "staff" | "billing" | "business" | "account";

interface StaffMember {
  id: number;
  name: string;
  canManage: boolean;
  canBeRostered: boolean;
  invited: boolean;
  inviteEmail: string | null;
}

interface ApiStaff {
  id: number;
  name: string;
  email: string | null;
  canManage: boolean;
  canBeRostered: boolean;
}

interface ApiShift {
  id: number;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
}

interface ApiRoster {
  id: number;
  weekStart: string;
  status: string;
  shifts?: ApiShift[];
}

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  divider: "#f0ede4",
  muted: "#8a8678",
  secondary: "#5b584f",
  shiftBg: "#eaf9c8",
  shiftBorder: "#b7e021",
  shiftColor: "#3d5200",
  offBg: "#fdf1e0",
  offColor: "#8a5a10",
  danger: "#b3261e",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function thisWeekStart(): string {
  const mon = getMonday(new Date());
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RosteringPage() {
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("staff");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoaded, setStaffLoaded] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [inviteModal, setInviteModal] = useState<{ staffId: number; staffName: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Billing state
  const [billingShifts, setBillingShifts] = useState<ApiShift[]>([]);
  const [billingLoaded, setBillingLoaded] = useState(false);

  // Auth check
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = localStorage.getItem("smeasy_token");
    const role = localStorage.getItem("smeasy_role");
    if (!tk || role !== "manager") {
      router.replace("/auth/login");
      return;
    }
    setToken(tk);
    setAccountEmail(localStorage.getItem("smeasy_email") || "");
  }, [router]);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // Load staff
  const loadStaff = useCallback(async (tk: string) => {
    const data = await apiFetch("/staff", tk);
    if (Array.isArray(data)) {
      setStaff(
        data.map((m: ApiStaff) => ({
          id: m.id,
          name: m.name,
          canManage: m.canManage,
          canBeRostered: m.canBeRostered,
          invited: !!m.email,
          inviteEmail: m.email || null,
        }))
      );
      setStaffLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    loadStaff(token);
  }, [token, loadStaff]);

  // Load billing data when billing tab opens
  useEffect(() => {
    if (!token || activeTab !== "billing" || billingLoaded) return;
    const week = thisWeekStart();
    // Find this week's roster and get its shifts
    apiFetch("/rosters", token).then(async (rosters: ApiRoster[]) => {
      if (!Array.isArray(rosters)) return;
      const thisWeek = rosters.find((r) => r.weekStart.slice(0, 10) === week);
      if (thisWeek) {
        const detail = await apiFetch(`/rosters/${thisWeek.id}`, token);
        if (detail && Array.isArray(detail.shifts)) {
          setBillingShifts(detail.shifts);
        }
      }
      setBillingLoaded(true);
    });
  }, [token, activeTab, billingLoaded]);

  // ─── Staff management ────────────────────────────────────────────────────────

  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffName.trim() || !token) return;
    const res = await apiFetch("/staff", token, {
      method: "POST",
      body: JSON.stringify({ name: newStaffName.trim() }),
    });
    if (res.id) {
      setStaff((prev) => [
        ...prev,
        {
          id: res.id,
          name: res.name,
          canManage: res.canManage ?? false,
          canBeRostered: res.canBeRostered ?? true,
          invited: !!res.email,
          inviteEmail: res.email || null,
        },
      ]);
    }
    setNewStaffName("");
  }

  async function togglePermission(
    memberId: number,
    field: "canManage" | "canBeRostered",
    value: boolean
  ) {
    if (!token) return;
    const member = staff.find((m) => m.id === memberId);
    if (!member) return;
    const updated = { canManage: member.canManage, canBeRostered: member.canBeRostered, [field]: value };
    setStaff((prev) => prev.map((m) => (m.id === memberId ? { ...m, [field]: value } : m)));
    await apiFetch(`/staff/${memberId}`, token, {
      method: "PUT",
      body: JSON.stringify(updated),
    });
  }

  function openInviteModal(staffId: number, staffName: string) {
    setInviteModal({ staffId, staffName });
    setInviteEmail("");
  }

  async function sendInvite() {
    if (!inviteModal || !token) return;
    const res = await apiFetch("/staff/invite", token, {
      method: "POST",
      body: JSON.stringify({ staffId: inviteModal.staffId, email: inviteEmail }),
    });
    if (res.error) {
      showToast(res.error);
      return;
    }
    setStaff((prev) =>
      prev.map((m) =>
        m.id === inviteModal.staffId ? { ...m, invited: true, inviteEmail: inviteEmail } : m
      )
    );
    setInviteModal(null);
    showToast(`Invite sent to ${inviteEmail}`);
  }

  function handleLogout() {
    localStorage.removeItem("smeasy_token");
    localStorage.removeItem("smeasy_role");
    localStorage.removeItem("smeasy_business_name");
    localStorage.removeItem("smeasy_email");
    router.replace("/auth/login");
  }

  // ─── Billing helpers ─────────────────────────────────────────────────────────

  const billedStaffIds = new Set(billingShifts.map((s) => s.staffId));
  const billCount = staff.filter((m) => m.canBeRostered && billedStaffIds.has(m.id)).length;
  const billTotal = (billCount * 0.96).toFixed(2);

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: C.muted, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "staff", label: "Staff" },
    { key: "billing", label: "Billing" },
    { key: "business", label: "Business" },
    { key: "account", label: "Account" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          height: 58,
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/"
            style={{
              display: "block",
              width: 28,
              height: 28,
              background: C.accent,
              borderRadius: 5,
              textDecoration: "none",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: 16, color: C.dark }}>Smeasy</span>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Link
            href="/dashboard"
            style={{
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              color: C.secondary,
              textDecoration: "none",
              background: "transparent",
            }}
          >
            Dashboard
          </Link>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                background: activeTab === t.key ? C.dark : "transparent",
                color: activeTab === t.key ? C.white : C.secondary,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Log out */}
        <button
          onClick={handleLogout}
          style={{
            fontSize: 13,
            color: C.muted,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Log out
        </button>
      </div>

      {/* ── Tab content ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Staff Tab ── */}
        {activeTab === "staff" && (
          <div style={{ maxWidth: 680 }}>
            <p
              style={{
                fontSize: 13,
                color: C.muted,
                marginBottom: 20,
                marginTop: 0,
                lineHeight: 1.6,
              }}
            >
              Manage permissions and send portal invites.
            </p>

            {!staffLoaded ? (
              <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>
            ) : (
              <div
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {staff.length === 0 ? (
                  <div style={{ padding: "28px 20px", textAlign: "center" }}>
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                      No staff yet. Add someone below.
                    </p>
                  </div>
                ) : (
                  staff.map((member, idx) => (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        padding: "14px 20px",
                        borderBottom:
                          idx < staff.length - 1 ? `1px solid ${C.divider}` : "none",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Name */}
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: C.dark,
                          minWidth: 120,
                        }}
                      >
                        {member.name}
                      </div>

                      {/* Permissions */}
                      <div style={{ display: "flex", gap: 16, flex: 1 }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: C.secondary,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={member.canManage}
                            onChange={(e) =>
                              togglePermission(member.id, "canManage", e.target.checked)
                            }
                            style={{ accentColor: C.dark, width: 15, height: 15 }}
                          />
                          Can manage
                        </label>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: C.secondary,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={member.canBeRostered}
                            onChange={(e) =>
                              togglePermission(member.id, "canBeRostered", e.target.checked)
                            }
                            style={{ accentColor: C.dark, width: 15, height: 15 }}
                          />
                          Can be rostered
                        </label>
                      </div>

                      {/* Invite status */}
                      <div>
                        {member.invited ? (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.shiftColor,
                              background: C.shiftBg,
                              border: `1px solid ${C.shiftBorder}`,
                              padding: "3px 9px",
                              borderRadius: 10,
                            }}
                          >
                            Invited ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => openInviteModal(member.id, member.name)}
                            style={{
                              fontSize: 12,
                              padding: "5px 12px",
                              background: C.white,
                              color: C.dark,
                              border: `1px solid ${C.border}`,
                              borderRadius: 7,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Invite
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Add staff */}
            <form
              onSubmit={addStaff}
              style={{ marginTop: 16, display: "flex", gap: 10 }}
            >
              <input
                type="text"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="New staff name"
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  color: C.dark,
                  background: C.white,
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "9px 18px",
                  background: C.dark,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add
              </button>
            </form>
          </div>
        )}

        {/* ── Billing Tab ── */}
        {activeTab === "billing" && (
          <div style={{ maxWidth: 640 }}>
            <p
              style={{
                fontSize: 13,
                color: C.muted,
                marginBottom: 20,
                marginTop: 0,
                lineHeight: 1.6,
              }}
            >
              You only pay for staff rostered that week — quiet weeks cost less, managers are
              always free.
            </p>

            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "20px 24px",
              }}
            >
              {!billingLoaded ? (
                <p style={{ fontSize: 13, color: C.muted }}>Loading…</p>
              ) : (
                <>
                  {staff.map((member) => {
                    const isBilled = member.canBeRostered && billedStaffIds.has(member.id);
                    const isManagerOnly = member.canManage && !member.canBeRostered;
                    const isRosteredThisWeek = member.canBeRostered && billedStaffIds.has(member.id);
                    const tagLabel = isManagerOnly
                      ? "manager — never billed"
                      : isRosteredThisWeek
                      ? "rostered this week"
                      : "not rostered this week";

                    return (
                      <div
                        key={member.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: `1px solid ${C.divider}`,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{ fontWeight: 600, fontSize: 14, color: C.dark }}
                          >
                            {member.name}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: C.muted,
                            }}
                          >
                            ({tagLabel})
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isBilled ? C.shiftColor : "#c2bcaa",
                          }}
                        >
                          {isBilled ? "$0.96" : "$0.00"}
                        </span>
                      </div>
                    );
                  })}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 16,
                      paddingTop: 12,
                      borderTop: `2px solid ${C.border}`,
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>
                      {billCount} staff rostered × 96c
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>
                      ${billTotal}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Business Tab ── */}
        {activeTab === "business" && (
          <div style={{ maxWidth: 560 }}>
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Rostering tool */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderBottom: `1px solid ${C.divider}`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                    Rostering
                  </div>
                  <div style={{ fontSize: 12, color: C.secondary, marginTop: 2 }}>
                    Weekly shift grid, time-off, publish &amp; notify.
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 10,
                    background: "#e6f4ea",
                    color: "#1a6b2f",
                    border: "1px solid #b7dfbf",
                  }}
                >
                  Active
                </span>
              </div>

              {/* Placeholder */}
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    border: `2px dashed ${C.border}`,
                    borderRadius: 10,
                    padding: "16px 20px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      textAlign: "center",
                      margin: 0,
                    }}
                  >
                    More Smeasy tools will appear here as you add them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Account Tab ── */}
        {activeTab === "account" && (
          <div style={{ maxWidth: 480 }}>
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "24px",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
                Your Smeasy account
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: C.muted,
                  marginBottom: 20,
                  lineHeight: 1.6,
                  marginTop: 0,
                }}
              >
                This is your billing home — it covers every Smeasy tool you connect, not just
                Rostering.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.secondary,
                    marginBottom: 5,
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={accountEmail}
                  readOnly
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    color: C.muted,
                    background: C.bg,
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: "9px 18px",
                  background: C.white,
                  color: C.secondary,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Log out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {inviteModal && (
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
        >
          <div
            style={{
              background: C.white,
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 380,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 6 }}>
              Invite {inviteModal.staffName}
            </div>
            <p
              style={{
                fontSize: 12,
                color: C.muted,
                marginBottom: 16,
                lineHeight: 1.5,
                marginTop: 0,
              }}
            >
              They&apos;ll get an email with a magic link that opens a view-only &quot;My
              shifts&quot; screen. No password needed.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.secondary,
                  marginBottom: 5,
                }}
              >
                Staff email
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 14,
                  color: C.dark,
                  background: C.white,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setInviteModal(null)}
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
                onClick={sendInvite}
                style={{
                  padding: "8px 16px",
                  background: C.dark,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: C.dark,
            color: C.white,
            padding: "10px 20px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
