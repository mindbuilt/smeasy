// Shared palette — importable from server and client components.
export const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  divider: "#f0ede4",
  muted: "#6e6a5e",
  secondary: "#5b584f",
  faint: "#c2bcaa",
  shiftBg: "#eaf9c8",
  shiftBorder: "#b7e021",
  shiftText: "#3d5200",
  offBg: "#fdf1e0",
  offBorder: "#d98c1f",
  offText: "#8a5a10",
  danger: "#b3261e",
  // Border radii — flat, sharp aesthetic
  r1: 4,   // small: chips, buttons, inputs, shift tags
  r2: 6,   // medium: cards, modals, containers
} as const;

// App screens (roster, team, settings, login, staff links): the clean modern
// scheduling-app palette. Same keys as C so app components can swap freely.
export const APP = {
  bg: "#f6f7f9",
  white: "#ffffff",
  dark: "#111827",
  accent: "#b7e021",
  border: "#e5e7eb",
  divider: "#eef0f3",
  muted: "#6b7280",
  secondary: "#4b5563",
  faint: "#c3c8d0",
  shiftBg: "#ecfccb",
  shiftBorder: "#b7e021",
  shiftText: "#3f6212",
  offBg: "#fff7ed",
  offBorder: "#fdba74",
  offText: "#9a3412",
  danger: "#b91c1c",
  r1: 10,
  r2: 16,
  shadow: "0 1px 2px rgba(17,24,39,0.04), 0 2px 8px rgba(17,24,39,0.06)",
  shadowLift: "0 4px 10px rgba(17,24,39,0.08), 0 12px 28px rgba(17,24,39,0.10)",
} as const;
