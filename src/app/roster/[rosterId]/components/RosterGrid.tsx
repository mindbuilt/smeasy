"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { C, DAY_NAMES, MONTHS } from "./tokens";
import { StaffMember, Shift, TimeOff } from "./types";
import { toDateOnly } from "@/lib/dateUtils";

interface Props {
  weekDates: string[];
  rosterableStaff: StaffMember[];
  shifts: Shift[];
  timeOffs: TimeOff[];
  onCellClick: (member: StaffMember, date: string) => void;
  onStaffClick?: (member: StaffMember) => void;
}

function parseHours(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

function fmtDayHeader(dateStr: string): { name: string; num: number } {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  const idx = dt.getDay();
  return { name: DAY_NAMES[idx === 0 ? 6 : idx - 1], num: d };
}

function fmtDayFull(dateStr: string): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, mo - 1, d);
  const idx = dt.getDay();
  return `${DAY_NAMES[idx === 0 ? 6 : idx - 1]} ${d} ${MONTHS[mo - 1]}`;
}

// ── Desktop grid ──────────────────────────────────────────────────────────────

function GridCell({ member, dateStr, shiftMap, timeOffMap, onCellClick }: {
  member: StaffMember; dateStr: string;
  shiftMap: Record<string, Shift>; timeOffMap: Record<string, TimeOff>;
  onCellClick: (member: StaffMember, date: string) => void;
}) {
  const key = `${member.id}-${dateStr}`;
  const shift = shiftMap[key];
  const off = timeOffMap[key];
  const isEmpty = !shift && !off;

  let bg = "transparent", border = `1px dashed #d8d3c4`, color = C.mutedFaint, label = "+";
  if (shift) {
    bg = C.shiftBg; border = `1px solid ${C.shiftBorder}`; color = C.shiftText;
    label = `${shift.startTime}–${shift.endTime}`;
  } else if (off) {
    bg = C.offBg; border = `1px solid ${C.offBorder}`; color = C.offText;
    label = off.status === "Approved" ? "Off" : "Off (req)";
  }

  return (
    <div
      onClick={() => onCellClick(member, dateStr)}
      style={{ padding: "6px 4px", minHeight: 48, borderLeft: `1px solid ${C.divider}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isEmpty ? C.hoverBg : "transparent", transition: "background 0.15s", "&:hover": isEmpty ? { background: C.hoverBg } : {} }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", padding: "5px 6px", borderRadius: 10, width: "100%", background: bg, border, color }}>
        {label}
      </div>
    </div>
  );
}

function DesktopGrid({ weekDates, rosterableStaff, shifts, timeOffs, onCellClick, onStaffClick }: Props) {
  const shiftMap = useMemo(() => {
    const map: Record<string, Shift> = {};
    shifts.forEach(s => {
      const key = `${s.staffId}-${toDateOnly(s.date)}`;
      map[key] = s;
    });
    return map;
  }, [shifts]);

  const timeOffMap = useMemo(() => {
    const map: Record<string, TimeOff> = {};
    timeOffs.forEach(o => {
      const key = `${o.staffId}-${toDateOnly(o.date)}`;
      map[key] = o;
    });
    return map;
  }, [timeOffs]);

  const staffHoursMap = useMemo(() => {
    const map: Record<number, number> = {};
    shifts.forEach(s => {
      if (!map[s.staffId]) map[s.staffId] = 0;
      map[s.staffId] += parseHours(s.endTime) - parseHours(s.startTime);
    });
    return map;
  }, [shifts]);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 780 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "150px repeat(7, 1fr) 64px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ padding: "8px 12px", fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Staff</div>
          {weekDates.map((dateStr, i) => {
            const { name, num } = fmtDayHeader(dateStr);
            return (
              <div key={i} style={{ padding: "8px 6px", textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>{name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{num}</div>
              </div>
            );
          })}
          <div style={{ padding: "8px 6px", fontSize: 11, fontWeight: 700, color: C.muted, textAlign: "center", borderLeft: `1px solid ${C.divider}` }}>Hrs</div>
        </div>

        {/* Rows */}
        {rosterableStaff.length === 0 ? (
          <div style={{ padding: "32px 20px", textAlign: "center" }}>
            <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>
              No rostered staff. Enable &quot;Can be rostered&quot; in{" "}
              <Link href="/rostering" style={{ color: C.dark }}>Staff settings</Link>.
            </p>
          </div>
        ) : (
          rosterableStaff.map((member) => {
            const totalHrs = staffHoursMap[member.id] ?? 0;
            return (
              <div key={member.id} style={{ display: "grid", gridTemplateColumns: "150px repeat(7, 1fr) 64px", borderBottom: `1px solid ${C.divider}` }}>
                <div style={{ padding: "10px 12px", display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => onStaffClick?.(member)}
                    style={{ background: "none", border: "none", padding: 0, cursor: onStaffClick ? "pointer" : "default", fontSize: 13, fontWeight: 600, color: C.dark, textAlign: "left", textDecoration: onStaffClick ? "underline" : "none", textDecorationColor: C.border }}
                  >
                    {member.name}
                  </button>
                </div>
                {weekDates.map((dateStr) => (
                  <GridCell key={dateStr} member={member} dateStr={dateStr} shiftMap={shiftMap} timeOffMap={timeOffMap} onCellClick={onCellClick} />
                ))}
                <div style={{ padding: "10px 6px", fontSize: 13, fontWeight: 600, color: C.dark, display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid ${C.divider}` }}>
                  {totalHrs > 0 ? `${totalHrs.toFixed(1)}` : "—"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Mobile card view (one card per day) ───────────────────────────────────────

function MobileView({ weekDates, rosterableStaff, shifts, timeOffs, onCellClick, onStaffClick }: Props) {
  const shiftMap = useMemo(() => {
    const map: Record<string, Shift> = {};
    shifts.forEach(s => {
      const key = `${s.staffId}-${toDateOnly(s.date)}`;
      map[key] = s;
    });
    return map;
  }, [shifts]);

  const timeOffMap = useMemo(() => {
    const map: Record<string, TimeOff> = {};
    timeOffs.forEach(o => {
      const key = `${o.staffId}-${toDateOnly(o.date)}`;
      map[key] = o;
    });
    return map;
  }, [timeOffs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {weekDates.map((dateStr) => {
        const dayLabel = fmtDayFull(dateStr);
        const dayShifts = rosterableStaff.map((m) => {
          const key = `${m.id}-${dateStr}`;
          return { member: m, shift: shiftMap[key], off: timeOffMap[key] };
        });
        const hasAny = dayShifts.some((d) => d.shift || d.off);

        return (
          <div key={dateStr} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            {/* Day header */}
            <div style={{ padding: "8px 14px", background: C.bg, borderBottom: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {dayLabel}
            </div>

            {!hasAny ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: C.mutedFaint }}>No shifts</div>
            ) : (
              dayShifts.map(({ member, shift, off }) => {
                if (!shift && !off) {
                  return (
                    <button key={member.id} onClick={() => onCellClick(member, dateStr)}
                      style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 14px", background: "none", border: "none", borderTop: `1px solid ${C.divider}`, cursor: "pointer", gap: 10, textAlign: "left" }}>
                      <button onClick={(e) => { e.stopPropagation(); onStaffClick?.(member); }} style={{ background: "none", border: "none", padding: 0, cursor: onStaffClick ? "pointer" : "default", fontSize: 13, color: C.muted, minWidth: 100, textAlign: "left", textDecoration: onStaffClick ? "underline" : "none", textDecorationColor: C.border }}>
                        {member.name}
                      </button>
                      <span style={{ fontSize: 11, color: C.mutedFaint, border: `1px dashed #d8d3c4`, borderRadius: 8, padding: "3px 8px" }}>+ Add shift</span>
                    </button>
                  );
                }
                const isShift = !!shift;
                const chipBg = isShift ? C.shiftBg : C.offBg;
                const chipBorder = isShift ? C.shiftBorder : C.offBorder;
                const chipColor = isShift ? C.shiftText : C.offText;
                const chipLabel = shift ? `${shift.startTime}–${shift.endTime} · ${shift.role}` : (off!.status === "Approved" ? "Off" : "Off (req)");

                return (
                  <button key={member.id} onClick={() => onCellClick(member, dateStr)}
                    style={{ display: "flex", alignItems: "center", width: "100%", padding: "10px 14px", background: "none", border: "none", borderTop: `1px solid ${C.divider}`, cursor: "pointer", gap: 10, textAlign: "left" }}>
                    <button onClick={(e) => { e.stopPropagation(); onStaffClick?.(member); }} style={{ background: "none", border: "none", padding: 0, cursor: onStaffClick ? "pointer" : "default", fontSize: 13, fontWeight: 600, color: C.dark, minWidth: 100, textAlign: "left", textDecoration: onStaffClick ? "underline" : "none", textDecorationColor: C.border }}>
                      {member.name}
                    </button>
                    <span style={{ fontSize: 11, fontWeight: 700, background: chipBg, border: `1px solid ${chipBorder}`, color: chipColor, borderRadius: 8, padding: "3px 8px" }}>
                      {chipLabel}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function RosterGrid(props: Props) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 640); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile ? <MobileView {...props} /> : (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
      <DesktopGrid {...props} />
    </div>
  );
}
