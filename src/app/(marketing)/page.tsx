import type { Metadata } from "next";
import Link from "next/link";
import { CalendarOff, CalendarRange, CalendarSync, Check, ChevronRight, Copy, FileSpreadsheet, Link2 } from "lucide-react";
import { C, wrap, display, sectionTitle, lead, card, inkCard, onInk, button, pill, link } from "@/lib/mkt";
import { SITE_URL, SIGNUPS_OPEN, SIGNUP_HREF, SIGNUP_CTA } from "@/lib/site";
import { guides } from "@/content/guides";
import AuthHashForwarder from "@/components/AuthHashForwarder";
import RosterPreview from "@/components/RosterPreview";

export const metadata: Metadata = {
  title: { absolute: "SMEasy — simple staff rostering for Australian small businesses" },
  description:
    "Build the week's roster in minutes and share it with your team on one link or a printable PDF. Free during early access.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "SMEasy — simple staff rostering",
    description: "Build the week's roster in minutes and share it with one link. Made for Australian small businesses.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "SMEasy — simple staff rostering" }],
  },
};

const steps = [
  { n: "1", t: "Add your team", d: "Type in names and pick their usual roles. That's it — you're ready to build." },
  { n: "2", t: "Build the week", d: "Tap a day to add a shift, or copy last week and tweak what's different." },
  { n: "3", t: "Publish and share", d: "Hit publish, paste the team link in your group chat (or send the PDF). Done." },
];

const features = [
  { Icon: Copy, t: "Copy last week", d: "Most weeks look the same. Copy last week in one tap, then tweak what's different." },
  { Icon: CalendarRange, t: "See the week at a glance", d: "Shifts colour-coded by role, public holidays marked, and a daily count of who's on and any unfilled shifts." },
  { Icon: Link2, t: "One link, or a PDF", d: "Pin the team link in your group chat, or print a one-page A4 roster for the noticeboard." },
  { Icon: CalendarOff, t: "Time-off requests", d: "Staff ask for days off from their phone. Approve or decline right on the roster." },
  { Icon: FileSpreadsheet, t: "Hours for payroll", d: "Download every shift's hours as a spreadsheet for your bookkeeper, Xero or MYOB." },
  { Icon: CalendarSync, t: "In their calendar", d: "Staff subscribe once and their shifts appear in their phone's calendar — updated when you change the roster." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SMEasy",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web browser",
  description: "Simple staff rostering for Australian small businesses.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD", description: "Free during early access" },
  areaServed: "AU",
};

const section = { ...wrap, marginTop: 104 } as const;

