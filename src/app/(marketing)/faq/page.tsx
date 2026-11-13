import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/lib/theme";
import { faqGroups } from "@/content/faq";

export const metadata: Metadata = {
  title: "FAQ — questions about Smeasy rostering",
  description: "Answers to common questions about Smeasy: pricing, how staff see the roster, time off, shifts past midnight, payroll exports and where your data is stored.",
  alternates: { canonical: "/faq/" },
  openGraph: { url: "/faq/", title: "Smeasy FAQ" },
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
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px 0" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: "0 0 10px" }}>Frequently asked questions</h1>
      <p style={{ fontSize: 17, color: C.secondary, margin: "0 0 32px" }}>
        Everything you need to know before you start. For step-by-step help, see the <Link href="/guides/" style={{ color: C.dark }}>guides</Link>.
      </p>
      {faqGroups.map((g) => (
        <section key={g.title} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, margin: "0 0 10px" }}>{g.title}</h2>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12 }}>
            {g.items.map((f, i) => (
              <details key={f.q} style={{ borderTop: i ? `1px solid ${C.divider}` : "none", padding: "14px 18px" }}>
                <summary style={{ fontSize: 16, fontWeight: 600, cursor: "pointer", color: C.dark }}>{f.q}</summary>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: C.secondary, margin: "10px 0 2px" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <Link href="/auth/login/" style={{ background: C.dark, color: C.white, padding: "13px 26px", borderRadius: 10, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>Get started free</Link>
      </div>
    </div>
  );
}
