import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { C, pageTitle, groupTitle, lead, card, link } from "@/lib/mkt";
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
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "56px 20px 0" }}>
      <h1 style={{ ...pageTitle, margin: "0 0 12px" }}>Rostering guides</h1>
      <p style={{ ...lead, margin: "0 0 40px" }}>
        How to build, share and run a staff roster — with SMEasy, and good rostering habits in general.
      </p>
      {order.map((cat) => {
        const list = guides.filter((g) => g.category === cat);
        if (!list.length) return null;
        return (
          <section key={cat} style={{ marginBottom: 36 }}>
            <h2 style={{ ...groupTitle, margin: "0 0 12px" }}>{cat}</h2>
            <div style={{ ...card, overflow: "hidden" }}>
              {list.map((g) => (
                <Link key={g.slug} href={`/guides/${g.slug}/`} className="mkt-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{g.title}</div>
                    <div style={{ fontSize: 15, color: C.secondary, lineHeight: 1.5 }}>{g.description}</div>
                  </div>
                  <ChevronRight size={20} strokeWidth={2.2} className="mkt-chev" aria-hidden />
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <p style={{ fontSize: 16, color: C.secondary }}>Got a quick question? Try the <Link href="/faq/" style={link}>FAQ</Link>.</p>
    </div>
  );
}
