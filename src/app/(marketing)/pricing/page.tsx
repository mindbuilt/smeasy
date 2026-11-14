import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Pricing — Smeasy",
  description:
    "Every feature is free for teams of up to 10. $19 a month plus GST for bigger teams. Free for everyone during early access.",
  alternates: { canonical: "/pricing/" },
};

const free = [
  "Up to 10 staff",
  "Weekly roster builder with copy last week",
  "Role colours, shift notes and day notes",
  "Unfilled shifts and a daily cover count",
  "Public holidays for your state",
  "Publish to a team link or printable PDF",
  "Personal links for each staff member",
  "Staff time-off requests",
  "Shifts in staff phone calendars",
  "CSV hours export for payroll",
];

const pro = [
  "Everything in Free, plus:",
  "More than 10 staff",
  "Priority email support",
];

export default function PricingPage() {
  return (
    <section style={{ maxWidth: 880, margin: "0 auto", padding: "64px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 700, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
          Simple pricing. No surprises.
        </h1>
        <p style={{ fontSize: 17, color: C.secondary, margin: 0, lineHeight: 1.5 }}>
          Every feature on the free plan. You only pay if your team grows past 10.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
        {/* Free tier */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "28px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.shiftText, background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 999, padding: "3px 10px", display: "inline-block", marginBottom: 14 }}>
            Free during early access
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px" }}>Free</h2>
          <div style={{ fontSize: 14, color: C.secondary, marginBottom: 20 }}>For small teams getting started</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>$0</span>
            <span style={{ fontSize: 14, color: C.muted }}>/month</span>
          </div>
          <Link href="/auth/login/" style={{
            display: "block", textAlign: "center", background: C.white, color: C.dark,
            border: `1px solid ${C.border}`, padding: "12px 20px", borderRadius: C.r1,
            textDecoration: "none", fontSize: 15, fontWeight: 600, marginBottom: 20,
          }}>
            Get started
          </Link>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {free.map((f) => (
              <li key={f} style={{ fontSize: 14, color: C.secondary, paddingLeft: 20, position: "relative" }}>
                <span style={{ position: "absolute", left: 0, color: C.shiftText, fontWeight: 700 }}>&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro tier */}
        <div style={{ background: C.dark, color: C.white, borderRadius: C.r2, padding: "28px 24px", border: `1px solid ${C.dark}` }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.shiftText, background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 999, padding: "3px 10px", display: "inline-block", marginBottom: 14 }}>
            Free during early access
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 2px" }}>Pro</h2>
          <div style={{ fontSize: 14, color: "#b0ad9f", marginBottom: 20 }}>For growing teams</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.02em" }}>$19</span>
            <span style={{ fontSize: 14, color: "#b0ad9f" }}>/month</span>
          </div>
          <div style={{ fontSize: 13, color: "#b0ad9f", marginBottom: 20 }}>Plus GST ($20.90 a month in total). Per business, billed monthly, cancel any time.</div>
          <Link href="/auth/login/" style={{
            display: "block", textAlign: "center", background: C.accent, color: C.dark,
            padding: "12px 20px", borderRadius: C.r1,
            textDecoration: "none", fontSize: 15, fontWeight: 600, marginBottom: 20,
          }}>
            Get started free
          </Link>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
            {pro.map((f, i) => (
              <li key={f} style={{ fontSize: 14, color: i === 0 ? "#b0ad9f" : "#e0ddd4", paddingLeft: 20, position: "relative", fontWeight: i === 0 ? 400 : 400 }}>
                {i > 0 && <span style={{ position: "absolute", left: 0, color: C.accent, fontWeight: 700 }}>&#10003;</span>}
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 40, fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>
        <p style={{ margin: "0 0 6px" }}>
          <strong style={{ color: C.dark }}>Everything is free right now.</strong> We&rsquo;re in early access, so there&rsquo;s no staff limit and nothing to pay. Before any paid plan starts, we&rsquo;ll email you well in advance — no credit card needed until then.
        </p>
        <p style={{ margin: 0 }}>
          Questions? Read the <Link href="/faq/" style={{ color: C.secondary }}>FAQ</Link> or <a href="mailto:hello@smeasy.au" style={{ color: C.secondary }}>get in touch</a>.
        </p>
      </div>
    </section>
  );
}
