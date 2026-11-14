import data from "@/data/au-holidays.json";

export const STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
export type State = (typeof STATES)[number];

export const STATE_TIMEZONE: Record<State, string> = {
  NSW: "Australia/Sydney", ACT: "Australia/Sydney", VIC: "Australia/Melbourne", TAS: "Australia/Hobart",
  QLD: "Australia/Brisbane", SA: "Australia/Adelaide", NT: "Australia/Darwin", WA: "Australia/Perth",
};

type Holiday = { date: string; name: string; states: string[] };
const holidays = (data as { holidays: Holiday[] }).holidays;

/** Public holiday name for a date, for the business's state (national ones if no state set). */
export function holidayOn(date: string, state: string | null | undefined): string | null {
  const h = holidays.find((x) => x.date === date && (x.states.length === 0 || (state != null && x.states.includes(state))));
  return h?.name ?? null;
}
