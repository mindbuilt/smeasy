// Public FAQ. Answers must match the product as it is today.

export interface Faq { q: string; a: string }
export interface FaqGroup { title: string; items: Faq[] }

export const faqGroups: FaqGroup[] = [
  {
    title: "About SMEasy",
    items: [
      { q: "What is SMEasy?", a: "SMEasy is simple rostering for Australian small businesses. You build the week's roster, see any gaps in cover, share it with your team by link, email or PDF, handle time-off requests, confirm the hours actually worked, and send them to payroll." },
      { q: "Who is it for?", a: "Owners and managers of small teams — cafés, restaurants, bars, shops and other businesses rostering a handful to a few dozen people, often casuals. If you want rostering without a big HR system, it's built for you." },
      { q: "How much does it cost?", a: "SMEasy is free for up to 6 staff, and no credit card is needed. Plus is one flat price for unlimited staff: $29 a month or $290 a year, plus GST. There are no per-user fees. Pro adds payroll sync with Xero (MYOB is coming) for $49 a month or $490 a year, plus GST." },
      { q: "Do I need to install anything?", a: "No. SMEasy runs in the browser on your phone, tablet or computer. You can add it to your phone's home screen so it opens like an app." },
      { q: "Where is my data stored?", a: "In Australia. SMEasy's database is hosted in Sydney. Our privacy policy explains what we collect and which providers we use." },
      { q: "How do I get help, or delete my account?", a: "Email hello@smeasy.au. We'll delete your account and your business's data within 30 days of your request. Before you do, download your hours (Hours → Export dates): employers must keep time and wage records for 7 years." },
    ],
  },
  {
    title: "Building the roster",
    items: [
      { q: "How do I sign in?", a: "With your email and a password, or with a login link we email you. Choose whichever suits. You can set or change your password any time under Settings → Your login. You stay signed in on each device until you log out." },
      { q: "Can I copy last week's roster?", a: "Yes. On an empty week, tap Copy last week and every shift is copied to the same days, ready to adjust." },
      { q: "Does it handle split shifts and shifts past midnight?", a: "Yes. Add two shifts on the same day for a split shift. For a late close, set a finish time earlier than the start — for example 5pm to 2am — and SMEasy counts the hours correctly." },
      { q: "How are hours worked out?", a: "Paid hours are the finish time minus the start time minus any unpaid break you set on the shift. SMEasy shows each person's weekly hours and the team total." },
      { q: "Can I see a day hour by hour, and spot gaps?", a: "Yes. Switch to Day view on the roster (on a phone, tap the calendar icon on a day). Hours run down the page like a calendar, and any time with nobody on shows as a red band, with a button to fill it. Under each day in the week view, a small bar shows red where the gaps are." },
      { q: "Does my week have to start on Monday?", a: "No. Pick the day your week starts under Settings, for example to match your pay week. Shifts you've already rostered keep their dates and are regrouped into the new weeks." },
      { q: "Does SMEasy track overtime?", a: "It shows when someone's rostered above their usual hours, as a quiet note on the roster. Set each person's usual hours a week on the Team page (38 by default). It doesn't work out overtime or penalty pay." },
      { q: "Can SMEasy estimate wages?", a: "No. SMEasy works out hours, not pay. Wages depend on your award's penalty rates, overtime and allowances, so your payroll software works out pay from the hours you approve. On Pro, approved hours go straight to Xero Payroll." },
      { q: "Does SMEasy check my roster against my award?", a: "No. SMEasy doesn't check minimum engagement, breaks, roster notice or penalty rates, because they depend on your award. The Fair Work Ombudsman (fairwork.gov.au) has guides to rosters and record-keeping for each award, or ask your bookkeeper." },
      { q: "Does SMEasy show public holidays?", a: "Yes. Set your state under Settings and public holidays are marked on your roster, the team link and the PDF. They come from a published Australian holiday calendar, so check your state's official list if anything looks off — and you can add your own note to any day." },
      { q: "Can I add a shift before I know who's working it?", a: "Yes. Choose \"No one yet\" when you add a shift and it shows as unfilled, so you can see the gaps. Staff don't see unfilled shifts. Assign someone when you know." },
      { q: "Can I leave notes for staff?", a: "Yes. Add a note to a shift (like \"Open up — keys in the safe\") or to a whole day (like \"Function from 6pm\"). Staff see them once the roster is published." },
      { q: "Can I change the shift roles?", a: "Yes. When you sign up you pick a starting set (café, retail or general), and you can add or remove roles any time on the Team page." },
    ],
  },
  {
    title: "Your team",
    items: [
      { q: "Do my staff need an app or an account?", a: "No. Staff view the roster on a link in their browser — no app, no sign-up, no password." },
      { q: "How do staff see the roster?", a: "Share your team roster link in your staff group chat once. It always shows the latest published roster. Staff pick their name to highlight their shifts and can download a PDF. You can also download the PDF yourself to print or send." },
      { q: "Can staff see the roster before it's finished?", a: "No. Rosters stay as private drafts until you tap Publish to team." },
      { q: "What can staff see?", a: "Names, days, shift times and roles on published rosters. They never see pay rates, phone numbers or emails." },
      { q: "Someone left — how do I stop them seeing the roster?", a: "Remove them on the Team page, and tap Reset the link on the team roster link card. The old link stops working straight away; share the new one with your team." },
      { q: "How do staff request time off?", a: "Each person has a personal link, which you send from the Team page. They tap Request time off and pick the dates. Requests appear on your roster screen with Approve and Decline." },
      { q: "Can staff get their shifts in their phone's calendar?", a: "Yes. From their personal link, staff tap to subscribe in Apple Calendar, Google Calendar or Outlook. Their published shifts appear in their calendar and update automatically when you change the roster." },
      { q: "Does SMEasy send notifications?", a: "Yes, by email. When you publish, everyone rostered who has an email address gets their shifts and their personal link. After changes, tap Email the team to send the latest. Add emails on the Team page, or staff can add their own on their personal link, and every email has a link to stop them. Phone push notifications are on our roadmap." },
      { q: "Can staff swap shifts in the app?", a: "Not yet. Staff agree a swap between themselves, check with you, and you update the roster. There's a guide on setting up a simple swap process." },
    ],
  },
  {
    title: "Payroll",
    items: [
      { q: "How do timesheets work?", a: "After the day, open Hours. Every shift starts as rostered, so you only change what was different, like someone staying late, or mark that they didn't work. When the week's done, approve the hours. Then send them to Xero or download them as a spreadsheet (CSV)." },
      { q: "Does SMEasy work with Xero or MYOB?", a: "Xero, yes, on Pro. Connect Xero Payroll under Settings → Payroll, match your staff to their Xero employees once, and approved hours go to Xero as draft timesheets in the right pay period, ready for you to check and approve in your pay run. MYOB sync is on our roadmap; for now, download the hours as a spreadsheet (CSV) for MYOB or your bookkeeper." },
      { q: "Does SMEasy run payroll?", a: "No. SMEasy handles the roster and the hours; your payroll software pays your staff." },
      { q: "Does SMEasy keep my time and wage records?", a: "It helps with the time side. On the Timesheets page you record each person's actual start, finish and breaks, and approve the week. Approved hours can't be deleted, and any later change needs a reason and is kept in a history. Each person's employment type (casual, part-time or full-time) is recorded too. Pay, super, leave and payslips are kept in your payroll software, not SMEasy. You must keep time and wage records for 7 years, so export each year's hours (Hours → Export dates) or keep them in Xero. Keeping compliant records is your responsibility as the employer; check the Fair Work Ombudsman's record-keeping rules for your award." },
      { q: "Can I have more than one manager or location?", a: "Not yet — each business has one owner login and one location for now." },
    ],
  },
];
