import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { C } from "@/lib/theme";
import { ABN, CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Smeasy collects, uses, stores and shares personal information about account holders, staff and website visitors.",
  alternates: { canonical: "/privacy/" },
};

const UPDATED = "15 November 2026";

const h2: CSSProperties = { fontSize: 22, margin: "34px 0 10px" };
const h3: CSSProperties = { fontSize: 17, margin: "20px 0 8px" };
const p: CSSProperties = { fontSize: 16, lineHeight: 1.65, color: C.secondary, margin: "0 0 12px" };
const ul: CSSProperties = { ...p, paddingLeft: 22 };
const td: CSSProperties = { padding: "10px 12px", borderTop: `1px solid ${C.divider}`, verticalAlign: "top", fontSize: 15, color: C.secondary };

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: C.dark }}>{CONTACT_EMAIL}</a>;
const L = ({ children }: { children: ReactNode }) => <li style={{ marginBottom: 6 }}>{children}</li>;

export default function Privacy() {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto", padding: "44px 20px 0" }}>
      <h1 style={{ fontSize: "clamp(28px, 5vw, 38px)", margin: "0 0 8px" }}>Privacy policy</h1>
      <p style={{ ...p, color: C.muted, fontSize: 14 }}>Last updated {UPDATED}</p>

      <p style={p}>
        This policy explains how Smeasy handles personal information. &ldquo;Smeasy&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; means {LEGAL_ENTITY} (ABN {ABN}), the operator of smeasy.au.
        We aim to handle personal information in line with the Australian Privacy Principles in the <em>Privacy Act 1988</em> (Cth).
      </p>

      <h2 style={h2}>The short version</h2>
      <ul style={ul}>
        <L>Smeasy is a rostering tool. We collect what&apos;s needed to build and share rosters, and nothing more.</L>
        <L>Businesses that use Smeasy enter their staff&apos;s details. We hold that information on the business&apos;s behalf and only use it to run Smeasy for them.</L>
        <L>Our database is in Sydney, Australia. Some services we use are run by companies based overseas (see &ldquo;Who we share information with&rdquo;).</L>
        <L>We don&apos;t sell personal information, and we don&apos;t use staff information for marketing.</L>
      </ul>

      <h2 style={h2}>Whose information we handle</h2>
      <p style={p}><strong>Managers and owners</strong> who create a Smeasy account (&ldquo;account holders&rdquo;).</p>
      <p style={p}>
        <strong>Staff</strong> whose details an account holder adds so they can be rostered. If you&apos;re a staff member, your employer decides what is entered about you and is responsible for telling you about it.
        Questions about how your employer uses your roster information are best directed to them first, but you can also contact us.
      </p>
      <p style={p}><strong>Visitors</strong> to our public website (such as the home page, pricing, guides, FAQ and contact page).</p>

      <h2 style={h2}>What we collect</h2>
      <h3 style={h3}>From account holders</h3>
      <ul style={ul}>
        <L>Email address, used to sign you in with a login link.</L>
        <L>Business name, business type and the shift roles you set up.</L>
        <L>Sign-in records kept by our authentication provider, such as the time of sign-in, IP address and browser type, used to keep accounts secure.</L>
      </ul>
      <h3 style={h3}>About staff (entered by the account holder)</h3>
      <ul style={ul}>
        <L>Name. This is the only required field.</L>
        <L>Optional: mobile number, email address, usual role and hourly rate.</L>
        <L>Roster information: shifts (dates, times, breaks and roles) and whether a roster has been published.</L>
        <L>Time-off requests: dates, the optional reason given, and whether the request was approved or declined.</L>
      </ul>
      <p style={p}>The reason on a time-off request is optional. Please don&apos;t include health or other sensitive details. &ldquo;Personal&rdquo; or &ldquo;Appointment&rdquo; is enough.</p>
      <h3 style={h3}>From staff using roster links</h3>
      <p style={p}>
        Staff view published rosters through a link, without an account. If a staff member picks their name on the team roster link to highlight their shifts, that choice is saved only in their own browser. It isn&apos;t sent to us.
        Requesting time off through a personal link sends us the dates and optional reason entered.
        If a staff member subscribes to their shift calendar, their calendar app (such as Apple, Google or Microsoft) regularly fetches their published shifts from us using their personal link.
      </p>
      <h3 style={h3}>From website visitors</h3>
      <p style={p}>
        On our public pages only (such as the home page, pricing, guides, FAQ and contact page), we use Google Tag Manager and Google Analytics to understand how people find and use the site, <strong>but only if you agree</strong> when we ask.
        If you choose &ldquo;No thanks&rdquo;, these tools don&apos;t load. You can change your choice at any time with &ldquo;Cookie settings&rdquo; at the bottom of our public pages. Analytics never runs on rostering screens or roster links.
        If you agree, these tools may set cookies and collect information such as pages viewed, approximate location, and device and browser type.
      </p>
      <p style={p}>
        We store a few small items in your browser to make Smeasy work: your sign-in session (account holders), your cookie choice, and, on the team roster link, the name you picked. These stay on your device.
        If you use our contact form, we receive your name, email address, optional business name and your message, and use them to reply to you.
        Our hosting provider keeps standard server logs (such as IP address, page requested and time) for security and troubleshooting.
      </p>

      <h2 style={h2}>How we use information</h2>
      <ul style={ul}>
        <L>To provide Smeasy: signing in, building, publishing and sharing rosters, calculating hours and wage estimates, and handling time-off requests.</L>
        <L>To send sign-in emails.</L>
        <L>To keep Smeasy secure and fix problems.</L>
        <L>To improve our public website, using analytics from public pages only, where you&apos;ve agreed to it.</L>
        <L>To contact account holders about their account or important changes to Smeasy.</L>
      </ul>
      <p style={p}>We don&apos;t use staff information to contact staff ourselves, and we don&apos;t sell personal information or use it for advertising.</p>

      <h2 style={h2}>Who can see what</h2>
      <ul style={ul}>
        <L><strong>Account holders</strong> can see and change everything about their own business, and nothing about any other business.</L>
        <L><strong>Anyone with a business&apos;s team roster link</strong> can see that business&apos;s published rosters: names, days, shift times and roles only. Not hourly rates, contact details or drafts. Account holders can reset the link at any time, which stops the old link working.</L>
        <L><strong>Anyone with a staff member&apos;s personal link</strong> can see that business&apos;s published rosters and that staff member&apos;s time-off requests, and can submit time-off requests in their name. Account holders can reset a personal link at any time.</L>
        <L><strong>Our team</strong> accesses account data only when needed to provide support, fix problems or meet legal obligations.</L>
      </ul>

      <h2 style={h2}>Who we share information with</h2>
      <p style={p}>We use these service providers to run Smeasy. They process information on our behalf:</p>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflowX: "auto", margin: "0 0 14px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
          <thead>
            <tr>{["Provider", "What for", "Where"].map((h) => <th key={h} style={{ ...td, borderTop: "none", textAlign: "left", color: C.dark, fontSize: 14 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            <tr><td style={td}>Supabase</td><td style={td}>Database and sign-in</td><td style={td}>Data stored in Sydney, Australia. Supabase Inc. is based in the United States and its staff may access data for support and operations.</td></tr>
            <tr><td style={td}>Resend</td><td style={td}>Sending sign-in emails</td><td style={td}>United States company; emails sent via Amazon Web Services (Tokyo region)</td></tr>
            <tr><td style={td}>Formspree</td><td style={td}>Receiving contact form messages</td><td style={td}>United States</td></tr>
            <tr><td style={td}>Vercel</td><td style={td}>Website hosting</td><td style={td}>Global network; United States company</td></tr>
            <tr><td style={td}>Google (Tag Manager, Analytics)</td><td style={td}>Website analytics, public pages only, with consent</td><td style={td}>United States and other countries</td></tr>
          </tbody>
        </table>
      </div>
      <p style={p}>
        Some of these providers may store or access information outside Australia, mainly in the United States. We choose established providers and rely on their security and privacy commitments.
        We may also disclose information if required by law, or to protect the rights or safety of our users or others.
      </p>

      <h2 style={h2}>Security</h2>
      <p style={p}>
        Information is encrypted in transit (HTTPS) and stored in a managed database with access controls. Each business&apos;s data is separated at the database level, so one account can&apos;t read another&apos;s.
        Roster links use long, random codes that can be reset. No system is completely secure, so please keep your email account secure and reset roster links if they&apos;re shared with someone who shouldn&apos;t have them.
      </p>
      <p style={p}>If we become aware of a data breach likely to cause serious harm, we will notify affected people and the Office of the Australian Information Commissioner where required by law.</p>

      <h2 style={h2}>How long we keep information</h2>
      <p style={p}>
        We keep account and roster information for as long as the account is active. Account holders can delete staff records, and can ask us to delete their whole account by emailing <Mail />.
        We delete account data within 30 days of a deletion request, except where we must keep it longer by law. Backups are overwritten on our providers&apos; normal cycles.
      </p>

      <h2 style={h2}>Access, correction and deletion</h2>
      <ul style={ul}>
        <L><strong>Account holders</strong> can view and correct their business and staff information in Smeasy at any time, or email us to request a copy or deletion.</L>
        <L><strong>Staff</strong> can ask their employer to correct or remove their details, or contact us. If we hold your information on behalf of an employer, we may need to refer your request to them.</L>
      </ul>
      <p style={p}>We&apos;ll respond within 30 days and won&apos;t charge for a request.</p>

      <h2 style={h2}>Children</h2>
      <p style={p}>Smeasy accounts are for businesses. Businesses may roster staff under 18, such as junior employees. Their information is handled the same way as other staff information, and the business is responsible for its use.</p>

      <h2 style={h2}>Complaints</h2>
      <p style={p}>
        If you have a concern about how we&apos;ve handled personal information, contact us first at <Mail />. We&apos;ll respond within 30 days.
        If you&apos;re not satisfied, you can complain to the Office of the Australian Information Commissioner at <a href="https://www.oaic.gov.au" style={{ color: C.dark }}>oaic.gov.au</a>.
      </p>

      <h2 style={h2}>Changes to this policy</h2>
      <p style={p}>We may update this policy as Smeasy changes. We&apos;ll post the new version here with a new &ldquo;last updated&rdquo; date and tell account holders by email about significant changes.</p>

      <h2 style={h2}>Contact</h2>
      <p style={p}>{LEGAL_ENTITY} (ABN {ABN})<br />Email: <Mail /></p>
    </article>
  );
}
