// Public FAQ. Answers must match the product as it is today.

export interface Faq { q: string; a: string }
export interface FaqGroup { title: string; items: Faq[] }

export const faqGroups: FaqGroup[] = [
  {
    title: "About Smeasy",
    items: [
      { q: "What is Smeasy?", a: "Smeasy is simple rostering for Australian small businesses. You build the week's roster, share it with your team using one link or a PDF, handle time-off requests, and download the hours for payroll." },
      { q: "Who is it for?", a: "Owners and managers of small teams — cafés, restaurants, bars, shops and other businesses rostering a handful to a few dozen people, often casuals. If you want rostering without a big HR system, it's built for you." },
      { q: "How much does it cost?", a: "Smeasy is free while we're in early access. No credit card is needed to sign up. If we introduce paid plans later, we'll tell you well in advance." },
      { q: "Do I need to install anything?", a: "No. Smeasy runs in the browser on your phone, tablet or computer. You can add it to your phone's home screen so it opens like an app." },
      { q: "Where is my data stored?", a: "In Australia. Smeasy's database is hosted in Sydney. Our privacy policy explains what we collect and which providers we use." },
      { q: "How do I get help, or delete my account?", a: "Email hello@smeasy.au. We'll delete your account and your business's data within 30 days of your request." },
    ],
  },
  {
    title: "Building the roster",
    items: [
      { q: "How do I sign in?", a: "Enter your email and we send you a login link. There's no password. The link works on any device, and you stay signed in after that." },
      { q: "Can I copy last week's roster?", a: "Yes. On an empty week, tap Copy last week and every shift is copied to the same days, ready to adjust." },
      { q: "Does it handle split shifts and shifts past midnight?", a: "Yes. Add two shifts on the same day for a split shift. For a late close, set a finish time earlier than the start — for example 5pm to 2am — and Smeasy counts the hours correctly." },
      { q: "How are hours worked out?", a: "Paid hours are the finish time minus the start time minus any unpaid break you set on the shift. Smeasy shows each person's weekly hours and the team total." },
      { q: "Can Smeasy estimate wages?", a: "Yes, if you add an hourly rate for each person (it's optional, under More details). The estimate uses base rates only — it doesn't include penalty rates, overtime, allowances or super." },
      { q: "Does Smeasy check my roster against my award?", a: "No. Smeasy doesn't check minimum engagement, breaks or penalty rates. Check your award on the Fair Work Ombudsman website, or ask your bookkeeper." },
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
      { q: "Does Smeasy send notifications?", a: "Not yet. When you publish, let your team know in your group chat — the team link will already show the new week. Automatic notifications are on our roadmap." },
      { q: "Can staff swap shifts in the app?", a: "Not yet. Staff agree a swap between themselves, check with you, and you update the roster. There's a guide on setting up a simple swap process." },
    ],
  },
  {
    title: "Payroll",
    items: [
      { q: "Does Smeasy work with Xero or MYOB?", a: "You can download the week's hours as a spreadsheet (CSV) — every shift with its day, times, breaks and hours, plus a total per person — and use it in Xero or MYOB or send it to your bookkeeper. Ready-to-import Xero and MYOB timesheet files are on our roadmap." },
      { q: "Does Smeasy run payroll?", a: "No. Smeasy handles the roster and the hours; your payroll software pays your staff." },
      { q: "Can I have more than one manager or location?", a: "Not yet — each business has one owner login and one location for now." },
    ],
  },
];
