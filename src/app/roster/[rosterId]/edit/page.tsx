"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { C, MONTHS } from "../components/tokens";
import { StaffMember, Shift, TimeOff, Roster, ApiRoster, CellModalState } from "../components/types";
import RosterGrid from "../components/RosterGrid";
import CellModal from "../components/CellModal";
import PublishModal from "../components/PublishModal";
import DeleteConfirm from "../components/DeleteConfirm";

const API = "https://smeasy-production.up.railway.app";
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options?.headers },
  });
  return res.json();
}

function parseHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function addDays(dateStr: string, n: number): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

function fmtWeekLabel(weekStart: string): string {
  const [y, mo, d] = weekStart.split("-").map(Number);
  const mon = new Date(y, mo - 1, d);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const mMon = MONTHS[mon.getMonth()], mSun = MONTHS[sun.getMonth()];
  if (mon.getMonth() === sun.getMonth()) return `Mon ${mon.getDate()} – Sun ${sun.getDate()} ${mMon} ${sun.getFullYear()}`;
  return `Mon ${mon.getDate()} ${mMon} – Sun ${sun.getDate()} ${mSun} ${sun.getFullYear()}`;
}

function fmtDayLabel(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  const idx = dt.getDay();
  return `${DAY_NAMES[idx === 0 ? 6 : idx - 1]} ${d} ${MONTHS[mo - 1]}`;
}