export default function Home() {
  const featured = ["how-to-create-a-roster", "share-roster-with-staff", "shift-scheduling-best-practices"]
    .map((s) => guides.find((g) => g.slug === s)!);

  return (
    <>
      <AuthHashForwarder />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section style={{ ...wrap, padding: "72px 20px 48px", textAlign: "center" }}>
        <span style={{ ...pill(SIGNUPS_OPEN ? "lime" : "draft"), marginBottom: 22 }}>
          {SIGNUPS_OPEN ? "Free during early access" : "Coming soon"}
        </span>
        <h1 style={{ ...display, maxWidth: 820, margin: "0 auto 20px" }}>
          Staff rostering that actually feels easy.
        </h1>
        <p style={{ ...lead, maxWidth: 620, margin: "0 auto 30px" }}>
          Build the week in minutes, share it with one link, and export the hours when you&apos;re done. Made for small Australian businesses. No app or passwords for your staff, no fuss.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href={SIGNUP_HREF} className="app-press" style={button("accent")}>{SIGNUP_CTA}</Link>
          <Link href="#how-it-works" className="app-press" style={button("secondary")}>How it works</Link>
        </div>
        <p style={{ fontSize: 14, color: C.muted, margin: "16px 0 0" }}>
          {SIGNUPS_OPEN ? "No credit card. Sign in with your email." : "We're opening soon. Leave your email and we'll let you know."}
        </p>
      </section>

      {/* Roster preview: the product, in its own interface */}
      <section style={wrap}>
        <RosterPreview />
      </section>

      {/* Hero image */}
      <section style={{ ...wrap, marginTop: 28 }}>
        <img src="/hero.jpg" alt="A café owner building a staff roster on their laptop" width={1400} height={782}
          style={{ width: "100%", height: "auto", borderRadius: C.r2, display: "block", boxShadow: C.shadow }} />
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ ...section, scrollMarginTop: 84 }}>
        <h2 style={{ ...sectionTitle, textAlign: "center", marginBottom: 28 }}>How it works</h2>
        <ol className="mkt-steps" style={{ ...card, listStyle: "none", margin: 0, padding: 0 }}>
          {steps.map((s) => (
            <li key={s.n} style={{ padding: "24px 24px 26px" }}>
              <span aria-hidden style={{ width: 36, height: 36, borderRadius: 999, background: "#ecfccb", color: "#3f6212", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 16, marginBottom: 14 }}>{s.n}</span>
              <h3 style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em", margin: "0 0 6px" }}>{s.t}</h3>
              <p style={{ fontSize: 15, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Features */}
      <section style={section}>
        <h2 style={{ ...sectionTitle, textAlign: "center", margin: "0 auto 10px", maxWidth: 680 }}>Everything you need to roster. Nothing you don&apos;t.</h2>
        <p style={{ ...lead, textAlign: "center", margin: "0 0 28px", fontSize: 17 }}>SMEasy does one thing — rostering — and keeps it simple.</p>
        <ul className="mkt-features" style={{ ...card, listStyle: "none", margin: 0, padding: 0, overflow: "hidden" }}>
          {features.map(({ Icon, t, d }) => (
            <li key={t} style={{ display: "flex", gap: 14, padding: "20px 22px" }}>
              <span aria-hidden style={{ width: 40, height: 40, borderRadius: 999, background: "#f3f4f6", display: "grid", placeItems: "center", flex: "none" }}>
                <Icon size={19} strokeWidth={2} color={C.dark} />
              </span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: "2px 0 4px" }}>{t}</h3>
                <p style={{ fontSize: 15, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* For staff: the page's one dark surface */}
      <section style={section}>
        <div style={{ ...inkCard, overflow: "hidden" }}>
          <img src="/staff.jpg" alt="A barista checking their roster on their phone" width={1400} height={782}
            style={{ width: "100%", height: "auto", display: "block" }} />
          <div style={{ padding: "30px 30px 34px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, alignItems: "start" }}>
            <div>
              <h2 style={{ ...sectionTitle, fontSize: "clamp(26px, 3.2vw, 32px)", margin: "0 0 12px" }}>Your staff will actually use it</h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: onInk }}>
                No app to download, no account, no password. Staff open the team link, see who&apos;s on when, and download the roster as a PDF if they want.
              </p>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 12, fontSize: 15, lineHeight: 1.45, color: "rgba(255,255,255,0.9)" }}>
              {["Only sees published rosters, never your drafts", "Names and shift times only — no pay rates or phone numbers", "Reset the link any time someone leaves", "Data stored in Australia (Sydney)"].map((t) => (
                <li key={t} style={{ display: "flex", gap: 10 }}>
                  <Check size={18} strokeWidth={2.4} color={C.accent} style={{ flex: "none", marginTop: 1 }} aria-hidden />{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Guides */}
      <section style={section}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <h2 style={{ ...sectionTitle, fontSize: "clamp(24px, 3vw, 30px)" }}>Rostering guides</h2>
          <Link href="/guides/" style={{ ...link, fontSize: 15, display: "inline-flex", alignItems: "center", gap: 2, textDecoration: "none" }}>All guides<ChevronRight size={17} strokeWidth={2.2} aria-hidden /></Link>
        </div>
        <div className="grid-3" style={{ gap: 14 }}>
          {featured.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}/`} className="app-lift" style={{ ...card, display: "flex", flexDirection: "column", gap: 8, padding: "20px 20px 18px", textDecoration: "none", color: C.dark, transition: "box-shadow 160ms ease, transform 160ms ease" }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{g.title}</div>
              <div style={{ fontSize: 15, color: C.secondary, lineHeight: 1.5, flex: 1 }}>{g.description}</div>
              <span style={{ ...pill("quiet"), alignSelf: "flex-start", marginTop: 6 }}>{g.category}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={section}>
        <div style={{ ...card, textAlign: "center", padding: "52px 24px 46px" }}>
          <h2 style={{ ...sectionTitle, margin: "0 0 12px" }}>Ready to ditch the spreadsheet?</h2>
          <p style={{ ...lead, fontSize: 17, maxWidth: 560, margin: "0 auto 26px" }}>
            {SIGNUPS_OPEN ? "Free during early access. Your first roster is about five minutes away." : "SMEasy opens soon, free for small teams. Get on the early-access list and we'll email you when it's ready."}
          </p>
          <Link href={SIGNUP_HREF} className="app-press" style={button("accent")}>{SIGNUP_CTA}</Link>
          <p style={{ fontSize: 15, color: C.muted, margin: "20px 0 0" }}>Questions? Read the <Link href="/faq/" style={link}>FAQ</Link>.</p>
        </div>
      </section>
    </>
  );
}
