// Public guides. Every claim here must match what the product does TODAY —
// features that aren't built belong in ROADMAP.md, not in marketing copy.

export type Block =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { tip: string };

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
    updated: "2026-11-14",
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
        "Under More details (optional): email, and an hourly rate if you'd like a rough weekly wage total. Skip these if you don't need them.",
      ] },
      { h2: "3. Add shifts" },
      { p: "Open This week. You'll see your team down the side and Monday to Sunday across the top. Tap any cell to add a shift: pick a start and finish time, an unpaid break and a role, then save." },
      { ul: [
        "Shifts that finish after midnight are fine — set a finish time earlier than the start, like 5pm to 2am.",
        "Split shifts work too. Tap the same day again to add a second shift.",
        "Tap a shift to change or delete it.",
      ] },
      { tip: "SMEasy remembers each person's last shift times, so adding the same shift across several days is quick." },
      { p: "Each role has its own colour, so you can see the mix at a glance. Add a note to a shift if there's something the person needs to know, or tap a day's heading to add a note for the whole day." },
      { p: "Not sure who'll work a shift yet? Choose \"No one yet\" and it shows as unfilled. The Cover line under each day shows how many people are on, their hours and any unfilled shifts." },
      { tip: "Set your state under Settings and public holidays are marked on the roster." },
      { h2: "4. Copy last week" },
      { p: "Most rosters look a lot like last week's. On an empty week, tap Copy last week and every shift is copied across to the same days. Then just adjust what's different." },
      { h2: "5. Check hours and wages" },
      { p: "Above the grid, SMEasy shows the total paid hours for the week (after breaks) and each person's hours. If you've added hourly rates, it also shows a rough estimate of the week's wages — entirely optional." },
      { tip: "The wage figure uses base hourly rates only. It doesn't include penalty rates, overtime or super, so treat it as a guide." },
      { h2: "6. Publish to your team" },
      { p: "When the week is ready, tap Publish to team. Until then the roster is a draft only you can see. Once it's published, copy your team roster link into your staff group chat, or download the roster as a PDF to send or print." },
      { p: "You can keep editing after you publish — changes show up on the team link straight away." },
    ],
  },
  {
    slug: "share-roster-with-staff",
    title: "How to share your roster with staff (link or PDF)",
    description:
      "Two easy ways to get the roster to your team: one team link for your staff group chat, or a printable PDF. No staff app or passwords.",
    category: "Running your roster",
    updated: "2026-11-14",
    body: [
      { p: "Staff don't need an app, an account or a password to see the roster. SMEasy gives you two ways to share it, and you can use both." },
      { h2: "Option 1: the team roster link" },
      { p: "Every business has one team roster link. It always shows the latest published roster, so you only need to share it once." },
      { ol: [
        "Go to Team and copy the Team roster link (or tap Copy team link after you publish).",
        "Paste it in your staff group chat — WhatsApp, Messenger or whatever your team uses — and pin it.",
        "Each week, publish the roster and drop a quick \"next week's up\" in the chat.",
      ] },
      { p: "Staff open the link, pick their name to highlight their shifts and hours, and can flip between published weeks. The page remembers their name on that phone." },
      { tip: "Tell staff to add the link to their phone's home screen. It then opens like an app." },
      { h2: "Option 2: the PDF" },
      { p: "Tap PDF on This week to download the roster as a one-page A4 sheet: your team down the side, Monday to Sunday across, with shift times, roles and hours. Print it for the staff room or attach it in the group chat. Staff can download the same PDF from the team link." },
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
    updated: "2026-11-14",
    body: [
      { p: "Time-off requests in SMEasy replace the \"can I have Saturday off?\" texts. Requests land on your roster screen, and approved days show up right where you're building the week." },
      { h2: "How staff ask for time off" },
      { ol: [
        "Staff open their personal link. You send it from the Team page with Text personal link.",
        "They tap Request time off, pick the dates and add a reason if they like.",
        "They can see whether it's waiting, approved or declined each time they open the link.",
      ] },
      { h2: "How you approve or decline" },
      { p: "Pending requests appear at the top of This week for the week they fall in, with Approve and Decline buttons. Approved days show as Off in orange on that person's row, so you won't roster them by accident." },
      { tip: "If you copy last week and someone has approved time off, SMEasy tells you how many copied shifts clash so you can fix them." },
      { p: "SMEasy doesn't send notifications yet, so let staff know your decision, or they'll see it next time they open their link." },
      { h2: "Last-minute sick calls" },
      { p: "If someone calls in sick on the day, open This week, tap their shift and either delete it or change it to whoever's covering. Changes to a published roster show up on the team link straight away." },
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
      "How to download paid hours from SMEasy as a CSV for Xero, MYOB or your bookkeeper, shift by shift with a total for each person.",
    category: "Payroll",
    updated: "2026-11-14",
    body: [
      { p: "SMEasy works out the paid hours for every shift (finish time minus start time minus the unpaid break) and lets you download them as a spreadsheet for payroll." },
      { h2: "Download the hours" },
      { ol: [
        "Open the week on This week.",
        "Tap Hours CSV.",
        "Open the file in Excel, Numbers or Google Sheets, or send it to your bookkeeper.",
      ] },
      { p: "Each row is one shift: name, date, day, start, finish, unpaid break, rostered hours, actual hours and role. Underneath is a total for each person." },
      { p: "Actual hours start out the same as rostered hours. If someone stayed late or left early, change the number in the spreadsheet before you send it." },
      { tip: "Use the same names in SMEasy as in your payroll software, so your bookkeeper can match people at a glance." },
      { h2: "What the export doesn't do (yet)" },
      { ul: [
        "It's a general CSV, not a ready-to-import Xero or MYOB timesheet file. Direct Xero and MYOB formats are on our roadmap.",
        "It doesn't calculate penalty rates, overtime or allowances. Your payroll software or bookkeeper applies those from your award.",
      ] },
      { tip: "Download the hours at the end of each pay period and keep the files in one folder. That gives you a simple record of what was rostered." },
    ],
  },
  {
    slug: "mobile-rostering-tips",
    title: "Rostering from your phone: 5 tips",
    description:
      "SMEasy works in your phone's browser. Tips for building and changing the roster on mobile, and adding SMEasy to your home screen.",
    category: "Running your roster",
    updated: "2026-11-14",
    body: [
      { p: "There's nothing to install. SMEasy runs in your phone's browser, and the roster screen is laid out for small screens." },
      { h2: "1. Use the day cards" },
      { p: "On a phone, This week switches from the wide grid to one card per day. Tap + Add shift on a day, choose who, set the times and save." },
      { h2: "2. Fix call-outs in seconds" },
      { p: "Someone can't make it? Tap their shift, then delete it or switch it to whoever's covering. If the week's already published, the team link updates immediately." },
      { h2: "3. Put SMEasy on your home screen" },
      { ul: [
        "iPhone: open smeasy.au in Safari, tap Share, then Add to Home Screen.",
        "Android: open smeasy.au in Chrome, tap the ⋮ menu, then Add to Home screen.",
      ] },
      { h2: "4. Share from your phone" },
      { p: "After you publish, tap Copy team link and paste it into your group chat, or download the PDF and share it straight from your phone." },
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
    updated: "2026-11-14",
    body: [
      { p: "A good roster keeps the business covered and the team happy. These habits work whatever tool you use." },
      { h2: "1. Publish at least a week ahead" },
      { p: "Staff, especially casuals with uni or second jobs, need to plan their lives. Pick a regular day to publish the next week, such as every Thursday, and stick to it. Some awards also set notice requirements for roster changes." },
      { h2: "2. Share the good and bad shifts" },
      { ul: [
        "Rotate weekend, early and closing shifts so the same people don't always get them.",
        "Keep an eye on each person's weekly hours. SMEasy shows them next to every name.",
        "Give steady patterns to people who want them. Copy last week makes that easy.",
      ] },
      { h2: "3. Put your best people on peak times" },
      { p: "Roster experienced staff for your busiest periods, like Friday and Saturday nights or the lunch rush, and use quieter times to train newer people alongside them." },
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
        "You update the roster: tap each shift on This week and change who's working.",
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
    updated: "2026-11-14",
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
        "One team link that always shows the latest published roster, plus a printable PDF.",
        "Day-by-day cards on phones, a full grid on a laptop.",
        "Paid hours worked out for you, including breaks, split shifts and shifts past midnight.",
        "Copy last week in one tap.",
        "Time-off requests from staff, shown right on the roster when approved.",
        "Hours export for Xero, MYOB or your bookkeeper, shift by shift.",
      ] },
      { h2: "When a spreadsheet is fine" },
      { p: "If you have two or three staff on the same hours every week, a spreadsheet may be all you need. SMEasy earns its place when the roster changes often, you have casuals, or you're tired of answering \"what's my shift?\"" },
    ],
  },
];

export const guideBySlug = (slug: string) => guides.find((g) => g.slug === slug);
