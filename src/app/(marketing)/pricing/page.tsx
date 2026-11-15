import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { C, pageTitle, lead, card, inkCard, button, pill, link } from "@/lib/mkt";
import { SIGNUP_HREF, SIGNUP_CTA, SIGNUP_CTA_SHORT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
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

const price = { fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 } as const;
const tierName = { fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em", margin: "0 0 2px" } as const;

export default function PricingPage() {
  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "64px 20px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ ...pageTitle, margin: "0 0 12px" }}>
          Simple pricing. No surprises.
        </h1>
        <p style={lead}>
          Every feature on the free plan. You only pay if your team grows past 10.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
        {/* Free tier */}
        <div style={{ ...card, padding: "28px 26px" }}>
          <span style={{ ...pill("lime"), marginBottom: 16 }}>Free during early access</span>
          <h2 style={tierName}>Free</h2>
          <div style={{ fontSize: 15, color: C.secondary, marginBottom: 20 }}>For small teams getting started</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 22 }}>
            <span style={price}>$0</span>
            <span style={{ fontSize: 15, color: C.muted }}>/month</span>
          </div>
          <Link href={SIGNUP_HREF} className="app-press" style={{ ...button("secondary"), display: "flex", marginBottom: 22 }}>
            {SIGNUP_CTA_SHORT}
          </Link>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 11 }}>
            {free.map((f) => (
              <li key={f} style={{ fontSize: 15, color: C.secondary, display: "flex", gap: 10, lineHeight: 1.4 }}>
                <Check size={18} strokeWidth={2.4} color="#65a30d" style={{ flex: "none", marginTop: 1 }} aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro tier: the page's one dark surface */}
        <div style={{ ...inkCard, padding: "28px 26px" }}>
          <span style={{ ...pill("lime"), marginBottom: 16 }}>Free during early access</span>
          <h2 style={tierName}>Pro</h2>
          <div style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", marginBottom: 20 }}>For growing teams</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
            <span style={price}>$19</span>
            <span style={{ fontSize: 15, color: "rgba(255,255,255,0.72)" }}>/month</span>
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.72)", marginBottom: 22, lineHeight: 1.45 }}>Plus GST ($20.90 a month in total). Per business, billed monthly, cancel any time.</div>
          <Link href={SIGNUP_HREF} className="app-press" style={{ ...button("onInk"), display: "flex", marginBottom: 22 }}>
            {SIGNUP_CTA}
          </Link>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 11 }}>
            {pro.map((f, i) => (
              <li key={f} style={{ fontSize: 15, color: i === 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.92)", display: "flex", gap: 10, lineHeight: 1.4 }}>
                {i > 0 && <Check size={18} strokeWidth={2.4} color={C.accent} style={{ flex: "none", marginTop: 1 }} aria-hidden />}
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 40, fontSize: 15, color: C.secondary, lineHeight: 1.6, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
        <p style={{ margin: "0 0 8px" }}>
          <strong style={{ color: C.dark }}>Everything is free right now.</strong> We&rsquo;re in early access, so there&rsquo;s no staff limit and nothing to pay. Before any paid plan starts, we&rsquo;ll email you well in advance — no credit card needed until then.
        </p>
        <p style={{ margin: 0 }}>
          Questions? Read the <Link href="/faq/" style={link}>FAQ</Link> or <a href="mailto:hello@smeasy.au" style={link}>get in touch</a>.
        </p>
      </div>
    </section>
  );
}
