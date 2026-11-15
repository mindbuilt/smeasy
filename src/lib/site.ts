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
 * Billing (Stripe, via the `billing` and `stripe-webhook` Edge Functions).
 * BILLING_ENABLED shows Upgrade / Manage billing in Settings → Plan.
 * STAFF_LIMIT_ENFORCED stops Free businesses adding more than FREE_STAFF_LIMIT active staff.
 * It stays off during early access (the pricing page promises no limits until we email people).
 */
export const BILLING_ENABLED = true;
export const STAFF_LIMIT_ENFORCED = false;
export const FREE_STAFF_LIMIT = 10;
