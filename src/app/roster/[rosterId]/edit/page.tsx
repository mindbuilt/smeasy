"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, use, useRef } from "react";
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
  shiftBg: "#eaf9c8",
  shiftBorder: "#b7e021",
  shiftText: "#3d5200",
  offBg: "#fdf1e0",
  offBorder: "#d98c1f",
  offText: "#8a5a10",
  warnBorder: "#f0d9ab",
  danger: "#b3261e",
  mutedFaint: "#c2bcaa",
  hoverBg: "#f0ede4",
  hoverBorder: "#b3ad9b",
};

const ROLES = ["Floor", "Kitchen", "Barista", "Bar", "Manager", "Other"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StaffMember {
  id: number;
  name: string;
  canBeRostered: boolean;
}

interface Shift {
  id: number;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  staff?: { name: string };
}

interface TimeOff {
  id: number;
  staffId: number;
  date: string;
  reason: string;
  status: "Pending" | "Approved";
  staff?: { name: string };
}

interface Roster {
  id: number;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "published";
  publishedAt: string | null;
  shifts: Shift[];
}

interface ApiRoster {
  id: number;
  weekStart: string;
  weekEnd?: string;
  status: "draft" | "published";
  publishedAt?: string | null;
}

type ModalMode = "shift" | "timeoff";

interface CellModal {
  staffId: number;
  staffName: string;
  date: string; // YYYY-MM-DD
  dayLabel: string;
  existingShift: Shift | null;
  existingTimeOff: TimeOff | null;
  mode: ModalMode;
  startTime: string;
  endTime: string;
  role: string;
  reason: string;
}

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

function parseTimeToHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function fmtWeekLabel(weekStart: string): string {
  const [y, mo, d] = weekStart.split("-").map(Number);
  const mon = new Date(y, mo - 1, d);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const dMon = mon.getDate();
  const mMon = MONTHS[mon.getMonth()];
  const dSun = sun.getDate();
  const mSun = MONTHS[sun.getMonth()];
  const yr = sun.getFullYear();
  if (mon.getMonth() === sun.getMonth()) return `Mon ${dMon} – Sun ${dSun} ${mMon} ${yr}`;
  return `Mon ${dMon} ${mMon} – Sun ${dSun} ${mSun} ${yr}`;
}

function fmtDayLabel(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  const dayIdx = dt.getDay(); // 0=Sun
  const name = DAY_NAMES[dayIdx === 0 ? 6 : dayIdx - 1];
  return `${name} ${d} ${MONTHS[mo - 1]}`;
}

function addDaysToDate(dateStr: string, n: number): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysToDate(weekStart, i));
}

function shiftHours(startTime: string, endTime: string): number {
  return parseTimeToHours(endTime) - parseTimeToHours(startTime);
}

function computeWarnings(
  allShifts: Shift[],
  staffId: number,
  date: string,
  startTime: string,
  endTime: string,
  excludeShiftId: number | null
): string[] {
  const warnings: string[] = [];
  const start = parseTimeToHours(startTime);
  const end = parseTimeToHours(endTime);
  if (end <= start) return warnings; // invalid, skip

  const duration = end - start;
  if (duration < 3) warnings.push("Shift is under the minimum length");

  const otherShifts = allShifts.filter(
    (s) => s.staffId === staffId && s.id !== (excludeShiftId ?? -1)
  );
  const weeklyHrs = otherShifts.reduce((sum, s) => sum + shiftHours(s.startTime, s.endTime), 0) + duration;
  if (weeklyHrs > 38) warnings.push("Weekly hours exceed 38h");

  const prevDate = addDaysToDate(date, -1);
  const nextDate = addDaysToDate(date, 1);

  const prevShift = otherShifts.find((s) => s.date.slice(0, 10) === prevDate);
  const nextShift = otherShifts.find((s) => s.date.slice(0, 10) === nextDate);

  if (prevShift) {
    const prevEnd = parseTimeToHours(prevShift.endTime);
    const rest = 24 - prevEnd + start;
    if (rest < 10) warnings.push("Less than 10h rest from previous shift");
  }
  if (nextShift) {
    const nextStart = parseTimeToHours(nextShift.startTime);
    const rest = 24 - end + nextStart;
    if (rest < 10) warnings.push("Less than 10h rest before next shift");
  }

  return warnings;
}

