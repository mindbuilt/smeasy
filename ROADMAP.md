# Smeasy roadmap

Ordered by priority. Items marked ★ were promised by earlier marketing copy and
have been removed from the site until built.

## 1. Before inviting real businesses
- [ ] **Branded login emails** — Resend as Supabase SMTP, sending from `hello@smeasy.au` (DNS records on smeasy.au); Smeasy-styled "Magic link" and "Confirm signup" templates. Removes Supabase's few-per-hour email limit.
- [x] **Privacy policy** — published at /privacy (Open County Pty Ltd). Get a professional review when convenient.
- [ ] **Terms of service**.
- [x] **Contact address** — `hello@smeasy.au` in footer, FAQ and privacy policy. **Make sure this mailbox receives mail.**
- [ ] **GTM container** — add the GA4 tag inside GTM-P4V884NF (the site now loads GTM correctly, public pages only); verify Search Console and submit `sitemap.xml`.
- [ ] **Decommission Railway + Neon** — old backend, no longer used.
- [ ] **Error monitoring** (e.g. Sentry) on the app screens.
- [ ] **Open Graph image** for link previews.

## 2. Core value — next
- [ ] ★ **Xero and MYOB timesheet exports** — ready-to-import files; ask for payroll settings (platform, pay items) at first export, not at signup.
- [ ] ★ **Notify staff on publish** — email first (Resend, near-free), SMS later (ClickSend/MessageMedia, ~5–8c each; likely a paid feature). Include "roster changed" notices for published weeks.
- [ ] ★ **Staff availability** — staff mark days/times they can't work; shown on the grid.
- [ ] **Public holidays** — highlight AU public holidays by state on the grid.
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
- [ ] **Pricing and billing** — owner decision on free vs paid tiers (earlier copy suggested free ≤10 staff, Pro $19/month with SMS; not decided).

## SEO and content
- [ ] More guides: printable/free roster template (could use the PDF), rostering around public holidays, how to roster a small café, casual vs part-time rostering basics (link to Fair Work, no legal advice).
- [ ] Review guide copy whenever a roadmap item ships, and move it from "not yet" to "now" in the FAQ and llms.txt.
