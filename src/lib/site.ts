export const SITE_URL = "https://www.smeasy.au";
export const GTM_ID = "GTM-P4V884NF";
export const CONTACT_EMAIL = "hello@smeasy.au";
export const LEGAL_ENTITY = "Open County Pty Ltd";
export const ABN = "19 679 154 557";

/**
 * Sign-ups are closed while SMEasy is in testing: every "Get started" button
 * becomes an early-access request, and the login page only logs in existing
 * accounts. Flip to true at launch (and turn sign-ups back on in Supabase Auth).
 */
export const SIGNUPS_OPEN = false;
export const SIGNUP_HREF = SIGNUPS_OPEN ? "/auth/login/?signup" : "/contact/?topic=early-access";
export const SIGNUP_CTA = SIGNUPS_OPEN ? "Get started free" : "Get early access";
export const SIGNUP_CTA_SHORT = SIGNUPS_OPEN ? "Get started" : "Get early access";

/**
 * Plans and billing (Stripe, via the `billing` and `stripe-webhook` Edge Functions).
 *   Free  up to FREE_STAFF_LIMIT active staff, all rostering.
 *   Core  unlimited staff, timesheets, usual-hours notes. Monthly or annual.
 *   Pro   Core + Xero and MYOB payroll sync. Shown as coming soon until sync ships (PRO_AVAILABLE).
 * Prices are AUD, plus GST, flat per business (no per-user fees).
 *
 * BILLING_ENABLED shows Upgrade / Manage billing in Settings → Plan.
 * STAFF_LIMIT_ENFORCED stops Free businesses adding more than FREE_STAFF_LIMIT active staff.
 * It stays off during early access (the pricing page promises no limits until we email people).
 * The database has a matching check: flip both together (see migration 20261116020000_plans).
 */
export type PlanId = "free" | "core" | "pro";
export type Interval = "month" | "year";
export const PLAN_NAMES: Record<PlanId, string> = { free: "Free", core: "Core", pro: "Pro" };
export const PRICES: Record<"core" | "pro", Record<Interval, number>> = {
  core: { month: 29, year: 290 },
  pro: { month: 49, year: 490 },
};
export const PRO_AVAILABLE = false;
export const BILLING_ENABLED = true;
export const STAFF_LIMIT_ENFORCED = false;
export const FREE_STAFF_LIMIT = 6;
/** Core features (usual-hours notes, timesheets) for everyone during early access. Turn on at launch. */
export const CORE_FEATURES_ENFORCED = false;
/** Usual weekly hours, unless set per person on the Team page. */
export const DEFAULT_WEEKLY_HOURS = 38;
