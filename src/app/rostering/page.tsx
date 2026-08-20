"use client";

import Link from "next/link";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";

// ─── API ─────────────────────────────────────────────────────────────────────

const API = "https://smeasy-production.up.railway.app";

async function apiFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  return res.json();
}

// ─── Types ───────────────────────────────────────────────────────────────────

type AppView = "login" | "manager" | "staffPortal";
type ActiveTab = "roster" | "staff" | "requests" | "history" | "billing" | "business" | "account";
type AuthMode = "login" | "signup";
type AuthMethod = "password" | "magic";
type LoginType = "manager" | "staff";
type StaffPortalTab = "shifts" | "timeoff";

interface StaffMember {
  id: number;
  name: string;
  canManage: boolean;
  canBeRostered: boolean;
  invited: boolean;
  inviteEmail: string | null;
}

interface Shift {
  id: string;
  staffId: number;
  day: number;
  start: number;
  end: number;
  role: string;
}

interface TimeOff {
  id: string;
  staffId: number;
  day: number;
  reason: string;
  status: "Pending" | "Approved";
}

interface ApiStaff { id: number; name: string; email: string | null; canManage: boolean; canBeRostered: boolean; }
interface ApiShift { id: number; staffId: number; date: string; startTime: string; endTime: string; role: string; }
interface ApiTimeOff { id: number; staffId: number; date: string; reason: string; status: string; }

interface ApiTimeOffRequest {
  id: number; date: string; type: string; reason: string; status: string;
  staff: { name: string; email: string | null };
}
interface ApiSwapRequest {
  id: number; status: string;
  fromStaff: { name: string }; toStaff: { name: string };
  fromShift: { date: string; startTime: string; endTime: string };
  toShift: { date: string; startTime: string; endTime: string } | null;
}
interface ApiRequests { timeOff: ApiTimeOffRequest[]; swaps: ApiSwapRequest[]; }
interface PastWeek { weekStart: string; shiftCount: number; staffCount: number; }

type ShiftsByWeek = Record<number, Shift[]>;
type TimeOffByWeek = Record<number, TimeOff[]>;

type ModalState =
  | { kind: "shift"; staffId: number; day: number; id: string | null; mode: "shift" | "off"; start: number; end: number; role: string; reason: string; isNew: boolean }
  | { kind: "publish" }
  | null;

type InviteModalState = { staffId: number; staffName: string } | null;

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
  offBorder: "#f0d9ab",
  offBorderStrong: "#d98c1f",
  offColor: "#8a5a10",
  danger: "#b3261e",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function fmtTime(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}

function computeWarnings(shifts: Shift[], staffId: number, day: number, start: number, end: number, excludeId: string | null): string[] {
  const warnings: string[] = [];
  if (end - start < 3) warnings.push("Shift is under the minimum length");
  const others = shifts.filter((s) => s.staffId === staffId && s.id !== excludeId);
  const total = others.reduce((sum, s) => sum + (s.end - s.start), 0) + (end - start);
  if (total > 38) warnings.push("Weekly hours exceed 38");
  const prev = others.find((s) => s.day === (day + 6) % 7);
  const next = others.find((s) => s.day === (day + 1) % 7);
  let restBroken = false;
  if (prev) { const rest = (24 - prev.end) + start; if (rest < 10) restBroken = true; }
  if (next) { const rest = (24 - end) + next.start; if (rest < 10) restBroken = true; }
  if (restBroken) warnings.push("Less than 10 hours rest between shifts");
  return warnings;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

function fmtWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mMon = months[monday.getMonth()];
  const mSun = months[sunday.getMonth()];
  const dMon = monday.getDate();
  const dSun = sunday.getDate();
  const yr = sunday.getFullYear();
  if (monday.getMonth() === sunday.getMonth()) return `${dMon}–${dSun} ${mMon} ${yr}`;
  return `${dMon} ${mMon} – ${dSun} ${mSun} ${yr}`;
}

function fmtWeekLabelFromStr(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  return fmtWeekLabel(new Date(y, m - 1, d));
}

