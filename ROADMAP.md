# SMEasy roadmap

Ordered by priority. Items marked ★ were promised by earlier marketing copy and
have been removed from the site until built.

## Open beta (from 2026-11-20)
Everything is free for every business (unlimited staff, timesheets, usual-hours notes, Xero sync); no checkout. Public promise: paid plans not before 1 April 2027, at least 30 days' notice, founder discount for beta businesses (amount not set). Start billing only once it's working well and about 25 businesses use it regularly. Switches: `OPEN_BETA` in src/lib/site.ts and supabase/functions/xero/index.ts, `v_enforce` in private.check_staff_limit (migration 20261120010000_open_beta). Feedback: header button → `feedback` Edge Function → public.beta_feedback + beta-feedback bucket + email to hello@smeasy.au.

## 1. Before inviting real businesses
- [x] **Branded login emails** (done 2026-11-16) — Resend as Supabase SMTP, sending from `hello@smeasy.au` (DNS records on smeasy.au); SMEasy-styled "Magic link" and "Confirm signup" templates. Removes Supabase's few-per-hour email limit.
- [x] **Privacy policy** — published at /privacy (Open County Pty Ltd). Get a professional review when convenient.
- [x] **Terms of service** — published at /terms and linked in the footer. Read it through before launch; get a professional review when convenient.
- [x] **Contact address** — `hello@smeasy.au` in footer, FAQ and privacy policy. Mailbox receives mail (Google Workspace alias, 2026-11-16).
- [ ] **GTM container** — add the GA4 tag inside GTM-P4V884NF (the site now loads GTM correctly, public pages only); verify Search Console and submit `sitemap.xml`.
- [ ] **Decommission Railway + Neon** — old backend, no longer used. `railway.json` removed from the repo 2026-11-20; still shut down the Railway service and Neon database in their dashboards.
- [ ] **Error monitoring** (e.g. Sentry) on the app screens.
- [ ] **Open Graph image** for link previews.

## 2. Core value — next
- [x] Role colours, shift notes, day notes, daily cover line, unfilled shifts, staff calendar subscription (Nov 2026).
Build order agreed 2026-11-16 (pricing: Free ≤6 staff, Plus $29/$290, Pro $49/$490 with payroll sync; Plus was called Core until 2026-11-16, and its internal id is still `core`):
- [x] **1. Plans and billing** — Free/Plus/Pro in src/lib/site.ts, monthly/annual Plus prices in Stripe, 6-staff limit in the app and database (on since the open beta), new pricing page with a Pro waitlist.
- [x] **2. Usual hours (Plus)** — usual weekly hours per person (default 38). A quiet, neutral note when someone's rostered above them: muted "+3.5" under their total in the week grid, a line in the shift editor, and a dismissable line on phones. Not a warning (extra hours aren't necessarily bad), no award or pay calculation.
- [x] **3. Timesheets (Plus)** — after the day, the manager confirms or adjusts each shift's actual start/finish and approves the week; approved hours feed the CSV and, later, payroll sync. No clock-in app.
- [x] **4a. Roster emails (Free)** — on publish, each rostered person with an email gets their shifts and personal link (notify-roster Edge Function, Resend, from hello@smeasy.au, reply-to the manager). "Email the team" on published weeks for updates. Staff add/change their email and stop emails on their personal link; every email has a stop link.
- [ ] **4b. Web push** — needs a service worker, VAPID keys, a subscriptions table and an "allow notifications" prompt on the staff link (iPhone: only once added to the home screen). No SMS. WhatsApp maybe later.
- [x] **5. Xero Payroll sync (Pro)**: built and tested against Demo Company (AU) on 2026-11-16.
  - Settings → Payroll connects Xero (OAuth, signed state, AES-GCM tokens, least scopes) and matches staff to Xero employees.
  - Hours → Send to Xero creates or updates DRAFT timesheets in each employee's pay period (weekly, fortnightly or 4-weekly). Disconnect revokes at Xero.
  - **Before selling Pro:**
    - [x] Use Xero's official "Connect to Xero" button artwork (public/xero/connect-blue.svg; check it against Xero's brand guidelines).
    - [x] Disconnect Xero automatically when a Pro subscription ends (stripe-webhook → disconnect()).
    - [x] Enforce Pro on the server.
    - [x] Create the Pro prices in Stripe and set `PRO_AVAILABLE`.
    - [ ] Move to Xero's Core tier ($35/month) past 5 connected businesses; Core may need app certification, so check.
    - [x] Support monthly pay calendars.
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
- [x] **Before charging anyone** (done by 2026-11-17) — turn on the staff limit (`STAFF_LIMIT_ENFORCED` + the database trigger's `v_enforce`), switch Stripe to live keys, email early-access users well in advance (Free drops from 10 to 6 staff), terms of service. Put Pro on sale (`PRO_AVAILABLE`, Pro prices in Stripe) when Xero sync ships.

## Record-keeping (Fair Work), 2026-11-16
- [x] Employment type per person (filled from Xero EmploymentBasis), approved weeks freeze worked times, approved shifts can't be deleted, reopening needs a reason and every change is kept in hours_changes, date-range export, FAQ/privacy wording (7-year rule, the employer is responsible), "Published <date>" on the roster.
- [ ] Later: a change log for published rosters (what changed and when staff were told); break start times if awards need them; keep approval state when the week start day is changed (regrouping currently drops it).

## Billing follow-ups (parked 2026-11-16)
- [ ] **Customer billing emails** — turn on Stripe's receipts, invoice, failed-payment, upcoming-renewal (annual) and expiring-card emails; branding; ABN on invoices so they work as tax invoices; a support email that actually receives mail. Optional: our own "You're on Core" / "Your plan ends" emails from the webhook via Resend.

## Content to update as features ship
- [ ] **Guides, FAQ and help** — update every guide, the FAQ, llms.txt and in-app help text for the new pricing (Free ≤6, Plus, Pro), the day view, week start day, and each feature in the build order (usual-hours notes, timesheets, publish notifications, payroll sync) as it ships. Remove "Coming soon" labels on the pricing page as items land.

## SEO and content
- [ ] More guides: printable/free roster template (could use the PDF), rostering around public holidays, how to roster a small café, casual vs part-time rostering basics (link to Fair Work, no legal advice).
- [ ] Review guide copy whenever a roadmap item ships, and move it from "not yet" to "now" in the FAQ and llms.txt.
