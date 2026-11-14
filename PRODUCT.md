# Smeasy — product definition

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
| Sign-in | Supabase magic link (implicit flow, works across devices). Welcome step sets business name + role preset (café / retail / other). |
| Team | Add/edit people: usual role, hourly rate, mobile, email, payroll ID. Remove/bring back. Editable shift roles. |
| This week | Grid (desktop) / day cards (mobile). Shifts with start, finish, unpaid break, role. Split shifts and past-midnight shifts. Copy last week. Paid hours per person + total. Wage estimate (base rates only). Publish / unpublish. Approve/decline time off. |
| Sharing | One **team roster link** per business (`/r/#token`, published weeks only, names/times/roles only, resettable). **PDF** (A4 landscape). |
| Time off | Personal staff link (`/s/#token`) — own shifts + request time off. Requests show on This week. |
| Payroll | Hours CSV: name, payroll ID, date, start, finish, break, paid hours, role. |
| Data | Supabase Postgres in Sydney (ap-southeast-2). RLS: a manager sees only their own business. Staff access only via SECURITY DEFINER functions that expose published rosters. |

## Not built — see ROADMAP.md
Notifications, Xero/MYOB import formats, swaps, availability, award checks,
penalty-rate costing, multiple managers/locations, billing.

## Pricing
Free during early access. Planned: Free up to 10 staff with every feature; Pro $19/month (inc. GST) for more than 10 staff plus priority email support. Limits and billing not built yet — see ROADMAP.md.

## Voice
Australian English, plain and friendly, manager-to-manager. Short sentences.
Say "roster", "shift", "time off", "publish". No hype, no invented stats or
testimonials.

## Stack
Next.js 16 static export on Vercel (www.smeasy.au) · Supabase (auth + Postgres,
migrations in `supabase/migrations/`) · jsPDF for PDFs · GTM on public pages only.