export default function RosterEditPage({ params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = use(params);
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [allRosters, setAllRosters] = useState<ApiRoster[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cell modal
  const [cellModal, setCellModal] = useState<CellModal | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Publish modal
  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: "shift" | "timeoff"; id: number } | null>(null);

  // Hover state for empty cells
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // Auth
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = localStorage.getItem("smeasy_token");
    const role = localStorage.getItem("smeasy_role");
    if (!tk || role !== "manager") {
      router.replace("/auth/login");
      return;
    }
    setToken(tk);
  }, [router]);

  const load = useCallback(
    async (tk: string) => {
      const [rosterData, staffData, allRostersData] = await Promise.all([
        apiFetch(`/rosters/${rosterId}`, tk),
        apiFetch("/staff", tk),
        apiFetch("/rosters", tk),
      ]);

      if (rosterData.id) {
        setRoster(rosterData);
        setShifts(rosterData.shifts ?? []);

        // Load time-off for this week
        const ws = (rosterData.weekStart as string).slice(0, 10);
        const toData = await apiFetch(`/timeoff?week=${ws}`, tk);
        if (Array.isArray(toData)) setTimeOffs(toData);
      } else {
        router.replace("/dashboard");
      }

      if (Array.isArray(staffData)) setStaff(staffData);
      if (Array.isArray(allRostersData)) setAllRosters(allRostersData);
      setLoading(false);
    },
    [rosterId, router]
  );

  useEffect(() => {
    if (!token) return;
    load(token);
  }, [token, load]);

  // Derived
  const published = roster?.status === "published";
  const weekDates = roster ? getWeekDates(roster.weekStart.slice(0, 10)) : [];
  const rosterableStaff = staff.filter((s) => s.canBeRostered);

  // Week switcher
  function navigateWeek(dir: -1 | 1) {
    if (!roster) return;
    const targetStart = addDaysToDate(roster.weekStart.slice(0, 10), dir * 7);
    const found = allRosters.find((r) => r.weekStart.slice(0, 10) === targetStart);
    if (found) {
      router.push(`/roster/${found.id}/edit`);
    } else {
      showToast("No roster for that week");
    }
  }

  // Open cell
  function openCell(member: StaffMember, date: string) {
    const existingShift = shifts.find((s) => s.staffId === member.id && s.date.slice(0, 10) === date) ?? null;
    const existingTimeOff = timeOffs.find((o) => o.staffId === member.id && o.date.slice(0, 10) === date) ?? null;
    const dayLabel = fmtDayLabel(date);

    let mode: ModalMode = "shift";
    let startTime = "09:00";
    let endTime = "17:00";
    let role = "Floor";
    let reason = "";

    if (existingShift) {
      startTime = existingShift.startTime;
      endTime = existingShift.endTime;
      role = existingShift.role;
    } else if (existingTimeOff) {
      mode = "timeoff";
      reason = existingTimeOff.reason ?? "";
    }

    setCellModal({
      staffId: member.id,
      staffName: member.name,
      date,
      dayLabel,
      existingShift,
      existingTimeOff,
      mode,
      startTime,
      endTime,
      role,
      reason,
    });
  }

  async function saveCell() {
    if (!cellModal || !token || !roster) return;
    setFormLoading(true);
    try {
      if (cellModal.mode === "shift") {
        // If time-off exists, delete it first
        if (cellModal.existingTimeOff) {
          await apiFetch(`/timeoff/${cellModal.existingTimeOff.id}`, token, { method: "DELETE" });
          setTimeOffs((prev) => prev.filter((o) => o.id !== cellModal.existingTimeOff!.id));
        }

        if (cellModal.existingShift) {
          // Edit
          const res = await apiFetch(`/shifts/${cellModal.existingShift.id}`, token, {
            method: "PUT",
            body: JSON.stringify({
              startTime: cellModal.startTime,
              endTime: cellModal.endTime,
              role: cellModal.role,
            }),
          });
          if (res.id) {
            setShifts((prev) =>
              prev.map((s) =>
                s.id === cellModal.existingShift!.id
                  ? { ...s, startTime: res.startTime, endTime: res.endTime, role: res.role }
                  : s
              )
            );
            showToast("Shift updated");
          } else {
            showToast(res.error || "Failed to update");
          }
        } else {
          // Add
          const res = await apiFetch("/shifts", token, {
            method: "POST",
            body: JSON.stringify({
              staffId: cellModal.staffId,
              date: cellModal.date,
              startTime: cellModal.startTime,
              endTime: cellModal.endTime,
              role: cellModal.role,
            }),
          });
          if (res.id) {
            setShifts((prev) => [...prev, { ...res, staff: { name: cellModal.staffName } }]);
            showToast("Shift added");
          } else {
            showToast(res.error || "Failed to add shift");
          }
        }
      } else {
        // Time-off mode
        // If shift exists, delete it first
        if (cellModal.existingShift) {
          await apiFetch(`/shifts/${cellModal.existingShift.id}`, token, { method: "DELETE" });
          setShifts((prev) => prev.filter((s) => s.id !== cellModal.existingShift!.id));
        }

        if (cellModal.existingTimeOff) {
          // Already exists, no edit endpoint for time-off reason typically; just close
          showToast("Time-off already set");
        } else {
          const res = await apiFetch("/timeoff", token, {
            method: "POST",
            body: JSON.stringify({
              staffId: cellModal.staffId,
              date: cellModal.date,
              type: "Day Off",
              reason: cellModal.reason,
            }),
          });
          if (res.id) {
            setTimeOffs((prev) => [...prev, { ...res, staff: { name: cellModal.staffName } }]);
            showToast("Time-off added");
          } else {
            showToast(res.error || "Failed to add time-off");
          }
        }
      }
      setCellModal(null);
    } finally {
      setFormLoading(false);
    }
  }

  async function deleteEntry() {
    if (!deleteConfirm || !token) return;
    if (deleteConfirm.kind === "shift") {
      await apiFetch(`/shifts/${deleteConfirm.id}`, token, { method: "DELETE" });
      setShifts((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
      showToast("Shift deleted");
    } else {
      await apiFetch(`/timeoff/${deleteConfirm.id}`, token, { method: "DELETE" });
      setTimeOffs((prev) => prev.filter((o) => o.id !== deleteConfirm.id));
      showToast("Time-off removed");
    }
    setDeleteConfirm(null);
    setCellModal(null);
  }

  async function saveDraft() {
    if (!token || !roster) return;
    setSaving(true);
    await apiFetch(`/rosters/${roster.id}`, token, {
      method: "PUT",
      body: JSON.stringify({ status: "draft" }),
    });
    setSaving(false);
    showToast("Saved as draft");
  }

  async function publishRoster() {
    if (!token || !roster) return;
    setPublishing(true);
    const updated = await apiFetch(`/rosters/${roster.id}`, token, {
      method: "PUT",
      body: JSON.stringify({ status: "published" }),
    });
    await apiFetch("/publish", token, {
      method: "POST",
      body: JSON.stringify({ weekStart: roster.weekStart.slice(0, 10) }),
    });
    if (updated.id) {
      setRoster((r) =>
        r ? { ...r, status: "published", publishedAt: updated.publishedAt ?? null } : r
      );
    }
    setPublishModal(false);
    setPublishing(false);
    showToast("Roster published — staff notified");
  }

  function downloadCSV() {
    if (!token || !roster) return;
    fetch(`${API}/export/csv?week=${roster.weekStart.slice(0, 10)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `roster-${roster.weekStart.slice(0, 10)}.csv`;
        a.click();
      });
  }

  async function approveTimeOff(id: number) {
    if (!token) return;
    await apiFetch(`/timeoff/${id}`, token, {
      method: "PUT",
      body: JSON.stringify({ status: "Approved" }),
    });
    setTimeOffs((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Approved" as const } : o))
    );
    showToast("Time-off approved");
  }

  // Compute warnings in real-time for the modal
  const modalWarnings =
    cellModal && cellModal.mode === "shift"
      ? computeWarnings(
          shifts,
          cellModal.staffId,
          cellModal.date,
          cellModal.startTime,
          cellModal.endTime,
          cellModal.existingShift?.id ?? null
        )
      : [];

  // Rostered staff for publish modal (canBeRostered + has >= 1 shift)
  const rosteredForPublish = rosterableStaff.filter((m) =>
    shifts.some((s) => s.staffId === m.id)
  );

  if (loading) {
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
        <p style={{ color: C.muted, fontSize: 14 }}>Loading roster…</p>
      </div>
    );
  }

  if (!roster) return null;

  const weekLabel = fmtWeekLabel(roster.weekStart.slice(0, 10));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.bg,
        fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif',
      }}
    >
      {/* ── Sticky header ── */}
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
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link
            href="/dashboard"
            style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}
          >
            ← Dashboard
          </Link>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{weekLabel}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 10,
              background: published ? "#e6f4ea" : C.offBg,
              color: published ? "#1a6b2f" : C.offText,
              border: `1px solid ${published ? "#b7dfbf" : C.warnBorder}`,
            }}
          >
            {roster.status}
          </span>
        </div>

        {/* Right */}
        <div style={{ display: "flex", gap: 8 }}>
          {published ? (
            <button
              onClick={downloadCSV}
              style={{
                padding: "7px 14px",
                background: C.white,
                color: C.dark,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Download CSV
            </button>
          ) : (
            <>
              <button
                onClick={saveDraft}
                disabled={saving}
                style={{
                  padding: "7px 14px",
                  background: C.white,
                  color: C.dark,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? "default" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button
                onClick={() => setPublishModal(true)}
                style={{
                  padding: "7px 16px",
                  background: C.dark,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Publish &amp; notify
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Week switcher row ── */}
      <div
        style={{
          background: C.white,
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "8px 24px",
        }}
      >
        <button
          onClick={() => navigateWeek(-1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: C.dark,
            padding: "2px 8px",
            lineHeight: 1,
          }}
        >
          ‹
        </button>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: C.dark,
            minWidth: 200,
            textAlign: "center",
          }}
        >
          {weekLabel}
        </span>
        <button
          onClick={() => navigateWeek(1)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 18,
            color: C.dark,
            padding: "2px 8px",
            lineHeight: 1,
          }}
        >
          ›
        </button>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* ── Grid ── */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 24,
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 780 }}>
              {/* Grid header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px repeat(7, 1fr) 64px",
                  background: C.bg,
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.muted,
                    textTransform: "uppercase",
                  }}
                >
                  Staff
                </div>
                {weekDates.map((dateStr, i) => {
                  const [y, mo, d] = dateStr.split("-").map(Number);
                  const dt = new Date(y, mo - 1, d);
                  const dayIdx = dt.getDay();
                  const dayName = DAY_NAMES[dayIdx === 0 ? 6 : dayIdx - 1];
                  return (
                    <div
                      key={i}
                      style={{
                        padding: "8px 6px",
                        textAlign: "center",
                        borderLeft: `1px solid ${C.divider}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.muted,
                          textTransform: "uppercase",
                        }}
                      >
                        {dayName}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 400, color: C.muted }}>{d}</div>
                    </div>
                  );
                })}
                <div
                  style={{
                    padding: "8px 6px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.muted,
                    textAlign: "center",
                    borderLeft: `1px solid ${C.divider}`,
                  }}
                >
                  Hrs
                </div>
              </div>

              {/* Staff rows */}
              {rosterableStaff.length === 0 ? (
                <div style={{ padding: "32px 20px", textAlign: "center" }}>
                  <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
                    No rostered staff. Add staff with &quot;Can be rostered&quot; enabled in{" "}
                    <Link href="/rostering" style={{ color: C.dark }}>
                      Staff settings
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                rosterableStaff.map((member) => {
                  const memberShifts = shifts.filter((s) => s.staffId === member.id);
                  const totalHrs = memberShifts.reduce(
                    (sum, s) => sum + shiftHours(s.startTime, s.endTime),
                    0
                  );
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "150px repeat(7, 1fr) 64px",
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      {/* Name cell */}
                      <div
                        style={{
                          padding: "10px 12px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.dark,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {member.name}
                      </div>

                      {/* Day cells */}
                      {weekDates.map((dateStr) => {
                        const shift = memberShifts.find((s) => s.date.slice(0, 10) === dateStr);
                        const off = timeOffs.find(
                          (o) => o.staffId === member.id && o.date.slice(0, 10) === dateStr
                        );
                        const cellKey = `${member.id}-${dateStr}`;
                        const isHovered = hoveredCell === cellKey;
                        const isEmpty = !shift && !off;

                        let chipBg = "transparent";
                        let chipBorder = `1px dashed #d8d3c4`;
                        let chipColor = C.mutedFaint;
                        let chipLabel = "+";

                        if (shift) {
                          chipBg = C.shiftBg;
                          chipBorder = `1px solid ${C.shiftBorder}`;
                          chipColor = C.shiftText;
                          chipLabel = `${shift.startTime}–${shift.endTime}`;
                        } else if (off) {
                          chipBg = C.offBg;
                          chipBorder = `1px solid ${C.offBorder}`;
                          chipColor = C.offText;
                          chipLabel = off.status === "Approved" ? "Off" : "Off (req)";
                        }

                        const cellStyle: React.CSSProperties = {
                          padding: "6px 4px",
                          minHeight: 48,
                          borderLeft: `1px solid ${C.divider}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          background:
                            isEmpty && isHovered ? C.hoverBg : "transparent",
                        };

                        const innerStyle: React.CSSProperties = {
                          fontSize: 11,
                          fontWeight: 700,
                          textAlign: "center",
                          padding: "5px 6px",
                          borderRadius: 10,
                          width: "100%",
                          background: chipBg,
                          border:
                            isEmpty && isHovered
                              ? `1px dashed ${C.hoverBorder}`
                              : chipBorder,
                          color: isEmpty && isHovered ? C.secondary : chipColor,
                        };

                        return (
                          <div
                            key={dateStr}
                            style={cellStyle}
                            onClick={() => openCell(member, dateStr)}
                            onMouseEnter={() => isEmpty && setHoveredCell(cellKey)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div style={innerStyle}>{chipLabel}</div>
                          </div>
                        );
                      })}

                      {/* Hrs cell */}
                      <div
                        style={{
                          padding: "10px 6px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.dark,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderLeft: `1px solid ${C.divider}`,
                        }}
                      >
                        {totalHrs > 0 ? `${totalHrs.toFixed(1)}` : "—"}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Time-off requests panel ── */}
        <div
          style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "16px 18px",
          }}
        >
          <div
            style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}
          >
            Time-off requests
          </div>
          {timeOffs.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>No requests this week.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {timeOffs.map((off) => {
                const member = staff.find((m) => m.id === off.staffId);
                const dayLabel = fmtDayLabel(off.date.slice(0, 10));
                return (
                  <div
                    key={off.id}
                    style={{
                      background: C.offBg,
                      border: `1px solid ${C.warnBorder}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: C.dark }}>
                      {member?.name ?? "Staff"} — {dayLabel} ·{" "}
                      {off.reason || "No reason"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background:
                            off.status === "Approved" ? "#e6f4ea" : C.offBg,
                          color:
                            off.status === "Approved" ? "#1a6b2f" : C.offText,
                          border: `1px solid ${off.status === "Approved" ? "#b7dfbf" : C.offBorder}`,
                        }}
                      >
                        {off.status}
                      </span>
                      {off.status === "Pending" && (
                        <button
                          onClick={() => approveTimeOff(off.id)}
                          style={{
                            padding: "4px 10px",
                            background: C.dark,
                            color: C.white,
                            border: "none",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Cell Modal ── */}
      {cellModal && (
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
              maxWidth: 420,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>
                {cellModal.staffName}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                {cellModal.dayLabel}
              </div>
            </div>

            {/* Mode toggle */}
            <div
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 18,
                background: C.bg,
                borderRadius: 8,
                padding: 3,
              }}
            >
              {(["shift", "timeoff"] as ModalMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() =>
                    setCellModal({ ...cellModal, mode: m })
                  }
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    borderRadius: 6,
                    border:
                      cellModal.mode === m
                        ? "none"
                        : `1px solid ${C.border}`,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    background: cellModal.mode === m ? C.dark : C.white,
                    color: cellModal.mode === m ? C.white : C.secondary,
                  }}
                >
                  {m === "shift" ? "Shift" : "Time-off"}
                </button>
              ))}
            </div>

            {cellModal.mode === "shift" ? (
              <>
                {/* Start / End times */}
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.secondary,
                        marginBottom: 5,
                      }}
                    >
                      Start
                    </label>
                    <input
                      type="time"
                      value={cellModal.startTime}
                      onChange={(e) =>
                        setCellModal({ ...cellModal, startTime: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: C.dark,
                        background: C.white,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.secondary,
                        marginBottom: 5,
                      }}
                    >
                      End
                    </label>
                    <input
                      type="time"
                      value={cellModal.endTime}
                      onChange={(e) =>
                        setCellModal({ ...cellModal, endTime: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "9px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 8,
                        fontSize: 14,
                        color: C.dark,
                        background: C.white,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Role */}
                <div style={{ marginBottom: 14 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      color: C.secondary,
                      marginBottom: 5,
                    }}
                  >
                    Role
                  </label>
                  <select
                    value={cellModal.role}
                    onChange={(e) =>
                      setCellModal({ ...cellModal, role: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "9px 10px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 14,
                      color: C.dark,
                      background: C.white,
                      boxSizing: "border-box",
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Compliance warnings */}
                {modalWarnings.length > 0 && (
                  <div
                    style={{
                      background: C.offBg,
                      border: `1px solid ${C.warnBorder}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      marginBottom: 14,
                    }}
                  >
                    {modalWarnings.map((w, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.offText,
                          marginBottom: i < modalWarnings.length - 1 ? 4 : 0,
                        }}
                      >
                        ⚠ {w}
                      </div>
                    ))}
                    <div style={{ fontSize: 11, color: "#a08454", marginTop: 6 }}>
                      A rough check — confirm your award.
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Time-off mode */
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 600,
                    color: C.secondary,
                    marginBottom: 5,
                  }}
                >
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={cellModal.reason}
                  onChange={(e) =>
                    setCellModal({ ...cellModal, reason: e.target.value })
                  }
                  placeholder="e.g. Doctor appointment"
                  style={{
                    width: "100%",
                    padding: "9px 10px",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
                    color: C.dark,
                    background: C.white,
                    boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}
            >
              {/* Delete button (only if editing existing) */}
              {(cellModal.existingShift || cellModal.existingTimeOff) && (
                <button
                  onClick={() => {
                    if (cellModal.existingShift) {
                      setDeleteConfirm({ kind: "shift", id: cellModal.existingShift.id });
                    } else if (cellModal.existingTimeOff) {
                      setDeleteConfirm({ kind: "timeoff", id: cellModal.existingTimeOff.id });
                    }
                  }}
                  style={{
                    padding: "8px 14px",
                    background: "none",
                    color: C.danger,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Delete
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={() => setCellModal(null)}
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
                onClick={saveCell}
                disabled={formLoading}
                style={{
                  padding: "8px 16px",
                  background: C.dark,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: formLoading ? "default" : "pointer",
                  opacity: formLoading ? 0.7 : 1,
                }}
              >
                {formLoading ? "…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Dialog ── */}
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(33,31,26,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: C.white,
              borderRadius: 14,
              padding: 24,
              width: "100%",
              maxWidth: 360,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: C.dark,
                marginBottom: 8,
              }}
            >
              {deleteConfirm.kind === "shift" ? "Delete shift?" : "Remove time-off?"}
            </div>
            <p style={{ fontSize: 13, color: C.secondary, marginBottom: 20 }}>
              This can&apos;t be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
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
                onClick={deleteEntry}
                style={{
                  padding: "8px 16px",
                  background: C.danger,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Publish Modal ── */}
      {publishModal && (
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
              maxWidth: 400,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: C.dark, marginBottom: 4 }}>
              Publish &amp; notify
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
              {weekLabel} — sends shift notifications by email.
            </div>

            {/* Staff list */}
            <div
              style={{
                maxHeight: 200,
                overflowY: "auto",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              {rosteredForPublish.length === 0 ? (
                <p style={{ padding: 16, fontSize: 13, color: C.muted, margin: 0 }}>
                  No staff rostered yet.
                </p>
              ) : (
                rosteredForPublish.map((member) => {
                  const hrs = shifts
                    .filter((s) => s.staffId === member.id)
                    .reduce((sum, s) => sum + shiftHours(s.startTime, s.endTime), 0);
                  return (
                    <div
                      key={member.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: `1px solid ${C.divider}`,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>
                        {member.name}
                      </span>
                      <span style={{ fontSize: 13, color: C.muted }}>
                        {hrs.toFixed(1)}h
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setPublishModal(false)}
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
                onClick={publishRoster}
                disabled={publishing}
                style={{
                  padding: "8px 16px",
                  background: C.dark,
                  color: C.white,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: publishing ? "default" : "pointer",
                  opacity: publishing ? 0.7 : 1,
                }}
              >
                {publishing ? "Sending…" : "Send"}
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
