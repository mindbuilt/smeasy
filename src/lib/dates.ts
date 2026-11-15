// All dates are plain "YYYY-MM-DD" strings in the business's local time.

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parse(d: string): Date {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: string, n: number): string {
  const dt = parse(d);
  dt.setDate(dt.getDate() + n);
  return toISO(dt);
}

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export function isoDay(d: string): number {
  return ((parse(d).getDay() + 6) % 7) + 1;
}

/** Short day name for a date, e.g. "Sat". */
export function dayName(d: string): string {
  return DAY_NAMES[isoDay(d) - 1];
}

/** First day of the week containing d, for a week that starts on startDay (1 = Monday ... 7 = Sunday). */
export function weekStartOf(d: string, startDay = 1): string {
  return addDays(d, -((isoDay(d) - startDay + 7) % 7));
}

export function thisWeekStart(startDay = 1): string {
  return weekStartOf(toISO(new Date()), startDay);
}

export function mondayOf(d: string): string {
  return weekStartOf(d, 1);
}

export function thisMonday(): string {
  return thisWeekStart(1);
}

export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function fmtDay(d: string): string {
  const dt = parse(d);
  return `${DAY_NAMES[(dt.getDay() + 6) % 7]} ${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
}

export function fmtWeek(monday: string): string {
  const s = parse(monday);
  const e = parse(addDays(monday, 6));
  const left = `${s.getDate()} ${MONTHS[s.getMonth()]}`;
  const right = `${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
  return `${left} – ${right}`;
}

/** "09:00:00" → "9:00", "17:30:00" → "5:30pm" style kept short: "9–5:30" */
export function fmtTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "am" : "pm";
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

/** Paid hours for a shift. End before start means it runs past midnight. */
export function shiftHours(start: string, end: string, breakMinutes: number): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  let mins = toMin(end) - toMin(start);
  if (mins <= 0) mins += 24 * 60;
  return Math.max(0, mins - breakMinutes) / 60;
}

export const fmtAUD = (n: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(n);
