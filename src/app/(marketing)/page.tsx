import type { Metadata } from "next";
import Link from "next/link";
import { CalendarOff, CalendarRange, CalendarSync, Check, ChevronRight, Copy, FileSpreadsheet, Link2 } from "lucide-react";
import { C, wrap, display, sectionTitle, lead, card, inkCard, onInk, button, pill, link } from "@/lib/mkt";
import { HOLDING_PAGE, SITE_URL, SIGNUPS_OPEN, SIGNUP_HREF, SIGNUP_CTA } from "@/lib/site";
import { guides } from "@/content/guides";
import { guideImage } from "@/content/guideImages";
import AuthHashForwarder from "@/components/AuthHashForwarder";
import RosterPreview from "@/components/RosterPreview";
import DeviceShot from "@/components/DeviceShot";

export const metadata: Metadata = {
  title: { absolute: "SMEasy — simple staff rostering for Australian small businesses" },
  description:
    "Build the week's roster in minutes and share it with your team by link, email or PDF. Free for small teams.",
  alternates: { canonical: "/" },
  // The home page stays out of search results while its preview password is on.
  robots: HOLDING_PAGE ? { index: false, follow: false } : undefined,
  openGraph: {
    url: "/",
    title: "SMEasy — simple staff rostering",
    description: "Build the week's roster in minutes and share it with one link. Made for Australian small businesses.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "SMEasy — simple staff rostering" }],
  },
};

const steps = [
  { n: "1", t: "Add your team", d: "Type in names and pick their usual roles. That's it — you're ready to build.",
    shot: "team-phone", alt: "The SMEasy Team page on a phone, listing staff with their usual roles" },
  { n: "2", t: "Build the week", d: "Tap a day to add a shift, or copy last week and tweak what's different.",
    shot: "add-shift-phone", alt: "Adding a shift on a phone: who, start and finish, role, and the other days to add it to" },
  { n: "3", t: "Publish and share", d: "Hit publish and your team gets their shifts by email. The team link and PDF are there too.",
    shot: "staff-link-phone", alt: "A staff member's personal roster link on their phone, showing their next shift" },
] as const;

const features = [
  { Icon: Copy, t: "Copy last week", d: "Most weeks look the same. Copy last week in one tap, then tweak what's different." },
  { Icon: CalendarRange, t: "Spot the gaps", d: "See the week at a glance, or a day hour by hour. Any time with nobody on shows in red, with a button to fill it." },
  { Icon: Link2, t: "Link, email or PDF", d: "Publish and everyone gets their shifts by email. Pin the team link in your group chat, or print a one-page roster." },
  { Icon: CalendarOff, t: "Time-off requests", d: "Staff ask for days off from their phone. Approve or decline right on the roster." },
  { Icon: FileSpreadsheet, t: "Timesheets to Xero", d: "Confirm the hours actually worked, approve the week, and send it to Xero Payroll. Or download a spreadsheet for your bookkeeper." },
  { Icon: CalendarSync, t: "In their calendar", d: "Staff subscribe once and their shifts appear in their phone's calendar — updated when you change the roster." },
];

// Captions describe what's built today (PRODUCT.md): role presets, split and past-midnight shifts.
const types = [
  { src: "/types/cafe.jpg", t: "Cafés", d: "Floor, kitchen and barista roles ready to go, and split shifts for the morning and lunch rush.", alt: "Two café staff in aprons smiling at a phone behind the counter" },
  { src: "/types/retail.jpg", t: "Shops", d: "A retail preset with sales floor, stockroom and checkout, ready to change to suit you.", alt: "A boutique owner unlocking the front door of a small clothing shop" },
  { src: "/types/hospitality.jpg", t: "Restaurants and bars", d: "Late closes are easy: set 5pm to 2am and SMEasy counts the hours correctly.", alt: "A restaurant team sharing a staff meal at a long timber table, seen from above" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SMEasy",
  url: SITE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web browser",
  description: "Simple staff rostering for Australian small businesses.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "AUD", description: "Free during the open beta" },
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
          {SIGNUPS_OPEN ? "Open beta · free for now" : "Coming soon"}
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
              <div style={{ background: C.bg, borderRadius: 14, padding: "22px 18px 0", marginBottom: 20, overflow: "hidden", height: 380 }}>
                <DeviceShot name={s.shot} alt={s.alt} style={{ maxWidth: 230 }} />
              </div>
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
        <DeviceShot name="roster-week-desktop" style={{ marginBottom: 16 }}
          alt="A week's roster in SMEasy on a laptop: seven staff, shifts colour-coded by role, an unfilled Sunday shift, a time-off request and the cover count under each day" />
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

      {/* Who it's for */}
      <section style={section}>
        <h2 style={{ ...sectionTitle, textAlign: "center", margin: "0 auto 28px", maxWidth: 680 }}>Made for cafés, shops and restaurants</h2>
        <div className="grid-3" style={{ gap: 14 }}>
          {types.map((t) => (
            <figure key={t.src} style={{ ...card, margin: 0, overflow: "hidden" }}>
              <img src={t.src} alt={t.alt} width={960} height={720} loading="lazy"
                style={{ width: "100%", height: "auto", aspectRatio: "4 / 3", objectFit: "cover", display: "block", background: C.divider }} />
              <figcaption style={{ padding: "14px 18px 16px" }}>
                <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 2 }}>{t.t}</div>
                <div style={{ fontSize: 15, color: C.secondary, lineHeight: 1.45 }}>{t.d}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* For staff: the page's one dark surface */}
      <section style={section}>
        <div style={{ ...inkCard, overflow: "hidden" }}>
          <img src="/staff-2.jpg" alt="A barista checking their roster on their phone" width={1400} height={781}
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
            <Link key={g.slug} href={`/guides/${g.slug}/`} className="app-lift" style={{ ...card, display: "flex", flexDirection: "column", overflow: "hidden", textDecoration: "none", color: C.dark, transition: "box-shadow 160ms ease, transform 160ms ease" }}>
              <img src={guideImage(g.slug).thumb} alt="" width={480} height={268} loading="lazy"
                style={{ width: "100%", height: "auto", aspectRatio: "16 / 9", objectFit: "cover", display: "block", background: C.divider }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "18px 20px 18px", flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{g.title}</div>
                <div style={{ fontSize: 15, color: C.secondary, lineHeight: 1.5, flex: 1 }}>{g.description}</div>
                <span style={{ ...pill("quiet"), alignSelf: "flex-start", marginTop: 6 }}>{g.category}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={section}>
        <div style={{ ...card, textAlign: "center", padding: "52px 24px 46px" }}>
          <h2 style={{ ...sectionTitle, margin: "0 0 12px" }}>Ready to ditch the spreadsheet?</h2>
          <p style={{ ...lead, fontSize: 17, maxWidth: 560, margin: "0 auto 26px" }}>
            {SIGNUPS_OPEN ? "Free during the open beta, with every feature included and no card needed. Your first roster is about five minutes away." : "SMEasy opens soon, free for small teams. Join the waitlist and we'll email you when it's ready."}
          </p>
          <Link href={SIGNUP_HREF} className="app-press" style={button("accent")}>{SIGNUP_CTA}</Link>
          <p style={{ fontSize: 15, color: C.muted, margin: "20px 0 0" }}>Questions? Read the <Link href="/faq/" style={link}>FAQ</Link>.</p>
        </div>
      </section>
    </>
  );
}
