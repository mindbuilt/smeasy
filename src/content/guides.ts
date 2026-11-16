// Public guides. Every claim here must match what the product does TODAY —
// features that aren't built belong in ROADMAP.md, not in marketing copy.

export type Block =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { tip: string }
  // A real screenshot from public/product/ (see components/DeviceShot.tsx)
  | { shot: "roster-week-desktop" | "roster-day-phone" | "add-shift-phone" | "staff-link-phone" | "time-off-phone" | "team-phone"; alt: string; caption: string };

export interface Guide {
  slug: string;
  title: string;
  description: string; // meta description, ~150 chars
  category: "Getting started" | "Running your roster" | "Payroll" | "Advice";
  updated: string; // YYYY-MM-DD
  body: Block[];
}

export const guides: Guide[] = [
  {
    slug: "how-to-create-a-roster",
    title: "How to make a staff roster in 5 minutes",
    description:
      "A step-by-step guide to building your first weekly staff roster in SMEasy — add your team, add shifts, copy last week and publish.",
    category: "Getting started",
    updated: "2026-11-16",
    body: [
      { p: "This guide walks through your first roster in SMEasy, from signing up to publishing the week to your team. Most small teams are done in about five minutes." },
      { h2: "1. Sign up with your email" },
      { p: "Go to smeasy.au and tap Get started. Enter your email and choose a password, then confirm your email from the message we send you. Prefer not to have a password? Tap “Email me a login link instead” and open the link on any device." },
      { p: "The first time, SMEasy asks for your business name and what kind of business you run (café or restaurant, retail, or other). That sets up a starting list of shift roles, like Floor, Kitchen and Barista. You can change the roles any time." },
      { h2: "2. Add your team" },
      { p: "On the Team page, type each person's name and tap Add. That's all you need to start rostering." },
      { p: "Tap a name to add optional details:" },
      { ul: [
        "Usual role — new shifts for that person default to it.",
        "Mobile — handy for texting them their link.",
        "Email — they get their shifts by email whenever you publish. Staff can also add their own email on their personal link.",
        "Usual hours a week — 38 by default. The roster quietly shows when you give someone more.",
      ] },
      { shot: "team-phone", alt: "The SMEasy Team page on a phone, listing staff with their usual roles and Edit, Text link and Copy link buttons", caption: "The Team page: everyone's usual role, and their link ready to text or copy." },
      { h2: "3. Add shifts" },
      { p: "Open Roster. You'll see your team down the side and the days of the week across the top (Monday to Sunday, unless you pick a different start day in Settings). Tap any cell to add a shift: pick a start and finish time, an unpaid break and a role, then save." },
      { ul: [
        "Shifts that finish after midnight are fine — set a finish time earlier than the start, like 5pm to 2am.",
        "Split shifts work too. Tap the same day again to add a second shift.",
        "Tap a shift to change or delete it.",
      ] },
      { tip: "SMEasy remembers each person's last shift times, so adding the same shift across several days is quick." },
      { p: "Each role has its own colour, so you can see the mix at a glance. Add a note to a shift if there's something the person needs to know, or tap a day's heading to add a note for the whole day." },
      { p: "Same hours on several days? Under \"Also add on\", tap the other days (or Weekdays or Every day) and SMEasy adds the shift to all of them at once. Editing a shift works the same way, under \"Copy to other days\"." },
      { shot: "add-shift-phone", alt: "The Add shift sheet on a phone: Ben picked, 8am to 12pm, Manager role, and Tuesday to Friday selected under Also add on", caption: "One shift, five days: pick the other days under \"Also add on\" and save once." },
      { p: "Not sure who'll work a shift yet? Add it in the Unfilled row at the top of the roster (or choose \"No one yet\" in the shift editor) and it shows in red as unfilled. Staff don't see unfilled shifts. The Cover line under each day shows how many people are on, their hours and any unfilled shifts." },
      { shot: "roster-week-desktop", alt: "A week's roster in SMEasy on a laptop: seven staff, shifts colour-coded by role, an unfilled Sunday shift in red, a time-off request and the cover count under each day", caption: "The whole week on a laptop: roles in colour, the unfilled shift in red, cover under each day." },
      { p: "To check cover, switch to Day view (top right on a laptop; on a phone, tap the calendar icon on a day). The day reads like a calendar, hours down the page, and any time with nobody on shows as a red band with a Fill this gap button. In the week view, the bar under each day shows red where the gaps are." },
      { tip: "Set your state under Settings and public holidays are marked on the roster." },
      { h2: "4. Copy last week" },
      { p: "Most rosters look a lot like last week's. On an empty week, tap Copy last week and every shift is copied across to the same days. Then just adjust what's different." },
      { h2: "5. Check the hours" },
      { p: "Above the grid, SMEasy shows the total paid hours for the week (after breaks) and each person's hours. If someone's rostered above their usual hours, you'll see a small note. When the week's done, confirm what was actually worked on the Hours page and send it to payroll." },
      { h2: "6. Publish to your team" },
      { p: "When the week is ready, tap Publish to team. Until then the roster is a draft only you can see. When you publish, everyone rostered who has an email gets their shifts by email, and SMEasy tells you who doesn't have one yet. You can also copy your team roster link into your staff group chat, or download the roster as a PDF to send or print." },
      { p: "You can keep editing after you publish — changes show up on the team link straight away. Tap Email the team to send everyone their updated shifts." },
    ],
  },
  {
    slug: "share-roster-with-staff",
    title: "How to share your roster with staff (link or PDF)",
    description:
      "Two easy ways to get the roster to your team: one team link for your staff group chat, or a printable PDF. No staff app or passwords.",
    category: "Running your roster",
    updated: "2026-11-16",
    body: [
      { p: "Staff don't need an app, an account or a password to see the roster. SMEasy gives you three ways to share it, and you can use them all." },
      { h2: "Option 1: the team roster link" },
      { p: "Every business has one team roster link. It always shows the latest published roster, so you only need to share it once." },
      { ol: [
        "Go to Team and copy the Team roster link (or tap Copy team link after you publish).",
        "Paste it in your staff group chat — WhatsApp, Messenger or whatever your team uses — and pin it.",
        "Each week, publish the roster and drop a quick \"next week's up\" in the chat.",
      ] },
      { p: "Staff open the link, pick their name to highlight their shifts and hours, and can flip between published weeks. The page remembers their name on that phone." },
      { shot: "staff-link-phone", alt: "The team roster link on a staff member's phone: Jack's next shift, 7am to 11am tomorrow, above the day's full roster with his shift highlighted", caption: "What staff see: their next shift up top, the whole team below." },
      { tip: "Tell staff to add the link to their phone's home screen. It then opens like an app." },
      { h2: "Option 2: email" },
      { p: "When you publish, everyone rostered who has an email address gets an email with their own shifts for the week, any notes, and a button to their personal link. Replies come to you." },
      { ul: [
        "Add emails on the Team page (tap a name, then Edit). Anyone without one shows \"Add email for roster emails\".",
        "Staff can add or change their own email on their personal link, under Roster by email.",
        "Changed something after publishing? Tap Email the team (on a phone, it's under the … button) to send everyone their latest shifts.",
        "Every email has a link to stop roster emails, and staff can turn them back on from their personal link.",
      ] },
      { h2: "Option 3: the PDF" },
      { p: "Tap PDF on the Roster (on a phone, it's under the … button) to download the roster as a one-page A4 sheet: your team down the side, the week's days across, with shift times, roles and hours. Print it for the staff room or attach it in the group chat. Staff can download the same PDF from the team link." },
      { h2: "What staff can and can't see" },
      { ul: [
        "They see published weeks only. Drafts stay private until you publish.",
        "They see names, days, shift times and roles.",
        "They never see pay rates, phone numbers or emails.",
      ] },
      { p: "Anyone with the team link can view the roster, so if someone leaves on bad terms, tap Reset the link on the Team page and share the new one. The old link stops working immediately." },
      { h2: "Personal links: time off and calendars" },
      { p: "Each person also has their own personal link (Team → Text personal link). It shows their shifts and lets them request time off, because SMEasy needs to know who's asking." },
      { p: "From their personal link, staff can also subscribe to their shifts in Apple Calendar, Google Calendar or Outlook. Published shifts then appear in their phone's calendar and update when you change the roster." },
    ],
  },
  {
    slug: "managing-time-off-requests",
    title: "Managing staff time-off requests",
    description:
      "How staff request time off in SMEasy, how you approve or decline it, and simple rules that keep leave requests fair.",
    category: "Running your roster",
    updated: "2026-11-16",
    body: [
      { p: "Time-off requests in SMEasy replace the \"can I have Saturday off?\" texts. Requests land on your roster screen, and approved days show up right where you're building the week." },
      { h2: "How staff ask for time off" },
      { ol: [
        "Staff open their personal link. You send it from the Team page with Text personal link.",
        "They tap Request time off, pick the dates and add a reason if they like.",
        "They can see whether it's waiting, approved or declined each time they open the link.",
      ] },
      { h2: "How you approve or decline" },
      { p: "Pending requests appear at the top of the Roster for the week they fall in, with Approve and Decline buttons. Approved days show as Off in orange on that person's row, so you won't roster them by accident." },
      { shot: "time-off-phone", alt: "The roster on a phone with Lily Chen's time-off request for a family wedding at the top, with Approve and Decline buttons", caption: "A pending request sits at the top of the roster until you approve or decline it." },
      { tip: "If you copy last week and someone has approved time off, SMEasy tells you how many copied shifts clash so you can fix them." },
      { p: "SMEasy doesn't email time-off decisions yet, so let staff know, or they'll see it next time they open their link." },
      { h2: "Last-minute sick calls" },
      { p: "If someone calls in sick on the day, open the Roster, tap their shift and either delete it or change it to whoever's covering. Changes to a published roster show up on the team link straight away." },
      { h2: "Simple rules that keep it fair" },
      { ul: [
        "Set a notice period, such as two weeks for planned leave, and stick to it.",
        "Approve in the order requests come in for busy dates like school holidays and Christmas.",
        "Check you'll still have enough people on before approving.",
        "If you decline, say why. Staff take a \"no\" better when they know the reason.",
      ] },
      { p: "For annual leave entitlements and other rules for permanent staff, check the Fair Work Ombudsman website or your award." },
    ],
  },
  {
    slug: "export-to-payroll",
    title: "Getting roster hours into Xero or MYOB",
    description:
      "Confirm the hours your team actually worked, approve the week, then send it to Xero Payroll or download a spreadsheet for MYOB or your bookkeeper.",
    category: "Payroll",
    updated: "2026-11-16",
    body: [
      { p: "SMEasy works out the paid hours for every shift (finish time minus start time minus the unpaid break). At the end of the week you confirm what actually happened, approve it, and send it to payroll." },
      { h2: "1. Confirm the hours on the Hours page" },
      { ol: [
        "Open Hours and pick the week.",
        "Every shift starts as rostered. Only change what was different: a later finish, a longer break.",
        "If someone didn't work a shift, tap Didn't work. As rostered undoes a change.",
      ] },
      { p: "The totals show rostered and worked hours for each person. Days that haven't happened yet can't be changed." },
      { h2: "2. Approve the week" },
      { p: "When the week's done, tap Approve hours. That locks the week so nothing changes by accident. Tap Edit hours if you need to unlock it." },
      { h2: "3a. Send to Xero Payroll" },
      { ol: [
        "Once: go to Settings → Payroll, tap Connect to Xero and choose your organisation.",
        "Once: match each person to their Xero employee. Exact name matches are filled in for you.",
        "Each week: after approving, tap Send to Xero.",
      ] },
      { p: "The hours arrive in Xero Payroll as draft timesheets, in each employee's pay period. Check them in Xero and approve them in your pay run as usual. If a timesheet for that period is already approved in Xero, SMEasy leaves it alone." },
      { tip: "Xero sync is part of Pro, which is coming soon. It works with weekly, fortnightly and four-weekly pay calendars." },
      { h2: "3b. Or download a spreadsheet" },
      { p: "Tap Download CSV (Hours for payroll on the Roster works too). Each row is one shift: name, date, day, start, finish, unpaid break, rostered hours, worked hours, role and a note if it changed. Underneath is a total for each person. Use it for MYOB or send it to your bookkeeper." },
      { tip: "Use the same names in SMEasy as in your payroll software, so matching people is easy." },
      { h2: "What SMEasy doesn't do" },
      { ul: [
        "It doesn't calculate penalty rates, overtime or allowances. Your payroll software or bookkeeper applies those from your award.",
        "There's no direct MYOB sync yet. It's on our roadmap; use the CSV for now.",
      ] },
    ],
  },
  {
    slug: "mobile-rostering-tips",
    title: "Rostering from your phone: 5 tips",
    description:
      "SMEasy works in your phone's browser. Tips for building and changing the roster on mobile, and adding SMEasy to your home screen.",
    category: "Running your roster",
    updated: "2026-11-16",
    body: [
      { p: "There's nothing to install. SMEasy runs in your phone's browser, and the roster screen is laid out for small screens." },
      { h2: "1. Use the day cards" },
      { p: "On a phone, the roster shows one day at a time. Tap a day in the strip at the top (or swipe left and right), then tap + to add a shift: choose who, set the times and save. Copy last week, the PDF, payroll hours and Email the team are under the … button. Tap the calendar icon on a day to see it hour by hour, with any gaps in red." },
      { shot: "roster-day-phone", alt: "The SMEasy roster on a phone showing Monday's shifts as cards under the week strip, with the add button and bottom tab bar", caption: "One day at a time, with the week strip on top and + to add a shift." },
      { h2: "2. Fix call-outs in seconds" },
      { p: "Someone can't make it? Tap their shift, then delete it or switch it to whoever's covering. If the week's already published, the team link updates immediately." },
      { h2: "3. Put SMEasy on your home screen" },
      { ul: [
        "iPhone: open smeasy.au in Safari, tap Share, then Add to Home Screen.",
        "Android: open smeasy.au in Chrome, tap the ⋮ menu, then Add to Home screen.",
      ] },
      { h2: "4. Share from your phone" },
      { p: "When you publish, staff with an email get their shifts automatically. You can also tap Copy team link and paste it into your group chat, or download the PDF and share it straight from your phone." },
      { h2: "5. Stay signed in" },
      { p: "SMEasy keeps you signed in on your phone, so you won't need to log in every time. If you do get signed out, log in with your email and password, or request a login link and open it on the same phone. You can set a password under Settings → Your login." },
    ],
  },
  {
    slug: "shift-scheduling-best-practices",
    title: "Shift scheduling best practices for small businesses",
    description:
      "Practical rostering advice for Australian cafés, restaurants and shops: plan ahead, share the load fairly, cover peak times and check your award.",
    category: "Advice",
    updated: "2026-11-16",
    body: [
      { p: "A good roster keeps the business covered and the team happy. These habits work whatever tool you use." },
      { h2: "1. Publish at least a week ahead" },
      { p: "Staff, especially casuals with uni or second jobs, need to plan their lives. Pick a regular day to publish the next week, such as every Thursday, and stick to it. Some awards also set notice requirements for roster changes." },
      { h2: "2. Share the good and bad shifts" },
      { ul: [
        "Rotate weekend, early and closing shifts so the same people don't always get them.",
        "Keep an eye on each person's weekly hours. SMEasy shows them next to every name, and notes when someone's above their usual hours.",
        "Give steady patterns to people who want them. Copy last week makes that easy.",
      ] },
      { h2: "3. Put your best people on peak times" },
      { p: "Roster experienced staff for your busiest periods, like Friday and Saturday nights or the lunch rush, and use quieter times to train newer people alongside them. Day view in SMEasy shows each day hour by hour, so you can check the lunch rush is covered and spot any time with nobody on." },
      { h2: "4. Know who's available" },
      { p: "Ask staff for the days and times they can't work and keep a note. Approved time off shows on the roster in SMEasy, so you won't double-book someone who's away." },
      { h2: "5. Have a plan for sick calls" },
      { p: "Know who's usually happy to pick up an extra shift, and tell staff how to let you know they're sick (and by when)." },
      { h2: "6. Check your award" },
      { p: "Most Australian small businesses are covered by a modern award that sets rules about rosters, including:" },
      { ul: [
        "minimum engagement (the shortest shift you can roster)",
        "breaks, and the time off required between shifts",
        "penalty rates for weekends, public holidays and late nights",
        "how much notice you must give for roster changes",
      ] },
      { p: "SMEasy doesn't check rosters against awards. Use the Fair Work Ombudsman's website and pay tools, or ask your bookkeeper or industry association, for the rules that apply to you." },
    ],
  },
  {
    slug: "staff-shift-swaps",
    title: "How to handle staff shift swaps",
    description:
      "A simple, fair process for staff swapping shifts, the rules worth setting, and how to update the roster in SMEasy once a swap is agreed.",
    category: "Advice",
    updated: "2026-11-14",
    body: [
      { p: "Letting staff swap shifts keeps the roster covered and stops people calling in sick when something comes up. It just needs a few clear rules." },
      { h2: "A simple swap process" },
      { ol: [
        "The staff member finds someone to swap with, usually in the staff group chat.",
        "Both people message you to confirm the swap.",
        "You check it works — the right skills, and nobody pushed into too many hours.",
        "You update the roster: tap each shift on the Roster and change who's working.",
        "Because the roster's published, the team link shows the change straight away.",
      ] },
      { p: "SMEasy doesn't automate swaps. You make the change on the roster, which keeps you in control of who's working." },
      { h2: "Rules worth setting" },
      { ul: [
        "Swaps need your OK. Nothing changes until you've confirmed.",
        "Like for like: a barista swaps with a barista, a closer with a closer.",
        "Give notice, for example 24–48 hours unless it's an emergency.",
        "Watch hours and pay: a swap that pushes someone into overtime or a penalty-rate shift costs you more.",
      ] },
    ],
  },
  {
    slug: "why-smeasy-vs-spreadsheets",
    title: "SMEasy vs a spreadsheet roster",
    description:
      "Spreadsheets are free and familiar. Here's an honest look at where a spreadsheet roster struggles and what SMEasy does differently.",
    category: "Advice",
    updated: "2026-11-16",
    body: [
      { p: "Plenty of small businesses run their roster in Excel or Google Sheets, and it works — until the team grows or the roster changes every week. Here's an honest comparison." },
      { h2: "Where spreadsheets struggle" },
      { ul: [
        "Sharing: every change means sending the file or a screenshot again, and staff end up looking at old versions.",
        "Phones: a seven-day grid is hard to read and edit on a small screen.",
        "Hours: totals depend on formulas, which break when rows are added or shifts cross midnight.",
        "Time off: requests arrive by text and live in your head.",
      ] },
      { h2: "What SMEasy does differently" },
      { ul: [
        "One team link that always shows the latest published roster, roster emails when you publish, and a printable PDF.",
        "Gaps in cover shown in red, hour by hour.",
        "Day-by-day cards on phones, a full grid on a laptop.",
        "Paid hours worked out for you, including breaks, split shifts and shifts past midnight.",
        "Copy last week in one tap.",
        "Time-off requests from staff, shown right on the roster when approved.",
        "Timesheets: confirm the hours actually worked and send them to Xero, or export a spreadsheet for MYOB or your bookkeeper.",
      ] },
      { h2: "When a spreadsheet is fine" },
      { p: "If you have two or three staff on the same hours every week, a spreadsheet may be all you need. SMEasy earns its place when the roster changes often, you have casuals, or you're tired of answering \"what's my shift?\"" },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);
