import type { Metadata } from "next";
import Link from "next/link";
import { C } from "@/lib/theme";
import { guides, Guide } from "@/content/guides";

export const metadata: Metadata = {
  title: "Rostering guides for small businesses",
  description: "Practical guides to staff rostering for Australian cafés, restaurants and shops — building a roster, sharing it, time off, swaps and payroll.",
  alternates: { canonical: "/guides/" },
  openGraph: { url: "/guides/", title: "Rostering guides | SMEasy" },
};

const order: Guide["category"][] = ["Getting started", "Running your roster", "Payroll", "Advice"];

export default function GuidesIndex() {
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 20px 0" }}>
      <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: "0 0 10px" }}>Rostering guides</h1>
      <p style={{ fontSize: 17, color: C.secondary, margin: "0 0 36px", lineHeight: 1.5 }}>
        How to build, share and run a staff roster — with SMEasy, and good rostering habits in general.
      </p>
      {order.map((cat) => {
        const list = guides.filter((g) => g.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 10px" }}>{cat}</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {list.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}/`} style={{ display: "block", background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "16px 18px", textDecoration: "none", color: C.dark }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{g.title}</div>
                  <div style={{ fontSize: 14, color: C.secondary, lineHeight: 1.5 }}>{g.description}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <p style={{ fontSize: 15, color: C.secondary }}>Got a quick question? Try the <Link href="/faq/" style={{ color: C.dark }}>FAQ</Link>.</p>
    </div>
  );
}
