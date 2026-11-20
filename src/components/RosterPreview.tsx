"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { roleSwatch, UNFILLED } from "@/lib/roleColors";
import { C } from "@/lib/mkt";
import { Avatar } from "@/components/ui";

// Static illustration of the roster screen with sample data, drawn in the app's own
// parts. Desktop: the week grid in a card. Phones: the week strip and one day of shift
// cards. Shifts pop in once as it scrolls into view, the way Copy last week fills a week.

const ROLES = ["Floor", "Kitchen", "Barista", "Bar"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DATES = [17, 18, 19, 20, 21, 22, 23];

type Row = { name: string; role: string; shifts: (string | null)[]; hrs: string };
const ROWS: Row[] = [
  { name: "Sam", role: "Barista", shifts: ["6:30–2:30", "6:30–2:30", null, "6:30–2:30", "7–11 · 4–10", null, null], hrs: "32.0" },
  { name: "Priya", role: "Floor", shifts: ["9–5", null, "9–5", null, null, "8–4", "8–4"], hrs: "30.0" },
  { name: "Tom", role: "Bar", shifts: [null, null, null, null, "5pm–2am", "5pm–2am", null], hrs: "17.0" },
  { name: "Lily", role: "Kitchen", shifts: [null, "11–3", "11–3", "11–3", null, "Off", null], hrs: "12.0" },
];
const UNFILLED_ROW: (string | null)[] = [null, null, null, null, null, "10–4", null];

const pillPublished: CSSProperties = { fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 9px", background: "#dcfce7", color: "#166534" };

export default function RosterPreview() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Visible by default (no JS, crawlers, reduced motion); only armed once JS runs.
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("is-armed");
    // Already on screen (the usual case, just under the hero): play on the next frame.
    if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
      const raf = requestAnimationFrame(() => el.classList.add("is-in"));
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add("is-in");
      io.disconnect();
    }, { rootMargin: "0px 0px -15% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let n = 0; // stagger index across the grid, in reading order

  return (
    <div ref={ref} className="mkt-preview" role="img" aria-label="Example roster in SMEasy: four staff across a week, published, with one unfilled Saturday shift">
      {/* Desktop week grid */}
      <div className="roster-grid" style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadowLift, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px" }}>
          <strong style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>17 – 23 Nov</strong>
          <span style={pillPublished}>Published</span>
          <span style={{ marginLeft: "auto", fontSize: 14, color: C.secondary }}><strong style={{ color: C.dark, fontWeight: 800 }}>91.0</strong> total hours</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "150px repeat(7, minmax(0, 1fr)) 60px", borderTop: `1px solid ${C.divider}`, fontSize: 12, fontWeight: 700, color: C.muted }}>
          <div style={{ padding: "10px 16px" }}>Team</div>
          {DAYS.map((d, i) => (
            <div key={d} style={{ padding: "8px 4px", textAlign: "center", lineHeight: 1.25 }}>
              {d}<div style={{ fontSize: 15, fontWeight: 800, color: C.dark }}>{DATES[i]}</div>
            </div>
          ))}
          <div style={{ padding: "10px 4px", textAlign: "center" }}>Hrs</div>
        </div>
        {ROWS.map((r) => {
          const sw = roleSwatch(r.role, ROLES);
          return (
            <div key={r.name} style={{ display: "grid", gridTemplateColumns: "150px repeat(7, minmax(0, 1fr)) 60px", borderTop: `1px solid ${C.divider}`, alignItems: "center" }}>
              <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700 }}>
                <Avatar name={r.name} size={32} tone={{ bg: sw.bg, text: sw.text }} />{r.name}
              </div>
              {r.shifts.map((s, i) => (
                <div key={i} style={{ padding: 4, minHeight: 50, display: "flex", alignItems: "center" }}>
                  {s && (
                    <div className="mkt-pop" style={{
                      ["--i" as string]: n++, width: "100%", textAlign: "center", fontSize: 12.5, fontWeight: 700, borderRadius: 10, padding: "8px 2px",
                      background: s === "Off" ? C.offBg : sw.bg, color: s === "Off" ? C.offText : sw.text,
                    }}>{s}</div>
                  )}
                </div>
              ))}
              <div style={{ fontSize: 14, fontWeight: 700, textAlign: "center" }}>{r.hrs}</div>
            </div>
          );
        })}
        <div style={{ display: "grid", gridTemplateColumns: "150px repeat(7, minmax(0, 1fr)) 60px", borderTop: `1px solid ${C.divider}`, alignItems: "center", background: UNFILLED.bg }}>
          <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 15, fontWeight: 700, color: UNFILLED.text }}>
            <span aria-hidden style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px dashed ${UNFILLED.border}`, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>?</span>
            Unfilled
          </div>
          {UNFILLED_ROW.map((s, i) => (
            <div key={i} style={{ padding: 4, minHeight: 50, display: "flex", alignItems: "center" }}>
              {s && <div className="mkt-pop" style={{ ["--i" as string]: n++, width: "100%", textAlign: "center", fontSize: 12.5, fontWeight: 700, borderRadius: 10, padding: "7px 2px", background: UNFILLED.bg, color: UNFILLED.text, border: `1.5px dashed ${UNFILLED.border}` }}>{s}</div>}
            </div>
          ))}
          <div />
        </div>
      </div>

      {/* Phones: week strip + Friday's shift cards, as in the app */}
      <div className="roster-cards" style={{ flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 2px" }}>
          <strong style={{ fontSize: 19, fontWeight: 800 }}>17 – 23 Nov</strong>
          <span style={pillPublished}>Published</span>
        </div>
        <div style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: 6, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
          {DAYS.map((d, i) => {
            const on = i === 4;
            const count = ROWS.filter((r) => r.shifts[i] && r.shifts[i] !== "Off").length;
            return (
              <div key={d} style={{ borderRadius: 12, padding: "7px 0 8px", textAlign: "center", background: on ? C.dark : "transparent", color: on ? C.white : C.dark }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: on ? "rgba(255,255,255,0.72)" : C.muted }}>{d}</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{DATES[i]}</div>
                <div style={{ height: 3, width: count ? 8 + count * 4 : 8, margin: "4px auto 0", borderRadius: 2, background: i === 5 ? "#d9534f" : count ? (on ? C.accent : "#65a30d") : "#d1d5db" }} />
              </div>
            );
          })}
        </div>
        {ROWS.filter((r) => r.shifts[4]).map((r, i) => {
          const sw = roleSwatch(r.role, ROLES);
          return (
            <div key={r.name} className="mkt-pop" style={{ ["--i" as string]: i * 2, background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={r.name} size={40} tone={{ bg: sw.bg, text: sw.text }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{r.name}</div>
                <div style={{ fontSize: 14, color: C.secondary }}>{r.shifts[4]}</div>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, borderRadius: 999, padding: "4px 10px", background: sw.bg, color: sw.text }}>{r.role}</span>
            </div>
          );
        })}
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "2px 0" }}>+ the rest of the week</div>
      </div>
    </div>
  );
}
