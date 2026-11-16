# SMEasy roadmap

Ordered by priority. Items marked ★ were promised by earlier marketing copy and
have been removed from the site until built.

## 1. Before inviting real businesses
- [ ] **Branded login emails** — Resend as Supabase SMTP, sending from `hello@smeasy.au` (DNS records on smeasy.au); SMEasy-styled "Magic link" and "Confirm signup" templates. Removes Supabase's few-per-hour email limit.
- [x] **Privacy policy** — published at /privacy (Open County Pty Ltd). Get a professional review when convenient.
- [ ] **Terms of service**.
- [x] **Contact address** — `hello@smeasy.au` in footer, FAQ and privacy policy. **Make sure this mailbox receives mail.**
- [ ] **GTM container** — add the GA4 tag inside GTM-P4V884NF (the site now loads GTM correctly, public pages only); verify Search Console and submit `sitemap.xml`.
- [ ] **Decommission Railway + Neon** — old backend, no longer used.
- [ ] **Error monitoring** (e.g. Sentry) on the app screens.
- [ ] **Open Graph image** for link previews.

## 2. Core value — next
- [x] Role colours, shift notes, day notes, daily cover line, unfilled shifts, staff calendar subscription (Nov 2026).
Build order agreed 2026-11-16 (pricing: Free ≤6 staff, Core $29/$290, Pro $49/$490 with payroll sync):
- [x] **1. Plans and billing** — Free/Core/Pro in src/lib/site.ts, monthly/annual Core prices in Stripe, 6-staff limit in the app and database (both off during early access), new pricing page with a Pro waitlist.
- [x] **2. Usual hours (Core)** — usual weekly hours per person (default 38). A quiet, neutral note when someone's rostered above them: muted "+3.5" under their total in the week grid, a line in the shift editor, and a dismissable line on phones. Not a warning (extra hours aren't necessarily bad), no award or pay calculation.
- [ ] **3. Timesheets (Core)** — after the day, the manager confirms or adjusts each shift's actual start/finish and approves the week; approved hours feed the CSV and, later, payroll sync. No clock-in app.
- [ ] **4. Notify staff on publish (Free)** — email (Resend) and web push (iPhone needs SMEasy added to the home screen). No SMS. WhatsApp maybe later. Include "roster changed" notices for published weeks.
- [ ] **5. Xero Payroll sync (Pro)** — via the Xero API (Payroll AU timesheets). Needs a Xero developer app, OAuth, staff ↔ employee and pay item mapping, pay calendar matching the roster week. Check Xero's connection cap for uncertified apps and current developer terms. On Stripe cancellation, disconnect the business's Xero connection.
- [ ] **6. MYOB sync (Pro)** — MYOB API and partner sign-up; confirm whether a timesheet import file is an option for AccountRight.
- [ ] ★ **Staff availability** — staff mark days/times they can't work; shown on the grid.
- [x] **Public holidays** — marked by state (Nager.Date calendar, fetched at build).
- [ ] **Smarter wage estimate** — optional weekend / public-holiday multipliers per business (still an estimate, not award interpretation).
- [ ] **Roster checks (guidance only)** — flag very short shifts and short breaks between shifts; link to Fair Work rather than claiming compliance.
- [ ] **Multiple managers per business** (old "Can manage" permission).

## 3. Later
- [ ] ★ **In-app shift swaps** — staff propose, manager approves, roster updates.
- [ ] ★ **Recurring shifts** — beyond "copy last week".
- [ ] ★ **Import staff from a spreadsheet**.
- [ ] ★ **Drag-and-drop** shifts on desktop.
- [ ] **Multiple locations** per business.
- [ ] **Installable app (PWA)** and offline viewing of the published roster.
- [ ] **Pay details as a Pro feature?** — Settings → Pay details (hourly rates, payroll IDs, base-rate estimate, pay columns in CSV) is built and free for now. Decide whether it moves to Pro when billing exists.
- [ ] **Before charging anyone** — turn on the staff limit (`STAFF_LIMIT_ENFORCED` + the database trigger's `v_enforce`), switch Stripe to live keys, email early-access users well in advance (Free drops from 10 to 6 staff), terms of service. Put Pro on sale (`PRO_AVAILABLE`, Pro prices in Stripe) when Xero sync ships.

## Billing follow-ups (parked 2026-11-16)
- [ ] **Customer billing emails** — turn on Stripe's receipts, invoice, failed-payment, upcoming-renewal (annual) and expiring-card emails; branding; ABN on invoices so they work as tax invoices; a support email that actually receives mail. Optional: our own "You're on Core" / "Your plan ends" emails from the webhook via Resend.

## Content to update as features ship
- [ ] **Guides, FAQ and help** — update every guide, the FAQ, llms.txt and in-app help text for the new pricing (Free ≤6, Core, Pro), the day view, week start day, and each feature in the build order (usual-hours notes, timesheets, publish notifications, payroll sync) as it ships. Remove "Coming soon" labels on the pricing page as items land.

## SEO and content
- [ ] More guides: printable/free roster template (could use the PDF), rostering around public holidays, how to roster a small café, casual vs part-time rostering basics (link to Fair Work, no legal advice).
- [ ] Review guide copy whenever a roadmap item ships, and move it from "not yet" to "now" in the FAQ and llms.txt.
