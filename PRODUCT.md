# Smeasy: Product Definition

## Product Vision
**Smeasy** is a lightweight, mobile-first roster management tool built for Australian small hospitality businesses. It eliminates the chaos of pen-and-paper rosters and spreadsheets with a tool that takes 30 seconds to master.

## Target User

**Primary Persona: The Cafe/Bar Manager**
- Age: 25–50
- Tech comfort: Low to moderate (uses phone and email, not tech-savvy)
- Pain point: Managing 5–20 staff across weekly shifts
- Context: Often on mobile, time-pressured, multi-tasking
- Location: Australia (uses local language, understands Australian workplace norms)
- Business: Hospitality (cafe, bar, restaurant, venue)

**Success for this user:**
- Creates a weekly roster in under 5 minutes
- Publishes it and staff get notified instantly
- Can edit on the fly (phone call: "I can't come in Tue" → remove shift in 10 seconds)
- Exports to payroll/accounting software (Xero, MYOB)

## Value Proposition

**Problem:** Managing rosters is a mess
- Pen and paper loses data
- Google Sheets has no notifications
- Expensive payroll software is overkill
- Staff don't know their shifts until last minute

**Solution:** Smeasy does one thing perfectly
- Create roster in seconds
- Staff see their shifts instantly (notifications)
- Works on phone (where managers live)
- Exports for payroll in one click
- Free tier for <10 staff

**Why Smeasy?**
- Dead simple (non-technical users get it immediately)
- Fast (no training needed)
- Local (Australian time zones, language, workplace understanding)
- Affordable (free for small businesses)

## Core Features

### MVP (Current)
1. **Roster Creation** — drag-and-drop weekly shifts for each staff member
2. **Shift Assignment** — assign start/end time, role (Floor, Kitchen, Barista, Bar, Manager, Other)
3. **Time Off Requests** — staff can request days off (manager approves)
4. **Staff Management** — add/remove staff, set who's rostered
5. **Export** — download as spreadsheet for Xero/MYOB import
6. **Publish & Notify** — send roster to staff (SMS or in-app)

### Post-MVP (Planned)
1. Recurring shifts (e.g., "Sarah works Tuesday & Thursday every week")
2. Availability calendar (staff set their available days)
3. Shift swaps (staff trade shifts peer-to-peer)
4. Payroll integration (direct Xero/MYOB sync)
5. Analytics (hours per staff, labor cost per shift)

## Success Metrics

- **Adoption:** 100+ Australian hospitality businesses using Smeasy by end of 2025
- **Retention:** >80% of free-tier users upgrade to paid within 6 months
- **NPS:** >60 (strong recommendation to other managers)
- **Daily Active Users:** 2x month-on-month growth

## Tone & Brand Voice

**Smeasy speaks like an Aussie manager to other managers**
- Friendly, conversational (not corporate)
- Direct and honest (no buzzwords)
- Helpful without being patronizing
- Uses Australian English (colour, favour, realise)
- Understands hospitality culture (staff turnover, last-minute callouts, penalty rates)

**Examples:**
- ✅ "Add a day off" (not "request time off exception")
- ✅ "Your roster is live" (not "roster has been published")
- ✅ "Shift swap pending approval" (not "pending time-off state change")

## Technical Constraints

- **Platform:** Web-first (desktop + mobile), responsive
- **Performance:** Must load in <2s on 4G
- **Storage:** Serverless architecture (Railway backend, Vercel frontend)
- **Auth:** Email/password, no social login (SME privacy concern)
- **Accessibility:** WCAG AA minimum (duty of care for staff)

## Go-to-Market

1. **Landing page** (smeasy.au) — explain value in 30 seconds, CTA to sign up
2. **Content pages** — "How to Create a Roster", "Why Smeasy Over Spreadsheets", "Shift Scheduling Guide"
3. **Word of mouth** — free tier drives organic adoption in hospitality networks
4. **Paid tier** — $19/month unlocks SMS notifications, unlimited staff, 2-year retention

## Competitive Landscape

- **Pencil + paper:** No notifications, loses data, manual exports
- **Google Sheets:** No notifications, no integrations, staff confusion
- **Jotform/Typeform:** Designed for surveys, not workflows
- **Expensive tools (Deputy, BinB, Toast):** $50+/month, overkill for small venues
- **Smeasy niche:** Simple, affordable, Australian, hospitality-first

## Platform & Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Railway.app (Node API)
- **Database:** PostgreSQL
- **Deployment:** Vercel (smeasy.au)
- **Auth:** Custom email/password (no OAuth complexity)
