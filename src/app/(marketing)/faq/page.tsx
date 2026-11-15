import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { C, pageTitle, groupTitle, lead, card, button, link } from "@/lib/mkt";
import { faqGroups } from "@/content/faq";
import { SIGNUP_HREF, SIGNUP_CTA } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ: rostering questions answered",
  description: "Answers to common questions about SMEasy: pricing, how staff see the roster, time off, shifts past midnight, payroll exports and where your data is stored.",
  alternates: { canonical: "/faq/" },
  openGraph: { url: "/faq/", title: "SMEasy FAQ" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqGroups.flatMap((g) => g.items).map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function FaqPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 20px 0" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 style={{ ...pageTitle, margin: "0 0 12px" }}>Frequently asked questions</h1>
      <p style={{ ...lead, margin: "0 0 40px" }}>
        Everything you need to know before you start. For step-by-step help, see the <Link href="/guides/" style={link}>guides</Link>.
      </p>
      {faqGroups.map((g) => (
        <section key={g.title} style={{ marginBottom: 36 }}>
          <h2 style={{ ...groupTitle, margin: "0 0 12px" }}>{g.title}</h2>
          <div style={{ ...card, overflow: "hidden" }}>
            {g.items.map((f, i) => (
              <details key={f.q} className="mkt-faq" style={{ borderTop: i ? `1px solid ${C.divider}` : "none" }}>
                <summary style={{ fontSize: 16, fontWeight: 700, color: C.dark, padding: "16px 18px", lineHeight: 1.4 }}>
                  {f.q}
                  <ChevronDown size={19} strokeWidth={2.2} className="mkt-faq-icon" aria-hidden />
                </summary>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: C.secondary, margin: 0, padding: "0 18px 18px", maxWidth: "68ch" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <div style={{ textAlign: "center", marginTop: 48 }}>
        <Link href={SIGNUP_HREF} className="app-press" style={button("accent")}>{SIGNUP_CTA}</Link>
      </div>
    </div>
  );
}