function computeWarnings(shifts: Shift[], staffId: number, date: string, startTime: string, endTime: string, excludeId: number | null): string[] {
  const start = parseHours(startTime), end = parseHours(endTime);
  if (end <= start) return [];
  const warnings: string[] = [];
  if (end - start < 3) warnings.push("Shift is under the minimum length");
  const others = shifts.filter((s) => s.staffId === staffId && s.id !== (excludeId ?? -1));
  const weekly = others.reduce((sum, s) => sum + parseHours(s.endTime) - parseHours(s.startTime), 0) + (end - start);
  if (weekly > 38) warnings.push("Weekly hours exceed 38h");
  const prev = others.find((s) => s.date.slice(0, 10) === addDays(date, -1));
  const next = others.find((s) => s.date.slice(0, 10) === addDays(date, 1));
  if (prev && 24 - parseHours(prev.endTime) + start < 10) warnings.push("Less than 10h rest from previous shift");
  if (next && 24 - end + parseHours(next.startTime) < 10) warnings.push("Less than 10h rest before next shift");
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

  const [cellModal, setCellModal] = useState<CellModalState | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [publishModal, setPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ kind: "shift" | "timeoff"; id: number } | null>(null);

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

  const load = useCallback(async (tk: string) => {
    const [rosterData, staffData, allRostersData] = await Promise.all([
      apiFetch(`/rosters/${rosterId}`, tk),
      apiFetch("/staff", tk),
      apiFetch("/rosters", tk),
    ]);
    if (rosterData.id) {
      setRoster(rosterData);
      setShifts(rosterData.shifts ?? []);
      const ws = (rosterData.weekStart as string).slice(0, 10);
      const toData = await apiFetch(`/timeoff?week=${ws}`, tk);
      if (Array.isArray(toData)) setTimeOffs(toData);
    } else {
      router.replace("/dashboard");
    }
    if (Array.isArray(staffData)) setStaff(staffData);
    if (Array.isArray(allRostersData)) setAllRosters(allRostersData);
    setLoading(false);
  }, [rosterId, router]);

  useEffect(() => { if (token) load(token); }, [token, load]);

  const published = roster?.status === "published";
  const weekDates = roster ? getWeekDates(roster.weekStart.slice(0, 10)) : [];
  const rosterableStaff = staff.filter((s) => s.canBeRostered);
  const rosteredForPublish = rosterableStaff.filter((m) => shifts.some((s) => s.staffId === m.id));

  function navigateWeek(dir: -1 | 1) {
    if (!roster) return;
    const target = addDays(roster.weekStart.slice(0, 10), dir * 7);
    const found = allRosters.find((r) => r.weekStart.slice(0, 10) === target);
    found ? router.push(`/roster/${found.id}/edit`) : showToast("No roster for that week");
  }

  function openCell(member: StaffMember, date: string) {
    const existingShift = shifts.find((s) => s.staffId === member.id && s.date.slice(0, 10) === date) ?? null;
    const existingTimeOff = timeOffs.find((o) => o.staffId === member.id && o.date.slice(0, 10) === date) ?? null;
    setCellModal({
      staffId: member.id, staffName: member.name, date, dayLabel: fmtDayLabel(date),
      existingShift, existingTimeOff,
      mode: existingTimeOff && !existingShift ? "timeoff" : "shift",
      startTime: existingShift?.startTime ?? "09:00",
      endTime: existingShift?.endTime ?? "17:00",
      role: existingShift?.role ?? "Floor",
      reason: existingTimeOff?.reason ?? "",
    });
  }

  async function saveCell() {
    if (!cellModal || !token || !roster) return;
    setFormLoading(true);
    try {
      if (cellModal.mode === "shift") {
        if (cellModal.existingTimeOff) {
          await apiFetch(`/timeoff/${cellModal.existingTimeOff.id}`, token, { method: "DELETE" });
          setTimeOffs((prev) => prev.filter((o) => o.id !== cellModal.existingTimeOff!.id));
        }
        if (cellModal.existingShift) {
          const res = await apiFetch(`/shifts/${cellModal.existingShift.id}`, token, {
            method: "PUT",
            body: JSON.stringify({ startTime: cellModal.startTime, endTime: cellModal.endTime, role: cellModal.role }),
          });
          if (res.id) { setShifts((prev) => prev.map((s) => s.id === res.id ? { ...s, ...res } : s)); showToast("Shift updated"); }
          else showToast(res.error || "Failed to update");
        } else {
          const res = await apiFetch("/shifts", token, {
            method: "POST",
            body: JSON.stringify({ staffId: cellModal.staffId, date: cellModal.date, startTime: cellModal.startTime, endTime: cellModal.endTime, role: cellModal.role }),
          });
          if (res.id) { setShifts((prev) => [...prev, { ...res, staff: { name: cellModal.staffName } }]); showToast("Shift added"); }
          else showToast(res.error || "Failed to add shift");
        }
      } else {
        if (cellModal.existingShift) {
          await apiFetch(`/shifts/${cellModal.existingShift.id}`, token, { method: "DELETE" });
          setShifts((prev) => prev.filter((s) => s.id !== cellModal.existingShift!.id));
        }
        if (!cellModal.existingTimeOff) {
          const res = await apiFetch("/timeoff", token, {
            method: "POST",
            body: JSON.stringify({ staffId: cellModal.staffId, date: cellModal.date, type: "Day Off", reason: cellModal.reason }),
          });
          if (res.id) { setTimeOffs((prev) => [...prev, { ...res, staff: { name: cellModal.staffName } }]); showToast("Time-off added"); }
          else showToast(res.error || "Failed to add time-off");
        } else {
          showToast("Time-off already set");
        }
      }
      setCellModal(null);
    } finally { setFormLoading(false); }
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
    await apiFetch(`/rosters/${roster.id}`, token, { method: "PUT", body: JSON.stringify({ status: "draft" }) });
    setSaving(false);
    showToast("Saved as draft");
  }

  async function publishRoster() {
    if (!token || !roster) return;
    setPublishing(true);
    const updated = await apiFetch(`/rosters/${roster.id}`, token, { method: "PUT", body: JSON.stringify({ status: "published" }) });
    await apiFetch("/publish", token, { method: "POST", body: JSON.stringify({ weekStart: roster.weekStart.slice(0, 10) }) });
    if (updated.id) setRoster((r) => r ? { ...r, status: "published", publishedAt: updated.publishedAt ?? null } : r);
    setPublishModal(false);
    setPublishing(false);
    showToast("Roster published — staff notified");
  }

  async function approveTimeOff(id: number) {
    if (!token) return;
    await apiFetch(`/timeoff/${id}`, token, { method: "PUT", body: JSON.stringify({ status: "Approved" }) });
    setTimeOffs((prev) => prev.map((o) => o.id === id ? { ...o, status: "Approved" as const } : o));
    showToast("Time-off approved");
  }

  function downloadCSV() {
    if (!token || !roster) return;
    fetch(`${API}/export/csv?week=${roster.weekStart.slice(0, 10)}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob()).then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `roster-${roster!.weekStart.slice(0, 10)}.csv`;
        a.click();
      });
  }

  const modalWarnings = cellModal?.mode === "shift"
    ? computeWarnings(shifts, cellModal.staffId, cellModal.date, cellModal.startTime, cellModal.endTime, cellModal.existingShift?.id ?? null)
    : [];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.muted, fontSize: 14 }}>Loading roster…</p>
    </div>
  );
  if (!roster) return null;

  const weekLabel = fmtWeekLabel(roster.weekStart.slice(0, 10));
  const statusColors = published
    ? { bg: "#e6f4ea", color: "#1a6b2f", border: "#b7dfbf" }
    : { bg: C.offBg, color: C.offText, border: C.warnBorder };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: '-apple-system, system-ui, "Segoe UI", sans-serif' }}>

      {/* ── Sticky header ── */}
      <div style={{ height: 58, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50, gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link href="/dashboard" style={{ fontSize: 12, color: C.muted, textDecoration: "none", whiteSpace: "nowrap" }}>← Dashboard</Link>
          <div style={{ width: 1, height: 16, background: C.border, flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: C.dark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{weekLabel}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: statusColors.bg, color: statusColors.color, border: `1px solid ${statusColors.border}`, flexShrink: 0 }}>
            {roster.status}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {published ? (
            <button onClick={downloadCSV} style={{ padding: "7px 14px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Download CSV
            </button>
          ) : (
            <>
              <button onClick={saveDraft} disabled={saving} style={{ padding: "7px 14px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button onClick={() => setPublishModal(true)} style={{ padding: "7px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Publish &amp; notify
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Week switcher ── */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "8px 24px" }}>
        <button onClick={() => navigateWeek(-1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark, padding: "2px 8px" }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.dark, minWidth: 200, textAlign: "center" }}>{weekLabel}</span>
        <button onClick={() => navigateWeek(1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark, padding: "2px 8px" }}>›</button>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>

        <RosterGrid
          weekDates={weekDates}
          rosterableStaff={rosterableStaff}
          shifts={shifts}
          timeOffs={timeOffs}
          onCellClick={openCell}
        />

        {/* ── Time-off requests panel ── */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", marginTop: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Time-off requests</div>
          {timeOffs.length === 0 ? (
            <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>No requests this week.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {timeOffs.map((off) => {
                const member = staff.find((m) => m.id === off.staffId);
                const isApproved = off.status === "Approved";
                return (
                  <div key={off.id} style={{ background: C.offBg, border: `1px solid ${C.warnBorder}`, borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, color: C.dark }}>
                      {member?.name ?? "Staff"} — {fmtDayLabel(off.date.slice(0, 10))} · {off.reason || "No reason"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: isApproved ? "#e6f4ea" : C.offBg, color: isApproved ? "#1a6b2f" : C.offText, border: `1px solid ${isApproved ? "#b7dfbf" : C.offBorder}` }}>
                        {off.status}
                      </span>
                      {!isApproved && (
                        <button onClick={() => approveTimeOff(off.id)} style={{ padding: "4px 10px", background: C.dark, color: C.white, border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
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

      {/* ── Modals ── */}
      {cellModal && (
        <CellModal
          modal={cellModal}
          warnings={modalWarnings}
          loading={formLoading}
          onChange={setCellModal}
          onSave={saveCell}
          onCancel={() => setCellModal(null)}
          onDeleteClick={() => {
            if (cellModal.existingShift) setDeleteConfirm({ kind: "shift", id: cellModal.existingShift.id });
            else if (cellModal.existingTimeOff) setDeleteConfirm({ kind: "timeoff", id: cellModal.existingTimeOff.id });
          }}
        />
      )}

      {publishModal && (
        <PublishModal
          weekLabel={weekLabel}
          rosteredStaff={rosteredForPublish}
          shifts={shifts}
          publishing={publishing}
          onConfirm={publishRoster}
          onCancel={() => setPublishModal(false)}
        />
      )}

      {deleteConfirm && (
        <DeleteConfirm
          kind={deleteConfirm.kind}
          onConfirm={deleteEntry}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.dark, color: C.white, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
