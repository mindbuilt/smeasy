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
