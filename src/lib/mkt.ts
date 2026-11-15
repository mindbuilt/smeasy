import type { CSSProperties } from "react";
import { APP as C } from "@/lib/theme";

// Marketing pages use the app's system (DESIGN.md) at marketing scale.
// Server-safe style objects, so server components can share them.

export { C };

export const wrap: CSSProperties = { maxWidth: 1080, margin: "0 auto", padding: "0 20px" };

export const display: CSSProperties = {
  fontSize: "clamp(38px, 6.4vw, 64px)", lineHeight: 1.02, fontWeight: 800, letterSpacing: "-0.035em",
  margin: 0, textWrap: "balance",
};
export const pageTitle: CSSProperties = {
  fontSize: "clamp(32px, 5vw, 44px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.03em",
  margin: 0, textWrap: "balance",
};
export const sectionTitle: CSSProperties = {
  fontSize: "clamp(26px, 3.6vw, 36px)", lineHeight: 1.1, fontWeight: 800, letterSpacing: "-0.025em",
  margin: 0, textWrap: "balance",
};
export const groupTitle: CSSProperties = { fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em", margin: 0 };
export const lead: CSSProperties = { fontSize: "clamp(17px, 2vw, 19px)", lineHeight: 1.55, color: C.secondary, margin: 0, textWrap: "pretty" };
export const body: CSSProperties = { fontSize: 16, lineHeight: 1.6, color: C.secondary, margin: 0 };

/** White borderless card on the cool ground, lifted by the Rest shadow. */
export const card: CSSProperties = { background: C.white, borderRadius: C.r2, boxShadow: C.shadow };
/** The one dark surface on a page (the app's next-shift card). */
export const inkCard: CSSProperties = {
  background: C.dark, color: C.white, borderRadius: 20, boxShadow: "0 10px 30px rgba(17,24,39,0.18)",
};
export const onInk = "rgba(255,255,255,0.74)";

type Kind = "accent" | "primary" | "secondary" | "onInk";

/** Link styled as an app button. Large on marketing: 48px. */
export function button(kind: Kind = "secondary", size: "md" | "lg" = "lg"): CSSProperties {
  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    minHeight: size === "lg" ? 50 : 42, padding: size === "lg" ? "13px 24px" : "10px 16px",
    borderRadius: C.r1, fontSize: size === "lg" ? 16 : 15, fontWeight: 700, textDecoration: "none",
    border: "1px solid transparent", whiteSpace: "nowrap",
  };
  if (kind === "accent") return { ...base, background: C.accent, color: C.dark, boxShadow: "0 6px 16px rgba(101,163,13,0.30), 0 2px 4px rgba(17,24,39,0.10)" };
  if (kind === "primary") return { ...base, background: C.dark, color: C.white };
  if (kind === "onInk") return { ...base, background: C.accent, color: C.dark };
  return { ...base, background: C.white, color: C.dark, borderColor: C.border };
}

/** State pill: a wash with dark same-hue text (The Wash, Not Paint Rule). */
export function pill(tone: "lime" | "draft" | "published" | "quiet" = "lime"): CSSProperties {
  const tones = {
    lime: { background: "#ecfccb", color: "#3f6212" },
    draft: { background: "#fef3c7", color: "#92400e" },
    published: { background: "#dcfce7", color: "#166534" },
    quiet: { background: "#eef0f3", color: C.secondary },
  } as const;
  return { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, borderRadius: 999, padding: "4px 11px", ...tones[tone] };
}

export const link: CSSProperties = { color: C.dark, fontWeight: 600, textDecoration: "underline", textDecorationColor: "#c3c8d0", textUnderlineOffset: 3 };
