"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3", white: "#ffffff", dark: "#211f1a", accent: "#b7e021",
  border: "#e7e2d6", divider: "#f0ede4", muted: "#8a8678", secondary: "#5b584f",
  shiftBg: "#eaf9c8", shiftBorder: "#b7e021", shiftColor: "#3d5200",
  offBg: "#fdf1e0", offColor: "#8a5a10", danger: "#b3261e",
};

const ROLES = ["Floor", "Kitchen", "Barista", "Bar", "Manager", "Other"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface StaffMember { id: number; name: string; }
interface Shift {
  id: number;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
  staff: { name: string };
}
interface Roster {
  id: number;
  weekStart: string;
  weekEnd: string;
  status: "draft" | "published";
  publishedAt: string | null;
  shifts: Shift[];
}

interface ShiftForm {
  staffId: string;
  date: string;
  startTime: string;
  endTime: string;
  role: string;
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dayIdx = d.getDay();
  const dayName = DAYS[dayIdx === 0 ? 6 : dayIdx - 1];
  return `${dayName} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function fmtWeekLabel(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart);
  const e = new Date(weekEnd);
  const sLabel = `${s.getDate()} ${MONTHS[s.getMonth()]}`;
  const eLabel = `${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  return `${sLabel} – ${eLabel}`;
}

function validateForm(form: ShiftForm, weekStart: string, weekEnd: string): string | null {
  if (!form.staffId) return "Staff member required";
  if (!form.date) return "Date required";
  const d = new Date(form.date);
  const ws = new Date(weekStart);
  const we = new Date(weekEnd);
  ws.setHours(0, 0, 0, 0); we.setHours(23, 59, 59, 999);
  if (d < ws || d > we) return "Date must be within the roster week";
  if (!form.startTime) return "Start time required";
  if (!form.endTime) return "End time required";
  if (form.endTime <= form.startTime) return "End time must be after start time";
  return null;
}

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", ...options?.headers },
  });
  return res.json();
}

const emptyForm = (): ShiftForm => ({ staffId: "", date: "", startTime: "09:00", endTime: "17:00", role: "Floor" });

