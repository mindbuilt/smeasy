import type { Business } from "./types";

/** "Pay details" is an opt-in business setting: hourly rates, payroll IDs, a base-rate wage estimate, and extra CSV columns. Off by default. */
export function payDetailsOn(b: Pick<Business, "payroll_settings"> | null | undefined): boolean {
  const s = b?.payroll_settings;
  return !!s && typeof s === "object" && !Array.isArray(s) && (s as Record<string, unknown>).pay_details === true;
}

export function withPayDetails(b: Pick<Business, "payroll_settings">, on: boolean) {
  const s = b.payroll_settings && typeof b.payroll_settings === "object" && !Array.isArray(b.payroll_settings) ? b.payroll_settings : {};
  return { ...s, pay_details: on };
}
