// Calm, distinguishable colours for shift roles. Colour follows the role's
// position in the business's role list, so it's stable and needs no setup.

export interface Swatch { bg: string; border: string; text: string; pdf: [number, number, number] }

const PALETTE: Swatch[] = [
  { bg: "#eaf9c8", border: "#b7e021", text: "#3d5200", pdf: [234, 249, 200] }, // lime
  { bg: "#e3effd", border: "#7fb0ec", text: "#1d4f8a", pdf: [227, 239, 253] }, // blue
  { bg: "#fde8d8", border: "#f0a774", text: "#8a4210", pdf: [253, 232, 216] }, // apricot
  { bg: "#efe6fb", border: "#b79ae6", text: "#55308f", pdf: [239, 230, 251] }, // lavender
  { bg: "#dcf3ee", border: "#6cc4b0", text: "#1d5f51", pdf: [220, 243, 238] }, // teal
  { bg: "#fbe3ec", border: "#e98fb0", text: "#8a2350", pdf: [251, 227, 236] }, // pink
  { bg: "#f6f0d2", border: "#d4bd52", text: "#6b5a0c", pdf: [246, 240, 210] }, // mustard
  { bg: "#ebe9e4", border: "#b3ad9b", text: "#4a463c", pdf: [235, 233, 228] }, // stone
];

const NO_ROLE: Swatch = PALETTE[7];

export const UNFILLED = { bg: "#fff5f3", border: "#d9534f", text: "#9b2c25" };

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function roleSwatch(role: string | null | undefined, roles: string[]): Swatch {
  if (!role) return NO_ROLE;
  const i = roles.indexOf(role);
  return PALETTE[(i >= 0 ? i : hash(role)) % (PALETTE.length - 1)];
}
