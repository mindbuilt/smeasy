"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";

// ── Design tokens ────────────────────────────────────────────────────────────

const S = {
  bg: "#f6f4ef",
  dark: "#1f1d19",
  body: "#4a463c",
  secondary: "#6b6558",
  muted: "#8a8474",
  border: "#e5e1d6",
  accent: "#cdf564",
  darkGreen: "#20321a",
  white: "#ffffff",
};

// ── Constants ────────────────────────────────────────────────────────────────

const STAFF = [
  { id: "priya", name: "Priya H.", role: "Barista" },
  { id: "jack", name: "Jack O.", role: "Supervisor" },
  { id: "mia", name: "Mia T.", role: "Barista" },
  { id: "tom", name: "Tom R.", role: "Kitchen" },
  { id: "sarah", name: "Sarah K.", role: "Floor" },
  { id: "liam", name: "Liam N.", role: "Kitchen" },
];

const SHIFT_OPTIONS = [
  { value: "7-3", label: "7am – 3pm" },
  { value: "8-4", label: "8am – 4pm" },
  { value: "9-5", label: "9am – 5pm" },
  { value: "10-6", label: "10am – 6pm" },
  { value: "11-7", label: "11am – 7pm" },
  { value: "12-8", label: "12pm – 8pm" },
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STORAGE_KEY = "smeasy-roster";

// ── Date helpers ─────────────────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() - (day === 0 ? 6 : day - 1));
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtDayHeader(d: Date): string {
  return `${DAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()}`;
}

function fmtWeekLabel(monday: Date): string {
  const end = addDays(monday, 6);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  if (monday.getMonth() === end.getMonth())
    return `${monday.getDate()}–${end.getDate()} ${months[monday.getMonth()]} ${monday.getFullYear()}`;
  return `${monday.getDate()} ${months[monday.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`;
}

// ── Seed schedule (sample data for current week) ─────────────────────────────

function buildSeed(monday: Date): Record<string, string> {
  const s: Record<string, string> = {};
  const add = (staffId: string, dayOffsets: number[], value: string) => {
    for (const d of dayOffsets) s[`${staffId}-${toDateStr(addDays(monday, d))}`] = value;
  };
  add("priya", [0,1,3,4], "shift:7-3");  add("priya", [5], "off");
  add("jack",  [1,2,3], "shift:9-5");    add("jack",  [5,6], "shift:10-6");
  add("mia",   [0,3,4], "shift:12-8");   add("mia",   [1,2], "off");
  add("tom",   [0,1,2], "shift:7-3");    add("tom",   [5,6], "shift:8-4");
  add("sarah", [2,3,4], "shift:9-5");
  add("liam",  [0], "off");              add("liam",  [1,2,3,4], "shift:7-3");
  return s;
}

// ── Cell helpers ─────────────────────────────────────────────────────────────

function cellKind(val: string | undefined): "shift" | "off" | "empty" {
  if (!val) return "empty";
  if (val === "off") return "off";
  return "shift";
}

function cellLabel(val: string | undefined): string {
  if (!val) return "+";
  if (val === "off") return "Off";
  return val.split(":")[1] ?? val;
}

function cellStyle(kind: "shift" | "off" | "empty"): React.CSSProperties {
  const base: React.CSSProperties = {
    height: 44, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  };
  if (kind === "shift") return { ...base, background: "#eef3dc", border: "1px solid #cdd9a8", color: "#3a5518" };
  if (kind === "off")   return { ...base, background: "#f7e4d3", border: "1px solid #e8c7a8", color: "#a3651f" };
  return { ...base, background: "transparent", border: "1px dashed #d6d1c3", color: "#a89f8c" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Schedule = Record<string, string>;
interface ModalState { staffId: string; staffName: string; date: Date; dayLabel: string; }

// ── Main component ────────────────────────────────────────────────────────────

export default function RosterPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [modal, setModal] = useState<ModalState | null>(null);
  const [modalTime, setModalTime] = useState("9-5");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const baseMonday = useMemo(() => getMonday(new Date()), []);
  const monday = useMemo(() => addDays(baseMonday, weekOffset * 7), [baseMonday, weekOffset]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(monday, i)), [monday]);

  // Load or seed on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSchedule(JSON.parse(stored));
      } else {
        const seed = buildSeed(baseMonday);
        setSchedule(seed);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      }
    } catch {}
  }, [baseMonday]);

  function saveSchedule(next: Schedule) {
    setSchedule(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }

  function handleCellClick(staffId: string, staffName: string, date: Date, dayLabel: string) {
    const key = `${staffId}-${toDateStr(date)}`;
    const existing = schedule[key];
    if (!existing) {
      setModal({ staffId, staffName, date, dayLabel });
      setModalTime("9-5");
    } else {
      // Click existing cell to clear it
      const next = { ...schedule };
      delete next[key];
      saveSchedule(next);
    }
  }

  function confirmAddShift() {
    if (!modal) return;
    const next = { ...schedule, [`${modal.staffId}-${toDateStr(modal.date)}`]: `shift:${modalTime}` };
    saveSchedule(next);
    setModal(null);
    showToast("Shift added");
  }

  function confirmTimeOff() {
    if (!modal) return;
    const next = { ...schedule, [`${modal.staffId}-${toDateStr(modal.date)}`]: "off" };
    saveSchedule(next);
    setModal(null);
    showToast("Time off marked");
  }

  function weekHours(staffId: string): number {
    return weekDates.reduce((sum, d) => {
      const v = schedule[`${staffId}-${toDateStr(d)}`];
      return sum + (v?.startsWith("shift:") ? 8 : 0);
    }, 0);
  }

  function handleExport() {
    const rows = ["Name,Role,Date,Day,Start,End,Hours"];
    for (const member of STAFF) {
      for (let i = 0; i < 7; i++) {
        const d = weekDates[i];
        const v = schedule[`${member.id}-${toDateStr(d)}`];
        if (v?.startsWith("shift:")) {
          const [sh, eh] = v.split(":")[1].split("-").map(Number);
          rows.push(`"${member.name}","${member.role}",${toDateStr(d)},${DAY_NAMES[i]},${sh.toString().padStart(2,"0")}:00,${eh.toString().padStart(2,"0")}:00,8`);
        }
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${toDateStr(monday)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Roster exported to CSV");
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: S.dark }}>

      {/* Header nav */}
      <div style={{ height: 58, display: "flex", alignItems: "center", padding: "0 24px", background: S.white, borderBottom: `1px solid ${S.border}` }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: S.dark }}>
          <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.01em" }}>smeasy</span>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 2, background: S.accent }} />
        </Link>
      </div>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Title + controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em", margin: 0 }}>Rostering</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Week nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 2, background: S.white, border: `1px solid ${S.border}`, borderRadius: 8, padding: 2 }}>
              <button
                onClick={() => setWeekOffset(o => o - 1)}
                style={{ width: 30, height: 30, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", fontSize: 13, color: S.body, fontFamily: "inherit" }}
              >◀</button>
              <span style={{ fontSize: 13, fontWeight: 600, padding: "0 8px", whiteSpace: "nowrap" }}>{fmtWeekLabel(monday)}</span>
              <button
                onClick={() => setWeekOffset(o => o + 1)}
                style={{ width: 30, height: 30, border: "none", background: "transparent", borderRadius: 6, cursor: "pointer", fontSize: 13, color: S.body, fontFamily: "inherit" }}
              >▶</button>
            </div>
            <button
              onClick={handleExport}
              style={{ padding: "9px 16px", borderRadius: 8, border: `1px solid ${S.border}`, background: S.white, fontSize: 13.5, fontWeight: 600, color: S.dark, cursor: "pointer", fontFamily: "inherit" }}
            >
              Export CSV
            </button>
            <button
              onClick={() => showToast("Roster published — team notified")}
              style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: S.accent, fontSize: 13.5, fontWeight: 600, color: S.darkGreen, cursor: "pointer", fontFamily: "inherit" }}
            >
              Publish &amp; Notify
            </button>
          </div>
        </div>

        {/* Roster grid */}
        <div style={{ background: S.white, border: `1px solid ${S.border}`, borderRadius: 14, padding: 8, overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>

            {/* Day header row */}
            <div style={{ display: "grid", gridTemplateColumns: "140px repeat(7, 1fr) 60px", gap: 6, padding: "10px 8px 12px" }}>
              <span />
              {weekDates.map((d, i) => (
                <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>
                  {fmtDayHeader(d)}
                </span>
              ))}
              <span style={{ fontSize: 11.5, fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "center" }}>Hrs</span>
            </div>

            {/* Staff rows */}
            {STAFF.map(member => (
              <div key={member.id} style={{ display: "grid", gridTemplateColumns: "140px repeat(7, 1fr) 60px", gap: 6, padding: "4px 8px", alignItems: "center" }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, padding: "8px 10px", background: S.bg, borderRadius: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {member.name}
                </div>
                {weekDates.map((date, di) => {
                  const val = schedule[`${member.id}-${toDateStr(date)}`];
                  const kind = cellKind(val);
                  return (
                    <div
                      key={di}
                      onClick={() => handleCellClick(member.id, member.name, date, fmtDayHeader(date))}
                      style={cellStyle(kind)}
                    >
                      {cellLabel(val)}
                    </div>
                  );
                })}
                <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center", color: S.body }}>
                  {weekHours(member.id)}h
                </div>
              </div>
            ))}

          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: S.secondary }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: "#eef3dc", border: "1px solid #cdd9a8", display: "inline-block", flexShrink: 0 }} />
            Shift — click to remove
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: S.secondary }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: "#f7e4d3", border: "1px solid #e8c7a8", display: "inline-block", flexShrink: 0 }} />
            Time off — click to clear
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: S.secondary }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, border: "1px dashed #d6d1c3", display: "inline-block", flexShrink: 0 }} />
            Unscheduled — click to add
          </div>
        </div>

      </div>

      {/* Add shift modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(31,29,25,0.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: S.white, borderRadius: 14, padding: 24, width: "100%", maxWidth: 340 }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Add shift</div>
            <div style={{ fontSize: 13, color: S.secondary, marginBottom: 18 }}>
              {modal.staffName} · {modal.dayLabel}
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: S.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Time
            </div>
            <select
              value={modalTime}
              onChange={e => setModalTime(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${S.border}`, fontSize: 13.5, background: S.bg, color: S.dark, marginBottom: 20, fontFamily: "inherit" }}
            >
              {SHIFT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <button
                onClick={() => setModal(null)}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: `1px solid ${S.border}`, background: S.white, fontSize: 13.5, fontWeight: 600, color: S.dark, cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmAddShift}
                style={{ flex: 1, padding: 11, borderRadius: 8, border: "none", background: S.accent, fontSize: 13.5, fontWeight: 600, color: S.darkGreen, cursor: "pointer", fontFamily: "inherit" }}
              >
                Add shift
              </button>
            </div>
            <button
              onClick={confirmTimeOff}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #e8c7a8", background: "#f7e4d3", fontSize: 13.5, fontWeight: 600, color: "#a3651f", cursor: "pointer", fontFamily: "inherit" }}
            >
              Mark as time off instead
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 26, left: "50%", transform: "translateX(-50%)", background: "#20321a", color: "#f6f4ef", padding: "12px 20px", borderRadius: 10, fontSize: 13.5, fontWeight: 500, zIndex: 60, whiteSpace: "nowrap", animation: "smtoast 2.4s ease forwards" }}>
          {toast}
        </div>
      )}

    </div>
  );
}
