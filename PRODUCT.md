# SMEasy — product definition

**One job:** the simplest possible rostering for Australian small businesses
(cafés, restaurants, bars, shops; a handful to a few dozen staff, many casual).

Rule for all copy (landing, guides, FAQ, llms.txt): describe what the product
does **today**. Anything not built goes in `ROADMAP.md`, never in marketing.

## Users
- **Manager/owner** — time-poor, often on a phone, not technical. One login per business.
- **Staff** — casuals and part-timers. No app, no account, no password.

## What's built (v1)
| Area | Today |
|---|---|
| Sign-in | Email + password (Supabase), or magic link (implicit flow, works across devices). Forgot password → /auth/reset. Set/change password in Settings → Your login. Nav: Roster · Team · Settings. Welcome step sets business name + role preset (café / retail / other). |
| Team | Add/edit people: usual role, mobile, email. Hourly rate + payroll ID only when Settings → Pay details is on (businesses.payroll_settings.pay_details, off by default). Remove/bring back. |
| Roster | Grid (desktop, always-visible Unfilled row) / week strip + one day at a time with swipe (mobile). Add a shift to several days at once (Also add on / Copy to other days). Shifts with start, finish, unpaid break, role. Split shifts and past-midnight shifts. Copy last week. Paid hours per person + total. Base-rate wage estimate only when Pay details is on. Publish / unpublish. Approve/decline time off. |
| Sharing | One **team roster link** per business (`/r/#token`, published weeks only, names/times/roles only, resettable). **PDF** (A4 landscape). |
| Time off | Personal staff link (`/s/#token`) — own shifts + request time off. Requests show on the Roster. |
| Payroll | Hours CSV: name, date, day, start, finish, break, rostered + actual hours, role; plus payroll ID, hourly rate, base pay when Pay details is on. |
| Data | Supabase Postgres in Sydney (ap-southeast-2). RLS: a manager sees only their own business. Staff access only via SECURITY DEFINER functions that expose published rosters. |

## Not built — see ROADMAP.md
Notifications, Xero/MYOB import formats, swaps, availability, award checks,
penalty-rate costing, multiple managers/locations, the Free staff limit (switch built, off).

## Pricing
Free during early access. Planned: Free up to 10 staff with every feature; Pro $19/month + GST ($20.90) for more than 10 staff plus priority email support. Billing is built with Stripe (Settings → Plan: Upgrade via Stripe Checkout, Manage billing via the Stripe portal; `billing` + `stripe-webhook` Edge Functions; `public.billing` table, written only by the webhook). Running in Stripe test mode. The 10-staff limit is not enforced during early access (`STAFF_LIMIT_ENFORCED` in src/lib/site.ts) — see ROADMAP.md.

## Voice
Australian English, plain and friendly, manager-to-manager. Short sentences.
Say "roster", "shift", "time off", "publish". No hype, no invented stats or
testimonials.

## Stack
Next.js 16 static export on Vercel (www.smeasy.au) · Supabase (auth + Postgres,
migrations in `supabase/migrations/`) · jsPDF for PDFs · GTM on public pages only.

## Brand commitments
- App screens follow the category standard (clean modern scheduling app), at the craft level of Deputy / Homebase and Square / Afterpay merchant apps. Lime #b7e021 and the square logo stay. (Chosen by the owner, Nov 2026.)