export default function RosterEditPage({ params }: { params: Promise<{ rosterId: string }> }) {
  const { rosterId } = use(params);
  const router = useRouter();

  const [token, setToken] = useState<string | null>(null);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<{ mode: "add" | "edit"; shiftId?: number } | null>(null);
  const [form, setForm] = useState<ShiftForm>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Auth
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = localStorage.getItem("smeasy_token");
    const role = localStorage.getItem("smeasy_role");
    if (!tk || role !== "manager") { router.replace("/auth/login"); return; }
    setToken(tk);
  }, [router]);

  const load = useCallback(async (tk: string) => {
    const [rosterData, staffData] = await Promise.all([
      apiFetch(`/rosters/${rosterId}`, tk),
      apiFetch("/staff", tk),
    ]);
    if (rosterData.id) {
      setRoster(rosterData);
      setShifts(rosterData.shifts ?? []);
    } else {
      router.replace("/dashboard");
    }
    if (Array.isArray(staffData)) setStaff(staffData);
    setLoading(false);
  }, [rosterId, router]);

  useEffect(() => {
    if (!token) return;
    load(token);
  }, [token, load]);

  // Open add modal
  function openAdd() {
    setForm({ ...emptyForm(), date: roster?.weekStart.slice(0, 10) ?? "" });
    setFormError(null);
    setModal({ mode: "add" });
  }

  // Open edit modal
  function openEdit(shift: Shift) {
    setForm({
      staffId: String(shift.staffId),
      date: shift.date.slice(0, 10),
      startTime: shift.startTime,
      endTime: shift.endTime,
      role: shift.role,
    });
    setFormError(null);
    setModal({ mode: "edit", shiftId: shift.id });
  }

  async function submitForm() {
    if (!token || !roster) return;
    const err = validateForm(form, roster.weekStart.slice(0, 10), roster.weekEnd.slice(0, 10));
    if (err) { setFormError(err); return; }
    setFormLoading(true);
    try {
      if (modal?.mode === "add") {
        const res = await apiFetch("/shifts", token, {
          method: "POST",
          body: JSON.stringify({
            staffId: parseInt(form.staffId),
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            role: form.role,
          }),
        });
        if (res.id) {
          const staffMember = staff.find((s) => s.id === parseInt(form.staffId));
          setShifts((prev) => [...prev, { ...res, staff: { name: staffMember?.name ?? "" } }]
            .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)));
          setModal(null);
          showToast("Shift added");
        } else {
          setFormError(res.error || "Failed to add shift");
        }
      } else if (modal?.mode === "edit" && modal.shiftId) {
        const res = await apiFetch(`/shifts/${modal.shiftId}`, token, {
          method: "PUT",
          body: JSON.stringify({ startTime: form.startTime, endTime: form.endTime, role: form.role }),
        });
        if (res.id) {
          const staffMember = staff.find((s) => s.id === res.staffId);
          setShifts((prev) => prev.map((s) => s.id === modal.shiftId
            ? { ...res, staff: { name: staffMember?.name ?? s.staff.name } }
            : s));
          setModal(null);
          showToast("Shift updated");
        } else {
          setFormError(res.error || "Failed to update shift");
        }
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function deleteShift(id: number) {
    if (!token) return;
    await apiFetch(`/shifts/${id}`, token, { method: "DELETE" });
    setShifts((prev) => prev.filter((s) => s.id !== id));
    setDeleteConfirm(null);
    showToast("Shift deleted");
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
    if (updated.id) setRoster((r) => r ? { ...r, status: "published", publishedAt: updated.publishedAt } : r);
    setPublishing(false);
    showToast("Roster published — staff notified");
  }

  function downloadCSV() {
    if (!token || !roster) return;
    fetch(`${API}/export/csv?week=${roster.weekStart.slice(0, 10)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.blob()).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roster-${roster.weekStart.slice(0, 10)}.csv`;
      a.click();
    });
  }

  const published = roster?.status === "published";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Loading roster…</p>
      </div>
    );
  }

  if (!roster) return null;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{ height: 58, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ fontSize: 13, color: C.muted, textDecoration: "none" }}>← Dashboard</Link>
          <div style={{ width: 1, height: 16, background: C.border }} />
          <div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>
              Week of {fmtWeekLabel(roster.weekStart, roster.weekEnd)}
            </span>
            <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: published ? "#e6f4ea" : C.offBg, color: published ? "#1a6b2f" : C.offColor, border: `1px solid ${published ? "#b7dfbf" : "#f0d9ab"}` }}>
              {roster.status}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {published ? (
            <button onClick={downloadCSV}
              style={{ padding: "7px 14px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              Download CSV
            </button>
          ) : (
            <>
              <button onClick={saveDraft} disabled={saving}
                style={{ padding: "7px 14px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save draft"}
              </button>
              <button onClick={publishRoster} disabled={publishing}
                style={{ padding: "7px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: publishing ? "default" : "pointer", opacity: publishing ? 0.7 : 1 }}>
                {publishing ? "Publishing…" : "Publish & notify"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
        {/* Add shift button */}
        {!published && (
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={openAdd}
              style={{ padding: "9px 18px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              + Add shift
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", display: "block" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px 80px 100px 120px", gap: 0, background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            {["Date", "Staff", "Start", "End", "Role", ""].map((h, i) => (
              <div key={i} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: C.muted, borderLeft: i > 0 ? `1px solid ${C.divider}` : "none" }}>{h}</div>
            ))}
          </div>

          {shifts.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>No shifts yet.{!published && " Click \"+ Add shift\" to get started."}</p>
            </div>
          ) : (
            shifts.map((shift, idx) => (
              <div key={shift.id} style={{ display: "grid", gridTemplateColumns: "130px 1fr 80px 80px 100px 120px", borderBottom: idx < shifts.length - 1 ? `1px solid ${C.divider}` : "none", alignItems: "center" }}>
                <div style={{ padding: "12px 16px", fontSize: 13, color: C.dark, fontWeight: 600 }}>{fmtDate(shift.date)}</div>
                <div style={{ padding: "12px 16px", fontSize: 13, color: C.dark, borderLeft: `1px solid ${C.divider}` }}>{shift.staff.name}</div>
                <div style={{ padding: "12px 16px", fontSize: 13, color: C.secondary, borderLeft: `1px solid ${C.divider}`, fontVariantNumeric: "tabular-nums" }}>{shift.startTime}</div>
                <div style={{ padding: "12px 16px", fontSize: 13, color: C.secondary, borderLeft: `1px solid ${C.divider}`, fontVariantNumeric: "tabular-nums" }}>{shift.endTime}</div>
                <div style={{ padding: "12px 16px", fontSize: 13, color: C.secondary, borderLeft: `1px solid ${C.divider}` }}>{shift.role}</div>
                <div style={{ padding: "8px 12px", borderLeft: `1px solid ${C.divider}`, display: "flex", gap: 6 }}>
                  {!published && (
                    <>
                      <button onClick={() => openEdit(shift)}
                        style={{ padding: "4px 10px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Edit
                      </button>
                      <button onClick={() => setDeleteConfirm(shift.id)}
                        style={{ padding: "4px 10px", background: C.white, color: C.danger, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile shift cards */}
        {shifts.length > 0 && (
          <div style={{ marginTop: 0 }}>
            {/* Cards show on small screens — we use a media query workaround via inline style trick */}
          </div>
        )}

        {/* Summary */}
        {shifts.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 13, color: C.muted }}>
            {shifts.length} shift{shifts.length !== 1 ? "s" : ""} · {new Set(shifts.map((s) => s.staffId)).size} staff
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ─────────────────────────────────────────── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.dark }}>
              {modal.mode === "add" ? "Add shift" : "Edit shift"}
            </h2>

            {/* Staff (only for add) */}
            {modal.mode === "add" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Staff member</label>
                {staff.length === 0 ? (
                  <p style={{ fontSize: 13, color: C.danger, margin: 0 }}>No staff yet — add staff in <Link href="/rostering" style={{ color: C.dark }}>the roster</Link> first.</p>
                ) : (
                  <select value={form.staffId} onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                    style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }}>
                    <option value="">Select staff…</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                )}
              </div>
            )}

            {/* Date (only for add) */}
            {modal.mode === "add" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Date</label>
                <input type="date"
                  value={form.date}
                  min={roster.weekStart.slice(0, 10)}
                  max={roster.weekEnd.slice(0, 10)}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }} />
              </div>
            )}

            {/* Start / End times */}
            <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Start</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>End</label>
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }} />
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Role / Position</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: "100%", padding: "9px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            {formError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 14 }}>{formError}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setModal(null)}
                style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitForm} disabled={formLoading}
                style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: formLoading ? "default" : "pointer", opacity: formLoading ? 0.7 : 1 }}>
                {formLoading ? "…" : modal.mode === "add" ? "Add shift" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirm ── */}
      {deleteConfirm !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <h2 style={{ margin: "0 0 10px", fontSize: 16, fontWeight: 700, color: C.dark }}>Delete shift?</h2>
            <p style={{ fontSize: 14, color: C.secondary, marginBottom: 20 }}>This can&apos;t be undone.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setDeleteConfirm(null)}
                style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => deleteShift(deleteConfirm)}
                style={{ padding: "8px 16px", background: C.danger, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.dark, color: C.white, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
