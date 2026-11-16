import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { pageTitle, link } from "@/lib/mkt";
import { ABN, CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that apply when you use SMEasy, the rostering app for small businesses.",
  alternates: { canonical: "/terms/" },
};

const UPDATED = "17 November 2026";

const h2: CSSProperties = { fontSize: 22, fontWeight: 800, letterSpacing: "-0.015em", margin: "40px 0 12px" };
const p: CSSProperties = { fontSize: 16, lineHeight: 1.65, color: "#374151", margin: "0 0 12px" };
const ul: CSSProperties = { ...p, paddingLeft: 22, listStyle: "disc" }; // Tailwind's reset strips markers

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`} style={link}>{CONTACT_EMAIL}</a>;
const L = ({ children }: { children: ReactNode }) => <li style={{ marginBottom: 6 }}>{children}</li>;

export default function Terms() {
  return (
    <article style={{ maxWidth: 740, margin: "0 auto", padding: "56px 20px 0" }}>
      <h1 style={{ ...pageTitle, margin: "0 0 10px" }}>Terms of service</h1>
      <p style={{ ...p, color: "#6b7280", fontSize: 14 }}>Last updated {UPDATED}</p>

      <p style={p}>
        These terms apply when you create an account with SMEasy or use the SMEasy website, app or roster links. They form an agreement between you (or the business you act for) and {LEGAL_ENTITY} (ABN {ABN}), the operator of SMEasy (&ldquo;we&rdquo;, &ldquo;us&rdquo;).
        Our <a href="/privacy/" style={link}>privacy policy</a> explains how we handle personal information and forms part of these terms.
      </p>

      <h2 style={h2}>1. The service</h2>
      <p style={p}>
        SMEasy is an online tool for building, publishing and sharing staff rosters, recording the hours worked, handling time-off requests and, on the Pro plan once available, sending approved hours to payroll software. The features available to you depend on your plan (section 4).
      </p>
      <p style={p}>
        SMEasy is a tool for organising your business&apos;s rosters and hours. It does not calculate wages, award entitlements or pay rates, and it does not give legal or payroll advice. You remain responsible for complying with your obligations as an employer, including the Fair Work Act 2009 (Cth), applicable modern awards and state laws.
      </p>

      <h2 style={h2}>2. Accounts</h2>
      <ul style={ul}>
        <L>You must be at least 18 and have authority to act for the business you register.</L>
        <L>You must give accurate details and keep your login secure. You&apos;re responsible for activity under your account.</L>
        <L>Tell us promptly at <Mail /> if you think your account has been used without permission.</L>
        <L>If you add staff, you confirm you have the right to enter their details and to send them rosters and emails through SMEasy.</L>
      </ul>

      <h2 style={h2}>3. Your content and information</h2>
      <p style={p}>
        You keep ownership of the information you enter into SMEasy, including your staff details, rosters and hours (<strong>your data</strong>). You give us the rights we need to host it, back it up, process it and show it to the people you choose to share it with, only to provide SMEasy to you.
      </p>
      <p style={p}>
        You are responsible for your data, including making sure it is accurate and that you have the right to collect and use it. Where we hold staff information on your behalf, we handle it as set out in our privacy policy.
      </p>
      <p style={p}>
        You are responsible for who you share team and personal roster links with. Anyone with a link can see the rosters it covers. You can reset links at any time in SMEasy.
      </p>

      <h2 style={h2}>4. Plans, fees and the beta</h2>
      <ul style={ul}>
        <L><strong>Free</strong>: up to 6 active staff, with all rostering features.</L>
        <L><strong>Plus</strong>: unlimited staff, plus timesheets and usual-hours notes. $29 a month or $290 a year.</L>
        <L><strong>Pro</strong>: Plus, plus payroll sync with Xero or MYOB. $49 a month or $490 a year. Pro is not yet available for purchase; we&apos;ll tell you before it is.</L>
      </ul>
      <p style={p}>
        Prices are in Australian dollars, exclude GST, and are charged per business, not per user. Where GST applies, we&apos;ll add it and show it at checkout. Paid plans are billed in advance through Stripe, monthly or annually, and renew automatically until cancelled. You can change or cancel your plan in Settings at any time. Cancelling takes effect at the end of the period you&apos;ve paid for, and you keep access until then.
      </p>
      <p style={p}>
        We may change prices or plans with at least 30 days&apos; notice. Changes don&apos;t affect a paid period you&apos;ve already started.
      </p>
      <p style={p}>
        While SMEasy is in beta, some features are free on every plan, and paid plans may not yet charge. We may change, add or remove features during the beta, and we&apos;ll give notice before paid plans begin charging. Refunds for amounts you have paid are handled as required by the Australian Consumer Law and otherwise at our discretion; contact us at <Mail />.
      </p>
      <p style={p}>
        If a plan has a staff limit, we&apos;ll stop you adding staff beyond it until you upgrade or remove staff. Your data is kept in either case.
      </p>

      <h2 style={h2}>5. Acceptable use</h2>
      <p style={p}>You must not, and must not let anyone else:</p>
      <ul style={ul}>
        <L>use SMEasy for anything unlawful, or to harass, discriminate against or harm anyone;</L>
        <L>enter information you have no right to enter, or sensitive health details in time-off reasons;</L>
        <L>attempt to access other businesses&apos; data, or interfere with or overload the service;</L>
        <L>reverse engineer, copy or resell SMEasy, or use it to build a competing product;</L>
        <L>use automated tools to scrape or harvest data from SMEasy, except through the calendar and link features we provide.</L>
      </ul>
      <p style={p}>We may suspend or close accounts that breach these terms.</p>

      <h2 style={h2}>6. Emails and messages</h2>
      <p style={p}>
        When you publish a roster or email your team through SMEasy, we send those emails on your behalf from our address, with your business name and a reply-to address set to you. Staff can stop roster emails using the link in each email. You&apos;re responsible for the content you send.
      </p>

      <h2 style={h2}>7. Records and retention</h2>
      <p style={p}>
        Employers must keep employee records, including time and wage records, for the period required by law (generally 7 years). Our record-keeping features help you keep a record of hours, but you are responsible for keeping the records you need. Before deleting an account, please export your records (Hours → Export dates) and keep them with your payroll records.
      </p>

      <h2 style={h2}>8. Third-party services</h2>
      <p style={p}>
        SMEasy relies on third parties such as Supabase, Resend, Stripe, Xero, Formspree and Vercel. Connecting a third-party service, such as Xero, means you also agree to that service&apos;s terms. We aren&apos;t responsible for their availability or the actions of their providers, though we choose them with care.
      </p>

      <h2 style={h2}>9. Availability and changes</h2>
      <p style={p}>
        We work to keep SMEasy available and secure, but we don&apos;t promise it will always be uninterrupted or error-free. We may carry out maintenance, and we may update or change features over time. We&apos;ll tell you about changes that significantly reduce what you can do.
      </p>

      <h2 style={h2}>10. Ending</h2>
      <p style={p}>
        You can stop using SMEasy at any time by cancelling your plan and asking us to close your account at <Mail />. We may suspend or end your access if you breach these terms, or if we stop providing SMEasy, in which case we&apos;ll give reasonable notice where we can and refund any prepaid fees for the unused period.
      </p>

      <h2 style={h2}>11. Our liability</h2>
      <p style={p}>
        Nothing in these terms excludes, restricts or modifies any right or remedy you have under the Australian Consumer Law or any other law that can&apos;t be excluded. Where the Australian Consumer Law applies to you, our liability for a failure to comply with a consumer guarantee is limited, at our option, to resupplying the service or paying the cost of having it resupplied.
      </p>
      <p style={p}>
        To the extent the law allows, we are not liable for indirect or consequential loss, lost profits, or loss of data arising from your use of SMEasy, and our total liability for any claim is limited to the fees you paid us for SMEasy in the 12 months before the claim (or $100 if you have paid nothing).
      </p>
      <p style={p}>
        SMEasy does not check your rosters or hours against awards, Fair Work requirements or other laws, and we&apos;re not responsible for any compliance outcome of how you use it.
      </p>

      <h2 style={h2}>12. Indemnity</h2>
      <p style={p}>
        To the extent the law allows, you&apos;ll indemnify us against claims from third parties arising from your data or your breach of these terms, including claims by your staff about content you entered or sent.
      </p>

      <h2 style={h2}>13. Intellectual property</h2>
      <p style={p}>
        SMEasy, including its software, design and branding, belongs to us or our licensors. We grant you a limited, non-exclusive, non-transferable right to use it for your business while you comply with these terms.
      </p>

      <h2 style={h2}>14. General</h2>
      <ul style={ul}>
        <L>These terms are governed by the laws of New South Wales, and the courts of New South Wales have jurisdiction, subject to any law that says otherwise.</L>
        <L>We may update these terms. We&apos;ll post the new version here with a new &ldquo;last updated&rdquo; date and tell account holders by email about significant changes. Continuing to use SMEasy after a change means you accept it.</L>
        <L>If any part of these terms can&apos;t be enforced, the rest still applies.</L>
        <L>You can&apos;t transfer your account to someone else without our agreement. We may transfer these terms with a sale of SMEasy.</L>
      </ul>

      <h2 style={h2}>15. Contact</h2>
      <p style={p}>{LEGAL_ENTITY} (ABN {ABN})<br />Email: <Mail /></p>
    </article>
  );
}