function fmtDayHeader(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function dateFromOffset(monday: Date, offset: number): string {
  const d = new Date(monday);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayOffset(dateStr: string, monday: Date): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Math.round((date.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RosteringPage() {
  // Auth state
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("smeasy_token") : null
  );
  const [loginType, setLoginType] = useState<LoginType>("manager");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("password");
  const [magicSent, setMagicSent] = useState(false);
  const [businessName, setBusinessName] = useState("Smeasy");
  const [staffDisplayName, setStaffDisplayName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("smeasy_staff_name") ?? "") : ""
  );
  const [appView, setAppView] = useState<AppView>(() => {
    if (typeof window === "undefined") return "login";
    const tk = localStorage.getItem("smeasy_token");
    if (!tk) return "login";
    return localStorage.getItem("smeasy_role") === "staff" ? "staffPortal" : "manager";
  });
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Manager state
  const [activeTab, setActiveTab] = useState<ActiveTab>("roster");
  const [weekOffset, setWeekOffset] = useState(0);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shiftsByWeek, setShiftsByWeek] = useState<ShiftsByWeek>({});
  const [timeOffByWeek, setTimeOffByWeek] = useState<TimeOffByWeek>({});
  const [modal, setModal] = useState<ModalState>(null);
  const [inviteModal, setInviteModal] = useState<InviteModalState>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<ApiRequests>({ timeOff: [], swaps: [] });
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  // History state
  const [pastWeeks, setPastWeeks] = useState<PastWeek[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Staff portal state
  const [portalWeekOffset, setPortalWeekOffset] = useState(0);
  const [staffPortalTab, setStaffPortalTab] = useState<StaffPortalTab>("shifts");
  const [portalShifts, setPortalShifts] = useState<Shift[]>([]);
  const [portalTimeOff, setPortalTimeOff] = useState<TimeOff[]>([]);
  const [portalTimeOffDate, setPortalTimeOffDate] = useState(() =>
    typeof window !== "undefined" ? dateFromOffset(getMonday(new Date()), 0) : ""
  );
  const [portalTimeOffReason, setPortalTimeOffReason] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // Week dates
  const baseMonday = useMemo(() => getMonday(new Date()), []);
  const monday = useMemo(() => addDays(baseMonday, weekOffset * 7), [baseMonday, weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);
  const weekLabel = useMemo(() => fmtWeekLabel(monday), [monday]);

  // Portal week
  const portalMonday = useMemo(() => addDays(baseMonday, portalWeekOffset * 7), [baseMonday, portalWeekOffset]);
  const portalWeekLabel = useMemo(() => fmtWeekLabel(portalMonday), [portalMonday]);

  // Current week data
  const currentShifts: Shift[] = shiftsByWeek[weekOffset] ?? [];
  const currentTimeOff: TimeOff[] = timeOffByWeek[weekOffset] ?? [];

  function setCurrentShifts(fn: (prev: Shift[]) => Shift[]) {
    setShiftsByWeek((prev) => ({ ...prev, [weekOffset]: fn(prev[weekOffset] ?? []) }));
  }

  function setCurrentTimeOff(fn: (prev: TimeOff[]) => TimeOff[]) {
    setTimeOffByWeek((prev) => ({ ...prev, [weekOffset]: fn(prev[weekOffset] ?? []) }));
  }

  // ─── Magic link detection on page load ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const magic = params.get("magic");
    if (!magic) return;
    window.history.replaceState({}, "", window.location.pathname);
    fetch(`${API}/auth/magic/verify?token=${encodeURIComponent(magic)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("smeasy_token", data.token);
          localStorage.setItem("smeasy_role", "manager");
          setToken(data.token);
          setAccountEmail(data.email ?? "");
          setBusinessName(data.businessName || "Smeasy");
          setAppView("manager");
        } else {
          setAuthError(data.error || "Magic link invalid or expired");
        }
      })
      .catch(() => setAuthError("Could not verify magic link"));
  }, []);

  // ─── Load staff ─────────────────────────────────────────────────────────────
  const loadStaff = useCallback(async (tk: string) => {
    const data = await apiFetch("/staff", tk);
    if (Array.isArray(data)) {
      setStaff(data.map((m: ApiStaff) => ({
        id: m.id, name: m.name, canManage: m.canManage, canBeRostered: m.canBeRostered,
        invited: !!m.email, inviteEmail: m.email || null,
      })));
    }
  }, []);

  // ─── Load shifts & timeoff for current week ──────────────────────────────────
  const loadWeek = useCallback(async (tk: string, mon: Date, offset: number) => {
    const weekStr = dateFromOffset(mon, 0);
    const [shifts, timeoffs] = await Promise.all([
      apiFetch(`/shifts?week=${weekStr}`, tk),
      apiFetch(`/timeoff?week=${weekStr}`, tk),
    ]);
    if (Array.isArray(shifts)) {
      setShiftsByWeek((prev) => ({
        ...prev,
        [offset]: shifts.map((s: ApiShift) => ({
          id: String(s.id), staffId: s.staffId, day: dayOffset(s.date, mon),
          start: parseTime(s.startTime), end: parseTime(s.endTime), role: s.role,
        })),
      }));
    }
    if (Array.isArray(timeoffs)) {
      setTimeOffByWeek((prev) => ({
        ...prev,
        [offset]: timeoffs.map((o: ApiTimeOff) => ({
          id: String(o.id), staffId: o.staffId, day: dayOffset(o.date, mon),
          reason: o.reason, status: o.status as "Pending" | "Approved",
        })),
      }));
    }
  }, []);

  // ─── Load staff portal data ─────────────────────────────────────────────────
  const loadPortal = useCallback(async (tk: string, mon: Date) => {
    const weekStr = dateFromOffset(mon, 0);
    const [shifts, timeoffs] = await Promise.all([
      apiFetch(`/staff/roster?week=${weekStr}`, tk),
      apiFetch(`/timeoff?week=${weekStr}`, tk),
    ]);
    if (Array.isArray(shifts)) {
      setPortalShifts(shifts.map((s: ApiShift) => ({
        id: String(s.id), staffId: s.staffId, day: dayOffset(s.date, mon),
        start: parseTime(s.startTime), end: parseTime(s.endTime), role: s.role,
      })));
    }
    if (Array.isArray(timeoffs)) {
      setPortalTimeOff(timeoffs.map((o: ApiTimeOff) => ({
        id: String(o.id), staffId: o.staffId, day: dayOffset(o.date, mon),
        reason: o.reason, status: o.status as "Pending" | "Approved",
      })));
    }
  }, []);

  useEffect(() => {
    if (!token || appView !== "manager") return;
    loadStaff(token);
  }, [token, appView, loadStaff]);

  useEffect(() => {
    if (!token || appView !== "manager") return;
    loadWeek(token, monday, weekOffset);
  }, [token, monday, weekOffset, appView, loadWeek]);

  useEffect(() => {
    if (!token || appView !== "staffPortal") return;
    loadPortal(token, portalMonday);
  }, [token, portalMonday, appView, loadPortal]);

  // ─── Load requests on tab switch ────────────────────────────────────────────
  useEffect(() => {
    if (!token || activeTab !== "requests" || requestsLoaded) return;
    apiFetch("/manager/requests", token).then((data) => {
      if (data.timeOff) { setRequests(data); setRequestsLoaded(true); }
    });
  }, [token, activeTab, requestsLoaded]);

  // ─── Load history on tab switch ─────────────────────────────────────────────
  useEffect(() => {
    if (!token || activeTab !== "history" || historyLoaded) return;
    apiFetch("/shifts/weeks", token).then((data) => {
      if (Array.isArray(data)) { setPastWeeks(data); setHistoryLoaded(true); }
    });
  }, [token, activeTab, historyLoaded]);

  const rosteredStaff = useMemo(() => {
    const ids = new Set(currentShifts.map((s) => s.staffId));
    return staff.filter((m) => m.canBeRostered && ids.has(m.id));
  }, [staff, currentShifts]);

  const billCount = rosteredStaff.length;
  const billTotal = (billCount * 0.96).toFixed(2);

  // ─── Open cell handler ──────────────────────────────────────────────────────
  function openCell(staffId: number, day: number) {
    const shift = currentShifts.find((s) => s.staffId === staffId && s.day === day);
    const off = currentTimeOff.find((o) => o.staffId === staffId && o.day === day);
    if (shift) {
      setModal({ kind: "shift", staffId, day, id: shift.id, mode: "shift", start: shift.start, end: shift.end, role: shift.role, reason: "", isNew: false });
    } else if (off) {
      setModal({ kind: "shift", staffId, day, id: off.id, mode: "off", start: 9, end: 17, role: "Floor", reason: off.reason, isNew: false });
    } else {
      setModal({ kind: "shift", staffId, day, id: null, mode: "shift", start: 9, end: 17, role: "Floor", reason: "", isNew: true });
    }
  }

  async function saveModal() {
    if (!modal || modal.kind !== "shift") return;
    if (modal.mode === "shift") {
      if (token) {
        const date = dateFromOffset(monday, modal.day);
        const res = await apiFetch("/shifts", token, {
          method: "POST",
          body: JSON.stringify({ staffId: modal.staffId, date, startTime: fmtTime(modal.start), endTime: fmtTime(modal.end), role: modal.role }),
        });
        if (res.id) {
          const s: Shift = { id: String(res.id), staffId: modal.staffId, day: modal.day, start: modal.start, end: modal.end, role: modal.role };
          setCurrentShifts((prev) => [...prev.filter((x) => !(x.staffId === modal.staffId && x.day === modal.day)), s]);
          setCurrentTimeOff((prev) => prev.filter((o) => !(o.staffId === modal.staffId && o.day === modal.day)));
        }
      } else {
        if (modal.isNew) {
          setCurrentShifts((prev) => [...prev, { id: generateId(), staffId: modal.staffId, day: modal.day, start: modal.start, end: modal.end, role: modal.role }]);
        } else {
          setCurrentShifts((prev) => prev.map((s) => s.id === modal.id ? { ...s, start: modal.start, end: modal.end, role: modal.role } : s));
        }
      }
    } else {
      if (token) {
        const date = dateFromOffset(monday, modal.day);
        const res = await apiFetch("/timeoff", token, {
          method: "POST",
          body: JSON.stringify({ staffId: modal.staffId, date, reason: modal.reason }),
        });
        if (res.id) {
          const o: TimeOff = { id: String(res.id), staffId: modal.staffId, day: modal.day, reason: modal.reason, status: "Pending" };
          setCurrentShifts((prev) => prev.filter((s) => !(s.staffId === modal.staffId && s.day === modal.day)));
          setCurrentTimeOff((prev) => [...prev.filter((x) => !(x.staffId === modal.staffId && x.day === modal.day)), o]);
        }
      } else {
        setCurrentShifts((prev) => prev.filter((s) => !(s.staffId === modal.staffId && s.day === modal.day)));
        if (modal.isNew) {
          setCurrentTimeOff((prev) => [...prev, { id: generateId(), staffId: modal.staffId, day: modal.day, reason: modal.reason, status: "Pending" }]);
        } else {
          setCurrentTimeOff((prev) => prev.map((o) => o.id === modal.id ? { ...o, reason: modal.reason } : o));
        }
      }
    }
    setModal(null);
    showToast("Saved");
  }

  async function deleteModal() {
    if (!modal || modal.kind !== "shift" || modal.isNew) return;
    if (token) {
      const endpoint = modal.mode === "shift" ? `/shifts/${modal.id}` : `/timeoff/${modal.id}`;
      await apiFetch(endpoint, token, { method: "DELETE" });
    }
    if (modal.mode === "shift") {
      setCurrentShifts((prev) => prev.filter((s) => s.id !== modal.id));
    } else {
      setCurrentTimeOff((prev) => prev.filter((o) => o.id !== modal.id));
    }
    setModal(null);
    showToast("Deleted");
  }

  // ─── CSV export ─────────────────────────────────────────────────────────────
  function exportCSV() {
    const rows = [["Staff", "Day", "Start", "End", "Role"]];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    currentShifts.forEach((s) => {
      const member = staff.find((m) => m.id === s.staffId);
      rows.push([member?.name ?? "", days[s.day], fmtTime(s.start), fmtTime(s.end), s.role]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${weekLabel.replace(/\s/g, "-")}.csv`;
    a.click();
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (loginType === "staff") {
        const res = await fetch(`${API}/staff-auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("smeasy_token", data.token);
          localStorage.setItem("smeasy_role", "staff");
          localStorage.setItem("smeasy_staff_name", data.name ?? "");
          setToken(data.token);
          setStaffDisplayName(data.name ?? "");
          setAppView("staffPortal");
        } else {
          setAuthError(data.error || "Login failed");
        }
      } else if (authMethod === "magic") {
        const res = await fetch(`${API}/auth/magic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail }),
        });
        const data = await res.json();
        if (data.ok) {
          setMagicSent(true);
        } else {
          setAuthError(data.error || "Failed to send link");
        }
      } else {
        const endpoint = authMode === "signup" ? "/auth/signup" : "/auth/login";
        const res = await fetch(`${API}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword, businessName: "My Business" }),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("smeasy_token", data.token);
          localStorage.setItem("smeasy_role", "manager");
          setToken(data.token);
          setAccountEmail(data.email ?? loginEmail);
          setBusinessName(data.businessName || "Smeasy");
          setAppView("manager");
        } else {
          setAuthError(data.error || "Login failed");
        }
      }
    } catch {
      setAuthError("Could not reach server");
    } finally {
      setAuthLoading(false);
    }
  }

  // ─── Staff management ────────────────────────────────────────────────────────
  async function addStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffName.trim() || !token) return;
    const res = await apiFetch("/staff", token, {
      method: "POST",
      body: JSON.stringify({ name: newStaffName.trim() }),
    });
    if (res.id) {
      setStaff((prev) => [...prev, { id: res.id, name: res.name, canManage: res.canManage, canBeRostered: res.canBeRostered, invited: !!res.email, inviteEmail: res.email || null }]);
    }
    setNewStaffName("");
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
    if (res.error) { showToast(res.error); return; }
    setStaff((prev) => prev.map((m) => m.id === inviteModal.staffId ? { ...m, invited: true, inviteEmail: inviteEmail } : m));
    setInviteModal(null);
    showToast(`Invite sent to ${inviteEmail}`);
  }

  async function approveTimeOff(id: string) {
    if (token) await apiFetch(`/timeoff/${id}`, token, { method: "PUT", body: JSON.stringify({ status: "Approved" }) });
    setCurrentTimeOff((prev) => prev.map((o) => o.id === id ? { ...o, status: "Approved" } : o));
    showToast("Time-off approved");
  }

  // ─── Request actions ─────────────────────────────────────────────────────────
  async function handleTimeOffRequest(id: number, action: "approve" | "deny") {
    if (!token) return;
    await apiFetch(`/manager/requests/timeoff/${id}/${action}`, token, { method: "POST" });
    setRequests((prev) => ({ ...prev, timeOff: prev.timeOff.filter((r) => r.id !== id) }));
    showToast(`Time-off ${action === "approve" ? "approved" : "denied"}`);
  }

  async function handleSwapRequest(id: number, action: "approve" | "deny") {
    if (!token) return;
    await apiFetch(`/manager/requests/swap/${id}/${action}`, token, { method: "POST" });
    setRequests((prev) => ({ ...prev, swaps: prev.swaps.filter((r) => r.id !== id) }));
    showToast(`Swap ${action === "approve" ? "approved" : "denied"}`);
  }

  // ─── Publish ─────────────────────────────────────────────────────────────────
  async function publishRoster() {
    setPublishLoading(true);
    if (token) {
      const weekStart = dateFromOffset(monday, 0);
      const res = await apiFetch("/publish", token, { method: "POST", body: JSON.stringify({ weekStart }) });
      const sent = (res.results as { sent: boolean }[] | undefined)?.filter((r) => r.sent).length ?? 0;
      setModal(null);
      showToast(`Roster published — ${sent} email${sent !== 1 ? "s" : ""} sent`);
    }
    setPublishLoading(false);
  }

  function handleLogout() {
    localStorage.removeItem("smeasy_token");
    localStorage.removeItem("smeasy_role");
    localStorage.removeItem("smeasy_staff_name");
    setToken(null);
    setStaff([]);
    setShiftsByWeek({});
    setTimeOffByWeek({});
    setPortalShifts([]);
    setPortalTimeOff([]);
    setRequests({ timeOff: [], swaps: [] });
    setRequestsLoaded(false);
    setPastWeeks([]);
    setHistoryLoaded(false);
    setAppView("login");
  }

  // ─── Login View ─────────────────────────────────────────────────────────────

  if (appView === "login") {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 28px", width: "100%", maxWidth: 360 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 5 }} />
            <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>Smeasy</span>
          </div>

          {/* Manager / Staff toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20, background: C.bg, borderRadius: 8, padding: 4 }}>
            {(["manager", "staff"] as LoginType[]).map((t) => (
              <button key={t} onClick={() => { setLoginType(t); setAuthError(null); setMagicSent(false); }}
                style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: loginType === t ? C.dark : "transparent", color: loginType === t ? C.white : C.secondary, transition: "all 0.15s" }}>
                {t === "manager" ? "Manager" : "Staff"}
              </button>
            ))}
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginBottom: 16, marginTop: 0 }}>
            {loginType === "manager" ? (authMode === "login" ? "Manager login" : "Create manager account") : "Staff login"}
          </h1>

          {loginType === "manager" && (
            <div style={{ display: "flex", gap: 6, marginBottom: 16, background: C.bg, borderRadius: 8, padding: 4 }}>
              {(["password", "magic"] as AuthMethod[]).map((m) => (
                <button key={m} onClick={() => { setAuthMethod(m); setAuthError(null); setMagicSent(false); }}
                  style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: authMethod === m ? C.white : "transparent", color: authMethod === m ? C.dark : C.muted, boxShadow: authMethod === m ? `0 0 0 1px ${C.border}` : "none" }}>
                  {m === "password" ? "Password" : "Magic link"}
                </button>
              ))}
            </div>
          )}

          {magicSent ? (
            <div style={{ background: "#f0f9e8", border: "1px solid #b7e021", borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.shiftColor, marginBottom: 4 }}>Check your email</div>
              <div style={{ fontSize: 13, color: C.secondary }}>We sent a login link to <strong>{loginEmail}</strong>. It expires in 15 minutes.</div>
              <button onClick={() => { setMagicSent(false); setAuthError(null); }} style={{ marginTop: 12, fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Email</label>
                <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }} />
              </div>
              {(loginType === "staff" || authMethod === "password") && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Password</label>
                  <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }} />
                </div>
              )}
              {authError && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{authError}</p>}
              <button type="submit" disabled={authLoading}
                style={{ width: "100%", padding: "11px 0", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: authLoading ? "default" : "pointer", opacity: authLoading ? 0.7 : 1 }}>
                {authLoading ? "…" : loginType === "staff" ? "Log in as staff" : authMethod === "magic" ? "Send magic link" : authMode === "login" ? "Log in" : "Create account"}
              </button>
            </form>
          )}

          {loginType === "manager" && !magicSent && authMethod === "password" && (
            <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 16, marginBottom: 0 }}>
              {authMode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(null); }}
                style={{ background: "none", border: "none", color: C.dark, fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 13 }}>
                {authMode === "login" ? "Sign up" : "Log in"}
              </button>
            </p>
          )}
          {loginType === "staff" && (
            <p style={{ textAlign: "center", fontSize: 12, color: C.muted, marginTop: 16, marginBottom: 0 }}>
              Use the email and password from your invite link.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ─── Staff Portal View ──────────────────────────────────────────────────────

  if (appView === "staffPortal") {
    const firstName = staffDisplayName.split(" ")[0] || "there";
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    async function submitPortalTimeOff(e: React.FormEvent) {
      e.preventDefault();
      if (!token || !portalTimeOffDate) return;
      const res = await apiFetch("/timeoff", token, {
        method: "POST",
        body: JSON.stringify({ date: portalTimeOffDate, reason: portalTimeOffReason }),
      });
      if (res.id) {
        const d = dayOffset(res.date ?? portalTimeOffDate, portalMonday);
        setPortalTimeOff((prev) => [...prev, { id: String(res.id), staffId: res.staffId, day: d, reason: res.reason, status: "Pending" }]);
        setPortalTimeOffReason("");
        showToast("Request submitted");
      } else {
        showToast(res.error || "Failed to submit");
      }
    }

    return (
      <div style={{ minHeight: "100vh", background: C.bg, paddingBottom: 40 }}>
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "0 16px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 24, height: 24, background: C.accent, borderRadius: 4 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.dark }}>Smeasy</div>
              <div style={{ fontSize: 11, color: C.muted }}>Hi {firstName}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => setPortalWeekOffset((w) => w - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark, padding: "2px 6px", lineHeight: 1 }}>‹</button>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.dark, minWidth: 130, textAlign: "center" }}>{portalWeekLabel}</span>
              <button onClick={() => setPortalWeekOffset((w) => w + 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark, padding: "2px 6px", lineHeight: 1 }}>›</button>
            </div>
            <button onClick={handleLogout} style={{ fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Log out</button>
          </div>
        </div>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 0, borderBottom: `1px solid ${C.border}` }}>
            {(["shifts", "timeoff"] as StaffPortalTab[]).map((t) => (
              <button key={t} onClick={() => setStaffPortalTab(t)}
                style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", border: `1px solid ${staffPortalTab === t ? C.border : "transparent"}`, borderBottom: staffPortalTab === t ? `1px solid ${C.white}` : "1px solid transparent", background: staffPortalTab === t ? C.white : "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", color: staffPortalTab === t ? C.dark : C.secondary, marginBottom: staffPortalTab === t ? -1 : 0 }}>
                {t === "shifts" ? "My shifts" : "Request time off"}
              </button>
            ))}
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: 20 }}>
            {staffPortalTab === "shifts" ? (
              portalShifts.length === 0 ? (
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>No shifts scheduled this week.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {portalShifts.map((s) => (
                    <div key={s.id} style={{ background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: C.shiftColor }}>{dayNames[s.day]} — {fmtTime(s.start)}–{fmtTime(s.end)}</div>
                      <div style={{ fontSize: 12, color: C.secondary, marginTop: 2 }}>{s.role}</div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div>
                <form onSubmit={submitPortalTimeOff} style={{ marginBottom: 20 }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Date</label>
                    <input type="date" value={portalTimeOffDate} onChange={(e) => setPortalTimeOffDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Reason</label>
                    <input type="text" value={portalTimeOffReason} onChange={(e) => setPortalTimeOffReason(e.target.value)} placeholder="e.g. Doctor appointment"
                      style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }} />
                  </div>
                  <button type="submit" style={{ padding: "9px 18px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Submit</button>
                </form>
                <div style={{ borderTop: `1px solid ${C.divider}`, paddingTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.dark, marginBottom: 10 }}>Your requests this week</div>
                  {portalTimeOff.length === 0 ? (
                    <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>No requests this week.</p>
                  ) : (
                    portalTimeOff.map((o) => (
                      <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.divider}` }}>
                        <span style={{ fontSize: 13, color: C.dark }}>{dayNames[o.day]} — {o.reason}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: o.status === "Approved" ? "#e6f4ea" : "#fff3e0", color: o.status === "Approved" ? "#1a6b2f" : C.offColor }}>{o.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {toast && <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: C.dark, color: C.white, padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, zIndex: 9999 }}>{toast}</div>}
      </div>
    );
  }

  // ─── Manager View ───────────────────────────────────────────────────────────

  const rosterable = staff.filter((m) => m.canBeRostered);
  const warnings = modal && modal.kind === "shift" && modal.mode === "shift"
    ? computeWarnings(currentShifts, modal.staffId, modal.day, modal.start, modal.end, modal.id)
    : [];
  const pendingCount = requests.timeOff.length + requests.swaps.length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      {/* Header */}
      <div style={{ height: 58, background: C.white, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ display: "block", width: 28, height: 28, background: C.accent, borderRadius: 5, textDecoration: "none", flexShrink: 0 }} />
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.dark, margin: 0 }}>Smeasy Rostering</h1>
        </div>
        {activeTab === "roster" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setWeekOffset((w) => w - 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark, padding: "4px 8px", lineHeight: 1 }}>‹</button>
            <span style={{ minWidth: 150, textAlign: "center", fontSize: 13, fontWeight: 600, color: C.dark }}>{weekLabel}</span>
            <button onClick={() => setWeekOffset((w) => w + 1)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.dark, padding: "4px 8px", lineHeight: 1 }}>›</button>
          </div>
        )}
      </div>

      {/* Tabs bar */}
      <div style={{ background: C.bg, padding: "0 24px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2 }}>
          {(["roster", "staff", "requests", "history", "billing"] as ActiveTab[]).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: "10px 14px", border: activeTab === t ? `1px solid ${C.border}` : "1px solid transparent", borderBottom: activeTab === t ? `1px solid ${C.white}` : "1px solid transparent", borderRadius: "8px 8px 0 0", background: activeTab === t ? C.white : "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", color: activeTab === t ? C.dark : C.secondary, marginBottom: activeTab === t ? -1 : 0, position: "relative" }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "requests" && pendingCount > 0 && !requestsLoaded && (
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, background: C.danger, color: C.white, borderRadius: 10, padding: "1px 6px" }}>{pendingCount}</span>
              )}
              {t === "requests" && requestsLoaded && (requests.timeOff.length + requests.swaps.length) > 0 && (
                <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, background: C.danger, color: C.white, borderRadius: 10, padding: "1px 6px" }}>{requests.timeOff.length + requests.swaps.length}</span>
              )}
            </button>
          ))}
          <div style={{ width: 1, height: 22, background: C.border, margin: "0 6px 4px" }} />
          {(["business", "account"] as ActiveTab[]).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: "10px 14px", border: activeTab === t ? `1px solid ${C.border}` : "1px solid transparent", borderBottom: activeTab === t ? `1px solid ${C.white}` : "1px solid transparent", borderRadius: "8px 8px 0 0", background: activeTab === t ? C.white : "transparent", fontSize: 13, fontWeight: 600, cursor: "pointer", color: activeTab === t ? C.dark : C.secondary, marginBottom: activeTab === t ? -1 : 0 }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>

        {/* ── Roster Tab ── */}
        {activeTab === "roster" && (
          <div>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div style={{ fontSize: 14, color: C.dark }}>
                This week: <strong>{billCount} staff rostered</strong> × 96c = <strong>${billTotal}</strong>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setModal({ kind: "publish" })} style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Publish &amp; Notify
                </button>
                <button onClick={exportCSV} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Export CSV
                </button>
              </div>
            </div>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <div style={{ minWidth: 820 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "150px repeat(7, 1fr) 64px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ padding: "8px 12px", fontSize: 12, fontWeight: 700, color: C.muted }}>Staff</div>
                    {weekDates.map((d, i) => {
                      const label = fmtDayHeader(d);
                      const parts = label.split(" ");
                      return (
                        <div key={i} style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>
                          {parts[0]}<br /><span style={{ fontWeight: 400, color: C.muted }}>{parts[1]}</span>
                        </div>
                      );
                    })}
                    <div style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>Hrs</div>
                  </div>
                  {rosterable.map((member) => {
                    const memberShifts = currentShifts.filter((s) => s.staffId === member.id);
                    const totalHrs = memberShifts.reduce((sum, s) => sum + (s.end - s.start), 0);
                    return (
                      <div key={member.id} style={{ display: "grid", gridTemplateColumns: "150px repeat(7, 1fr) 64px", borderBottom: `1px solid ${C.divider}` }}>
                        <div style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600, color: C.dark, display: "flex", alignItems: "center" }}>{member.name}</div>
                        {Array.from({ length: 7 }, (_, day) => {
                          const shift = memberShifts.find((s) => s.day === day);
                          const off = currentTimeOff.find((o) => o.staffId === member.id && o.day === day);
                          let bg = "transparent", border = "1px dashed #d8d3c4", color = "#c2bcaa", label = "+";
                          if (shift) { bg = C.shiftBg; border = `1px solid ${C.shiftBorder}`; color = C.shiftColor; label = `${fmtTime(shift.start)}–${fmtTime(shift.end)}`; }
                          else if (off) { bg = C.offBg; border = `1px solid ${C.offBorderStrong}`; color = C.offColor; label = off.status === "Approved" ? "Off" : "Off (req)"; }
                          return (
                            <div key={day} onClick={() => openCell(member.id, day)} style={{ padding: "8px 6px", minHeight: 44, borderLeft: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                              <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", padding: "5px 4px", borderRadius: 6, width: "100%", background: bg, border, color }}>{label}</div>
                            </div>
                          );
                        })}
                        <div style={{ padding: "10px 6px", fontSize: 13, fontWeight: 700, color: C.dark, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${C.divider}` }}>
                          {totalHrs > 0 ? `${totalHrs}h` : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12, fontSize: 12, color: C.muted }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 14, height: 14, background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 3 }} />Shift</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 14, height: 14, background: C.offBg, border: `1px solid ${C.offBorderStrong}`, borderRadius: 3 }} />Time-off</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 14, height: 14, background: "transparent", border: "1px dashed #d8d3c4", borderRadius: 3 }} />Click to add shift</div>
            </div>

            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginTop: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 12 }}>Time-off requests</div>
              {currentTimeOff.length === 0 ? (
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>No requests this week.</p>
              ) : (
                currentTimeOff.map((o) => {
                  const member = staff.find((m) => m.id === o.staffId);
                  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
                  return (
                    <div key={o.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.divider}` }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>{member?.name}</span>
                        <span style={{ fontSize: 13, color: C.secondary }}> · {dayNames[o.day]} · {o.reason}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: o.status === "Approved" ? "#e6f4ea" : "#fff3e0", color: o.status === "Approved" ? "#1a6b2f" : C.offColor }}>{o.status}</span>
                        {o.status === "Pending" && (
                          <button onClick={() => approveTimeOff(o.id)} style={{ padding: "4px 10px", background: C.dark, color: C.white, border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Staff Tab ── */}
        {activeTab === "staff" && (
          <div style={{ maxWidth: 680 }}>
            <p style={{ fontSize: 14, color: C.secondary, marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>
              Two independent flags per person — someone can manage the roster, be rostered, both, or neither. Invite anyone to a view-only login for their own shifts.
            </p>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {staff.map((member, idx) => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderBottom: idx < staff.length - 1 ? `1px solid ${C.divider}` : "none", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, minWidth: 140 }}>{member.name}</div>
                  <div style={{ display: "flex", gap: 16, flex: 1 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.secondary, cursor: "pointer" }}>
                      <input type="checkbox" checked={member.canManage} onChange={(e) => setStaff((prev) => prev.map((m) => m.id === member.id ? { ...m, canManage: e.target.checked } : m))} style={{ accentColor: C.dark, width: 15, height: 15 }} />
                      Can manage
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.secondary, cursor: "pointer" }}>
                      <input type="checkbox" checked={member.canBeRostered} onChange={(e) => setStaff((prev) => prev.map((m) => m.id === member.id ? { ...m, canBeRostered: e.target.checked } : m))} style={{ accentColor: C.dark, width: 15, height: 15 }} />
                      Can be rostered
                    </label>
                  </div>
                  <div>
                    {member.invited ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#1a6b2f", background: "#e6f4ea", padding: "2px 8px", borderRadius: 10 }}>Invited ✓</span>
                    ) : (
                      <button onClick={() => openInviteModal(member.id, member.name)} style={{ fontSize: 12, padding: "5px 12px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 7, cursor: "pointer", fontWeight: 600 }}>
                        Invite to view their roster
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={addStaff} style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <input type="text" value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="New staff name"
                style={{ flex: 1, padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white }} />
              <button type="submit" style={{ padding: "9px 18px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
            </form>
          </div>
        )}

        {/* ── Requests Tab ── */}
        {activeTab === "requests" && (
          <div style={{ maxWidth: 680 }}>
            {!requestsLoaded ? (
              <p style={{ color: C.muted, fontSize: 14 }}>Loading…</p>
            ) : requests.timeOff.length === 0 && requests.swaps.length === 0 ? (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>No pending requests.</p>
              </div>
            ) : (
              <>
                {requests.timeOff.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Time-off requests</div>
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                      {requests.timeOff.map((r, idx) => {
                        const dateStr = new Date(r.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
                        return (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < requests.timeOff.length - 1 ? `1px solid ${C.divider}` : "none", flexWrap: "wrap", gap: 10 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{r.staff.name}</div>
                              <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>{dateStr} · {r.type}{r.reason ? ` — ${r.reason}` : ""}</div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleTimeOffRequest(r.id, "deny")} style={{ padding: "6px 14px", background: C.white, color: C.danger, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Deny</button>
                              <button onClick={() => handleTimeOffRequest(r.id, "approve")} style={{ padding: "6px 14px", background: C.dark, color: C.white, border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {requests.swaps.length > 0 && (
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Swap requests</div>
                    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                      {requests.swaps.map((r, idx) => {
                        const fromDate = new Date(r.fromShift.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
                        const toDate = r.toShift ? new Date(r.toShift.date).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" }) : null;
                        return (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < requests.swaps.length - 1 ? `1px solid ${C.divider}` : "none", flexWrap: "wrap", gap: 10 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>{r.fromStaff.name} → {r.toStaff.name}</div>
                              <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>
                                {fromDate} {r.fromShift.startTime}–{r.fromShift.endTime}
                                {toDate ? ` ↔ ${toDate} ${r.toShift!.startTime}–${r.toShift!.endTime}` : ""}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => handleSwapRequest(r.id, "deny")} style={{ padding: "6px 14px", background: C.white, color: C.danger, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Deny</button>
                              <button onClick={() => handleSwapRequest(r.id, "approve")} style={{ padding: "6px 14px", background: C.dark, color: C.white, border: "none", borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Approve</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <div style={{ maxWidth: 680 }}>
            {!historyLoaded ? (
              <p style={{ color: C.muted, fontSize: 14 }}>Loading…</p>
            ) : pastWeeks.length === 0 ? (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "32px 24px", textAlign: "center" }}>
                <p style={{ color: C.muted, fontSize: 14, margin: 0 }}>No past rosters yet.</p>
              </div>
            ) : (
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px auto", background: C.bg, borderBottom: `1px solid ${C.border}`, padding: "8px 20px", gap: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>WEEK</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center" }}>STAFF</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center" }}>SHIFTS</div>
                  <div />
                </div>
                {pastWeeks.map((w, idx) => {
                  const [y, m, d] = w.weekStart.split("-").map(Number);
                  const offset = Math.round((new Date(y, m - 1, d).getTime() - baseMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
                  const isPast = offset < 0;
                  return (
                    <div key={w.weekStart} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px auto", alignItems: "center", padding: "12px 20px", borderBottom: idx < pastWeeks.length - 1 ? `1px solid ${C.divider}` : "none", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{fmtWeekLabelFromStr(w.weekStart)}</div>
                        {!isPast && <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginTop: 2 }}>Current / future</div>}
                      </div>
                      <div style={{ fontSize: 13, color: C.secondary, textAlign: "center" }}>{w.staffCount}</div>
                      <div style={{ fontSize: 13, color: C.secondary, textAlign: "center" }}>{w.shiftCount}</div>
                      <button
                        onClick={() => { setWeekOffset(offset); setActiveTab("roster"); }}
                        style={{ padding: "5px 12px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Billing Tab ── */}
        {activeTab === "billing" && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" }}>
              <p style={{ fontSize: 14, color: C.secondary, marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>
                You only pay for staff rostered that week — quiet weeks cost less, and managers are always free.
              </p>
              {staff.map((member) => {
                const isRostered = currentShifts.some((s) => s.staffId === member.id);
                const tag = member.canManage && !member.canBeRostered ? "manager" : isRostered ? "rostered" : "not rostered";
                const amount = isRostered && member.canBeRostered ? "$0.96" : "$0.00";
                return (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.divider}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: C.dark }}>{member.name}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 10, background: tag === "rostered" ? C.shiftBg : tag === "manager" ? "#f0edff" : C.bg, color: tag === "rostered" ? C.shiftColor : tag === "manager" ? "#5b21b6" : C.muted, border: `1px solid ${tag === "rostered" ? C.shiftBorder : tag === "manager" ? "#c4b5fd" : C.border}` }}>{tag}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.dark }}>{amount}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: `2px solid ${C.border}` }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>{billCount} staff rostered × 96c</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>${billTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Business Tab ── */}
        {activeTab === "business" && (
          <div style={{ maxWidth: 560 }}>
            <p style={{ fontSize: 14, color: C.secondary, marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>Tools connected to your Smeasy account.</p>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.divider}` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>Rostering</div>
                  <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>Weekly shift grid, time-off, publish &amp; notify.</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 10, background: "#e6f4ea", color: "#1a6b2f", border: "1px solid #b7dfbf" }}>Active</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ border: `2px dashed ${C.border}`, borderRadius: 10, padding: "16px 20px" }}>
                  <p style={{ fontSize: 13, color: C.muted, textAlign: "center", margin: 0 }}>More Smeasy tools will appear here as you add them.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Account Tab ── */}
        {activeTab === "account" && (
          <div style={{ maxWidth: 480 }}>
            <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "24px 24px" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.dark, marginBottom: 6 }}>Your Smeasy account</div>
              <p style={{ fontSize: 13, color: C.secondary, marginBottom: 20, lineHeight: 1.6, marginTop: 0 }}>
                This is your billing home. Manage your subscription, update payment, and download invoices.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Email</label>
                <input type="email" value={accountEmail} readOnly style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.bg, boxSizing: "border-box" }} />
              </div>
              <button onClick={handleLogout} style={{ padding: "9px 18px", background: C.white, color: C.danger, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Log out</button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Shift / Time-off Modal ─────────────────────────────────────────── */}
      {modal && modal.kind === "shift" && (() => {
        const member = staff.find((m) => m.id === modal.staffId);
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
            <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>{member?.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{dayNames[modal.day]} · {weekLabel}</div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 18, background: C.bg, borderRadius: 8, padding: 4 }}>
                <button onClick={() => setModal({ ...modal, mode: "shift" })} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: modal.mode === "shift" ? C.dark : "transparent", color: modal.mode === "shift" ? C.white : C.secondary }}>Shift</button>
                <button onClick={() => setModal({ ...modal, mode: "off" })} style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: modal.mode === "off" ? C.dark : "transparent", color: modal.mode === "off" ? C.white : C.secondary }}>Time-off</button>
              </div>
              {modal.mode === "shift" ? (
                <div>
                  <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>Start (24h)</label>
                      <input type="number" step={0.5} min={0} max={24} value={modal.start} onChange={(e) => setModal({ ...modal, start: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>End (24h)</label>
                      <input type="number" step={0.5} min={0} max={24} value={modal.end} onChange={(e) => setModal({ ...modal, end: Number(e.target.value) })}
                        style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, boxSizing: "border-box" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>Role</label>
                    <select value={modal.role} onChange={(e) => setModal({ ...modal, role: e.target.value })}
                      style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }}>
                      {["Floor", "Kitchen", "Barista", "Manager"].map((r) => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  {warnings.length > 0 && (
                    <div style={{ background: "#fff8ec", border: "1px solid #f0c850", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                      {warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: "#7a4f00", marginBottom: i < warnings.length - 1 ? 4 : 0 }}>⚠ {w}</div>)}
                      <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>A rough check, not a compliance guarantee.</div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 4 }}>Reason</label>
                  <input type="text" value={modal.reason} onChange={(e) => setModal({ ...modal, reason: e.target.value })} placeholder="e.g. Doctor appointment"
                    style={{ width: "100%", padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, boxSizing: "border-box" }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                {!modal.isNew && <button onClick={deleteModal} style={{ padding: "8px 14px", background: "none", color: C.danger, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Delete</button>}
                <div style={{ flex: 1 }} />
                <button onClick={() => setModal(null)} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveModal} style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── Publish Modal ── */}
      {modal && modal.kind === "publish" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.dark, marginBottom: 4 }}>Publish &amp; Notify</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{weekLabel}</div>
            <div style={{ maxHeight: 240, overflowY: "auto", borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 20 }}>
              {rosteredStaff.length === 0 ? (
                <p style={{ padding: 16, fontSize: 13, color: C.muted, margin: 0 }}>No staff rostered this week.</p>
              ) : rosteredStaff.map((member) => {
                const hrs = currentShifts.filter((s) => s.staffId === member.id).reduce((sum, s) => sum + (s.end - s.start), 0);
                return (
                  <div key={member.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${C.divider}` }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{member.name}</span>
                    <span style={{ fontSize: 13, color: C.secondary }}>{hrs}h</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setModal(null)} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={publishRoster} disabled={publishLoading} style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: publishLoading ? "default" : "pointer", opacity: publishLoading ? 0.7 : 1 }}>
                {publishLoading ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Invite Modal ── */}
      {inviteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
          <div style={{ background: C.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.dark, marginBottom: 6 }}>Invite {inviteModal.staffName}</div>
            <p style={{ fontSize: 13, color: C.secondary, marginBottom: 16, lineHeight: 1.5, marginTop: 0 }}>
              They&apos;ll get an email with a link to set their password and view their shifts.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Staff email</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@example.com"
                style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setInviteModal(null)} style={{ padding: "8px 16px", background: C.white, color: C.dark, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={sendInvite} style={{ padding: "8px 16px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Send invite</button>
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
