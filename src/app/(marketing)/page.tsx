import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";
import { guides } from "@/content/guides";
import AuthHashForwarder from "@/components/AuthHashForwarder";

export const metadata: Metadata = {
  title: { absolute: "Smeasy — simple staff rostering for Australian small businesses" },
  description:
    "Build the week's roster in minutes, share it with your team on one link or a PDF, handle time-off requests and download hours for payroll. Free during early access.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Smeasy — simple staff rostering",
    description: "Build the week's roster in minutes and share it with one link. Made for Australian small businesses.",
  },
};

const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 20px" } as const;

const steps = [
  { n: "1", t: "Add your team", d: "Type in names. Add hourly rates and payroll IDs if you want wage totals and payroll exports." },
  { n: "2", t: "Build the week", d: "Tap a day to add a shift, or copy last week in one tap and tweak what's different." },
  { n: "3", t: "Publish and share", d: "Publish, then paste your team link in the staff group chat or send the PDF. Done." },
];

const features = [
  { t: "Copy last week", d: "Most weeks look like the last one. Copy it across, then adjust." },
  { t: "Real-world shifts", d: "Split shifts, unpaid breaks and late closes past midnight, all counted correctly." },
  { t: "Hours and wages", d: "Paid hours per person and for the team, with an estimate of the week's wages." },
  { t: "One link for the team", d: "Pin it in your group chat. It always shows the latest published roster." },
  { t: "Printable PDF", d: "A clean one-page A4 roster for the staff room or the group chat." },
  { t: "Time-off requests", d: "Staff request days off from their link. You approve or decline on the roster." },
  { t: "Made for your phone", d: "Day-by-day cards on mobile, a full week grid on a laptop. Nothing to install." },
  { t: "Hours for payroll", d: "Download paid hours with payroll IDs for Xero, MYOB or your bookkeeper." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Smeasy",
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
          Rostering for small Australian businesses. Without the fuss.
        </h1>
        <p style={{ fontSize: "clamp(16px, 2.2vw, 19px)", color: C.secondary, maxWidth: 620, margin: "0 auto 28px", lineHeight: 1.55 }}>
          Build the week in minutes, share it with your team on one link, and send the hours to payroll. Staff don&apos;t need an app or a password.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/auth/login/" style={{ background: C.dark, color: C.white, padding: "14px 26px", borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>Get started free</Link>
          <Link href="#how-it-works" style={{ background: C.white, color: C.dark, border: `1px solid ${C.border}`, padding: "14px 26px", borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>How it works</Link>
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 14 }}>No credit card. Sign in with your email.</p>
      </section>

      {/* Roster preview */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <RosterPreview />
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ ...wrap, marginBottom: 72 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "0 0 32px" }}>How it works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {steps.map((s) => (
            <div key={s.n} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: 22 }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, marginBottom: 12 }}>{s.n}</div>
              <h3 style={{ fontSize: 18, margin: "0 0 6px" }}>{s.t}</h3>
              <p style={{ fontSize: 15, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, textAlign: "center", margin: "0 0 8px" }}>Everything a small team needs. Nothing it doesn&apos;t.</h2>
        <p style={{ textAlign: "center", color: C.secondary, margin: "0 0 32px", fontSize: 16 }}>Smeasy does rostering, and does it simply.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
          {features.map((f) => (
            <div key={f.t} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
              <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>{f.t}</h3>
              <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For staff */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <div style={{ background: C.dark, color: C.white, borderRadius: 18, padding: "36px 28px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 26, margin: "0 0 10px" }}>Your staff will actually use it</h2>
            <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0, color: "#d9d6cc" }}>
              No app to download, no account, no password. Staff open the team link, pick their name and see their shifts and hours. They can download the roster as a PDF too.
            </p>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, lineHeight: 1.9, color: "#eceae3" }}>
            <li>Only sees published rosters, never your drafts</li>
            <li>Names and shift times only, no pay rates or phone numbers</li>
            <li>Reset the link any time someone leaves</li>
            <li>Data stored in Australia (Sydney)</li>
          </ul>
        </div>
      </section>

      {/* Guides */}
      <section style={{ ...wrap, marginBottom: 72 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Rostering guides</h2>
          <Link href="/guides/" style={{ color: C.secondary, fontSize: 15 }}>All guides →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {featured.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}/`} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18, textDecoration: "none", color: C.dark }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{g.category}</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{g.title}</div>
              <div style={{ fontSize: 14, color: C.secondary, lineHeight: 1.5 }}>{g.description}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...wrap, textAlign: "center" }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, margin: "0 0 10px" }}>Ready to ditch the spreadsheet?</h2>
        <p style={{ color: C.secondary, fontSize: 16, margin: "0 0 22px" }}>Free during early access. Your first roster takes about five minutes.</p>
        <Link href="/auth/login/" style={{ background: C.dark, color: C.white, padding: "14px 28px", borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>Get started free</Link>
        <p style={{ fontSize: 14, color: C.muted, marginTop: 18 }}>Questions? Read the <Link href="/faq/" style={{ color: C.secondary }}>FAQ</Link>.</p>
      </section>
    </>
  );
}

// Static illustration of the roster screen (sample data).
function RosterPreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows: { name: string; shifts: (string | null)[]; hrs: string }[] = [
    { name: "Sam", shifts: ["6:30–2:30", "6:30–2:30", null, "6:30–2:30", "7–11 · 4–10", null, null], hrs: "32.0" },
    { name: "Priya", shifts: ["9–5", null, "9–5", null, null, "8–4", "8–4"], hrs: "30.0" },
    { name: "Tom", shifts: [null, null, null, null, "5pm–2am", "5pm–2am", null], hrs: "17.0" },
    { name: "Lily", shifts: [null, "11–3", "11–3", "11–3", null, "Off", null], hrs: "12.0" },
  ];
  return (
    <div aria-label="Example roster" style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, overflowX: "auto", boxShadow: "0 12px 40px rgba(33,31,26,0.06)" }}>
      <div style={{ minWidth: 720 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
          <strong style={{ fontSize: 15 }}>17 Nov – 23 Nov</strong>
          <span style={{ fontSize: 13, color: "#1a6b2f", fontWeight: 600 }}>Published</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: C.secondary }}><strong style={{ color: C.dark }}>91.0</strong> paid hours · Wages <strong style={{ color: C.dark }}>≈ $2,730</strong></span>
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
                    width: "100%", textAlign: "center", fontSize: 11, fontWeight: 700, borderRadius: 8, padding: "6px 2px",
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
    </div>
  );
}
