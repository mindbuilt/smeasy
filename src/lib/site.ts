export const SITE_URL = "https://www.smeasy.au";
export const GTM_ID = "GTM-P4V884NF";
export const CONTACT_EMAIL = "hello@smeasy.au";
export const LEGAL_ENTITY = "Open County Pty Ltd";
export const ABN = "19 679 154 557";

/**
 * Holding page: public pages show "coming soon" with a preview password for
 * testers; the app, login and staff links work as normal, and search engines are
 * told not to index. It's a soft gate (static site), not security: the real lock
 * on new accounts is SIGNUPS_OPEN plus "Allow new users to sign up" off in Supabase.
 * Preview password: SHA-256 below (currently "flatwhite").
 */
export const HOLDING_PAGE = true;
export const PREVIEW_PASSWORD_SHA256 = "c9a6dd3f5be65518575c261fc6f96b719622a09547968ac850c34cfa290450a8";

/**
 * Sign-ups. Open since 2026-11-16; "Allow new users to sign up"
 * must also be on in Supabase Auth. When false, "Get started" buttons become a
 * waitlist request and the login page only logs in existing accounts.
 */
export const SIGNUPS_OPEN = false; // closed again while the holding page is up (2026-11-16)
export const SIGNUP_HREF = SIGNUPS_OPEN ? "/auth/login/?signup" : "/contact/";
export const SIGNUP_CTA = SIGNUPS_OPEN ? "Get started free" : "Join the waitlist";
export const SIGNUP_CTA_SHORT = SIGNUPS_OPEN ? "Get started" : "Join the waitlist";

/**
 * Plans and billing (Stripe, via the `billing` and `stripe-webhook` Edge Functions).
 *   Free  up to FREE_STAFF_LIMIT active staff, all rostering.
 *   Plus  unlimited staff, timesheets, usual-hours notes. Monthly or annual.
 *   Pro   Plus + Xero and MYOB payroll sync. Shown as coming soon until sync ships (PRO_AVAILABLE).
 * Prices are AUD, plus GST, flat per business (no per-user fees).
 *
 * BILLING_ENABLED shows Upgrade / Manage billing in Settings → Plan.
 * STAFF_LIMIT_ENFORCED stops Free businesses adding more than FREE_STAFF_LIMIT active staff.
 * On since 2026-11-16, while Stripe is still in test mode.
 * The database has a matching check: flip both together (see migration 20261116020000_plans).
 */
export type PlanId = "free" | "core" | "pro";
export type Interval = "month" | "year";
export const PLAN_NAMES: Record<PlanId, string> = { free: "Free", core: "Plus", pro: "Pro" };
export const PRICES: Record<"core" | "pro", Record<Interval, number>> = {
  core: { month: 29, year: 290 },
  pro: { month: 49, year: 490 },
};
export const PRO_AVAILABLE = true;
export const BILLING_ENABLED = true;
export const STAFF_LIMIT_ENFORCED = true;
export const FREE_STAFF_LIMIT = 6;
/** Paid-plan features (usual-hours notes, timesheets) need Plus. On, as at launch; the holding page hides the public site until we're ready. */
export const CORE_FEATURES_ENFORCED = true;
/** Usual weekly hours, unless set per person on the Team page. */
export const DEFAULT_WEEKLY_HOURS = 38;
