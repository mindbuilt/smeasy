import type { CSSProperties } from "react";
import { C } from "@/lib/mkt";

// Real screenshots of SMEasy (public/product/), framed in code: a slim phone outline or a
// minimal browser bar. Captured from the demo "Corner Café" account; see DESIGN.md.

export const SHOTS = {
  "roster-week-desktop": { w: 1650, h: 1620, device: "desktop", url: "smeasy.au/week" },
  "roster-day-phone": { w: 672, h: 1452, device: "phone" },
  "add-shift-phone": { w: 672, h: 1452, device: "phone" },
  "staff-link-phone": { w: 672, h: 1452, device: "phone" },
  "time-off-phone": { w: 672, h: 1452, device: "phone" },
  "team-phone": { w: 672, h: 1452, device: "phone" },
} as const;

export type ShotName = keyof typeof SHOTS;

export default function DeviceShot({ name, alt, style, priority }: { name: ShotName; alt: string; style?: CSSProperties; priority?: boolean }) {
  const s = SHOTS[name];
  const img = (
    <img src={`/product/${name}.png`} alt={alt} width={s.w} height={s.h} loading={priority ? "eager" : "lazy"}
      style={{ width: "100%", height: "auto", display: "block", background: C.bg }} />
  );

  if (s.device === "phone") {
    return (
      <div style={{ width: "100%", maxWidth: 300, margin: "0 auto", ...style }}>
        <div style={{ background: "#111827", borderRadius: 44, padding: 9, boxShadow: "0 18px 40px rgba(17,24,39,0.22), 0 4px 10px rgba(17,24,39,0.12)" }}>
          <div style={{ borderRadius: 35, overflow: "hidden" }}>{img}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadowLift, overflow: "hidden", ...style }}>
      <div aria-hidden style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderBottom: `1px solid ${C.border}`, background: "#fbfbfc" }}>
        {[0, 1, 2].map((i) => <span key={i} style={{ width: 10, height: 10, borderRadius: 999, background: "#e5e7eb" }} />)}
        <span style={{ margin: "0 auto", fontSize: 12, color: C.muted, background: "#f3f4f6", borderRadius: 999, padding: "3px 14px" }}>{"url" in s ? s.url : ""}</span>
        <span style={{ width: 42 }} />
      </div>
      {img}
    </div>
  );
}
