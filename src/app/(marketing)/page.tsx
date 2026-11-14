import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";
import { guides } from "@/content/guides";
import AuthHashForwarder from "@/components/AuthHashForwarder";
import ScrollReveal from "@/components/ScrollReveal";

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

const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 20px" } as const;

const steps = [
  { n: "1", t: "Add your team", d: "Type in names and pick their usual roles. That's it — you're ready to build." },
  { n: "2", t: "Build the week", d: "Tap a day to add a shift, or copy last week and tweak what's different." },
  { n: "3", t: "Publish and share", d: "Hit publish, paste the team link in your group chat (or send the PDF). Done." },
];

const features = [
  { t: "Copy last week", d: "Most weeks look the same. Copy last week in one tap, then tweak what's different." },
  { t: "See the week at a glance", d: "Shifts colour-coded by role, public holidays marked, and a daily count of who's on and any unfilled shifts." },
  { t: "One link, or a PDF", d: "Pin the team link in your group chat, or print a one-page A4 roster for the noticeboard." },
  { t: "Time-off requests", d: "Staff ask for days off from their phone. Approve or decline right on the roster." },
  { t: "Hours for payroll", d: "Download every shift's hours as a spreadsheet for your bookkeeper, Xero or MYOB." },
  { t: "In their calendar", d: "Staff subscribe once and their shifts appear in their phone's calendar — updated when you change the roster." },
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

export default function Home() {
  const featured = ["how-to-create-a-roster", "share-roster-with-staff", "shift-scheduling-best-practices"]
    .map((s) => guides.find((g) => g.slug === s)!);

  return (
    <>
      <AuthHashForwarder />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section style={{ ...wrap, padding: "72px 20px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: C.shiftText, background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 999, padding: "4px 12px", marginBottom: 20 }}>
          Free during early access
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.1, fontWeight: 700, margin: "0 auto 18px", maxWidth: 760, letterSpacing: "-0.02em" }}>
          Staff rostering that actually feels easy.
        </h1>
        <p style={{ fontSize: "clamp(16px, 2.2vw, 19px)", color: C.secondary, maxWidth: 620, margin: "0 auto 28px", lineHeight: 1.55 }}>
          Build the week in minutes, share it with one link, and export the hours when you&apos;re done. Made for small Australian businesses. No app or passwords for your staff, no fuss.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/login/?signup" style={{ background: C.dark, color: C.white, padding: "14px 26px", borderRadius: C.r1, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>Get started free</Link>
          <Link href="#how-it-works" style={{ background: C.white, color: C.dark, border: `1px solid ${C.border}`, padding: "14px 26px", borderRadius: C.r1, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>How it works</Link>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 14 }}>No credit card. Sign in with your email.</p>
      </section>

      {/* Hero image */}
      <section style={{ ...wrap, marginBottom: 48 }}>
        <img src="/hero.jpg" alt="A café owner building a staff roster on their laptop" width={1400} height={782}
          style={{ width: "100%", height: "auto", borderRadius: C.r2, display: "block" }} />
      </section>

      {/* Roster preview */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <RosterPreview />
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ ...wrap, marginBottom: 72 }}>
        <ScrollReveal>
          <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "0 0 32px" }}>How it works</h2>
        </ScrollReveal>
        <div className="grid-3" style={{ gap: 16 }}>
          {steps.map((s, i) => (
            <ScrollReveal key={s.n} delay={i * 120}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: 22 }}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: 12 }}>{s.n}</div>
                <h3 style={{ fontSize: 18, margin: "0 0 6px" }}>{s.t}</h3>
                <p style={{ fontSize: 15, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <ScrollReveal>
          <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>Everything you need to roster. Nothing you don&apos;t.</h2>
          <p style={{ textAlign: "center", color: C.secondary, margin: "0 0 32px", fontSize: 16 }}>SMEasy does one thing — rostering — and keeps it simple.</p>
        </ScrollReveal>
        <div className="grid-3" style={{ gap: 14 }}>
          {features.map((f, i) => (
            <ScrollReveal key={f.t} delay={i * 80}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: 18 }}>
                <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>{f.t}</h3>
                <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{f.d}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* For staff */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <ScrollReveal>
        <div style={{ background: C.dark, color: C.white, borderRadius: C.r2, overflow: "hidden" }}>
          <img src="/staff.jpg" alt="A barista checking their roster on their phone" width={1400} height={782}
            style={{ width: "100%", height: "auto", display: "block" }} />
          <div style={{ padding: "28px 28px 32px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "start" }}>
            <div>
              <h2 style={{ fontSize: 26, margin: "0 0 10px" }}>Your staff will actually use it</h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: "#d9d6cc" }}>
                No app to download, no account, no password. Staff open the team link, see who&apos;s on when, and download the roster as a PDF if they want.
              </p>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.9, color: "#eceae3" }}>
              <li>Only sees published rosters, never your drafts</li>
              <li>Names and shift times only — no pay rates or phone numbers</li>
              <li>Reset the link any time someone leaves</li>
              <li>Data stored in Australia (Sydney)</li>
            </ul>
          </div>
        </div>
        </ScrollReveal>
      </section>

      {/* Guides */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <ScrollReveal>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Rostering guides</h2>
            <Link href="/guides/" style={{ color: C.secondary, fontSize: 15 }}>All guides →</Link>
          </div>
        </ScrollReveal>
        <div className="grid-3" style={{ gap: 14 }}>
          {featured.map((g, i) => (
            <ScrollReveal key={g.slug} delay={i * 100}>
              <Link href={`/guides/${g.slug}/`} style={{ display: "block", background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: 18, textDecoration: "none", color: C.dark }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{g.category}</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{g.title}</div>
                <div style={{ fontSize: 14, color: C.secondary, lineHeight: 1.5 }}>{g.description}</div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <ScrollReveal>
      <section style={{ ...wrap, textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 10px" }}>Ready to ditch the spreadsheet?</h2>
        <p style={{ color: C.secondary, fontSize: 16, margin: "0 0 22px" }}>Free during early access. Your first roster is about five minutes away.</p>
        <Link href="/auth/login/?signup" style={{ background: C.dark, color: C.white, padding: "14px 28px", borderRadius: C.r1, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>Get started free</Link>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 18 }}>Questions? Read the <Link href="/faq/" style={{ color: C.secondary }}>FAQ</Link>.</p>
      </section>
      </ScrollReveal>
    </>
  );
}

// Static illustration of the roster screen (sample data).
// Desktop: full week grid. Mobile (<640px): day-cards matching the real product.
function RosterPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows: { name: string; shifts: (string | null)[]; hrs: string }[] = [
    { name: "Sam", shifts: ["6:30–2:30", "6:30–2:30", null, "6:30–2:30", "7–11 · 4–10", null, null], hrs: "32.0" },
    { name: "Priya", shifts: ["9–5", null, "9–5", null, null, "8–4", "8–4"], hrs: "30.0" },
    { name: "Tom", shifts: [null, null, null, null, "5pm–2am", "5pm–2am", null], hrs: "17.0" },
    { name: "Lily", shifts: [null, "11–3", "11–3", "11–3", null, "Off", null], hrs: "12.0" },
  ];

  function ShiftChip({ s }: { s: string }) {
    const off = s === "Off";
    return (
      <span style={{
        display: "inline-block", fontSize: 12, fontWeight: 700, borderRadius: C.r1, padding: "4px 8px",
        background: off ? C.offBg : C.shiftBg, color: off ? C.offText : C.shiftText,
        border: `1px solid ${off ? C.offBorder : C.shiftBorder}`,
      }}>{s}</span>
    );
  }

  return (
    <div aria-label="Example roster" style={{ boxShadow: "0 12px 40px rgba(33,31,26,0.06)" }}>
      {/* Desktop grid */}
      <div className="roster-grid" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <strong style={{ fontSize: 15 }}>17 Nov – 23 Nov</strong>
          <span style={{ fontSize: 13, color: "#1a6b2f", fontWeight: 600 }}>Published</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: C.secondary }}><strong style={{ color: C.dark }}>91.0</strong> total hours</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "110px repeat(7, 1fr) 56px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.muted }}>
          <div style={{ padding: "8px 14px" }}>TEAM</div>
          {days.map((d) => <div key={d} style={{ padding: "8px 4px", textAlign: "center" }}>{d.toUpperCase()}</div>)}
          <div style={{ padding: "8px 4px", textAlign: "center" }}>HRS</div>
        </div>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "grid", gridTemplateColumns: "110px repeat(7, 1fr) 56px", borderTop: `1px solid ${C.divider}` }}>
            <div style={{ padding: "12px 14px", fontSize: 14, fontWeight: 600 }}>{r.name}</div>
            {r.shifts.map((s, i) => (
              <div key={i} style={{ padding: 4, display: "flex", alignItems: "center" }}>
                {s && (
                  <div style={{
                    width: "100%", textAlign: "center", fontSize: 11, fontWeight: 700, borderRadius: C.r1, padding: "6px 2px",
                    background: s === "Off" ? C.offBg : C.shiftBg, color: s === "Off" ? C.offText : C.shiftText,
                    border: `1px solid ${s === "Off" ? C.offBorder : C.shiftBorder}`,
                  }}>{s}</div>
                )}
              </div>
            ))}
            <div style={{ padding: "12px 4px", fontSize: 13, fontWeight: 600, textAlign: "center" }}>{r.hrs}</div>
          </div>
        ))}
      </div>

      {/* Mobile day-cards */}
      <div className="roster-cards" style={{ flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 2px", marginBottom: 4 }}>
          <strong style={{ fontSize: 15 }}>17 Nov – 23 Nov</strong>
          <span style={{ fontSize: 13, color: "#1a6b2f", fontWeight: 600 }}>Published</span>
        </div>
        {days.slice(3, 6).map((day, i) => {
          const di = i + 3; // Thu–Sat: the busy end of the week
          const dayShifts = rows.flatMap((r) => r.shifts[di] ? [{ name: r.name, shift: r.shifts[di]! }] : []);
          return (
            <div key={day} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", background: C.bg, borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, color: C.dark }}>{day}</div>
              {dayShifts.length === 0 ? (
                <div style={{ padding: "10px 14px", fontSize: 13, color: C.faint }}>No shifts</div>
              ) : dayShifts.map((s) => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: `1px solid ${C.divider}` }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.dark, flex: 1 }}>{s.name}</span>
                  <ShiftChip s={s.shift} />
                </div>
              ))}
            </div>
          );
        })}
        <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "4px 0" }}>+ the rest of the week</div>
      </div>
    </div>
  );
}
