import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { C } from "@/lib/theme";
import { SITE_URL } from "@/lib/site";
import { guides, guideBySlug, Block } from "@/content/guides";

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  const url = `/guides/${g.slug}/`;
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: url },
    openGraph: { url, title: g.title, description: g.description, type: "article" },
  };
}

function render(b: Block, i: number) {
  if ("h2" in b) return <h2 key={i} style={{ fontSize: 22, margin: "32px 0 10px" }}>{b.h2}</h2>;
  if ("p" in b) return <p key={i} style={{ fontSize: 17, lineHeight: 1.65, color: C.secondary, margin: "0 0 14px" }}>{b.p}</p>;
  if ("tip" in b) return (
    <div key={i} style={{ background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 10, padding: "12px 16px", margin: "6px 0 18px", fontSize: 15, lineHeight: 1.55, color: C.shiftText }}>
      <strong>Tip: </strong>{b.tip}
    </div>
  );
  const items = "ul" in b ? b.ul : b.ol;
  const style = { fontSize: 17, lineHeight: 1.65, color: C.secondary, margin: "0 0 16px", paddingLeft: 24 };
  const lis = items.map((t, j) => <li key={j} style={{ marginBottom: 6 }}>{t}</li>);
  return "ul" in b ? <ul key={i} style={style}>{lis}</ul> : <ol key={i} style={style}>{lis}</ol>;
}

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d + "T00:00:00"));

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const others = guides.filter((x) => x.slug !== g.slug).slice(0, 3);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    mainEntityOfPage: `${SITE_URL}/guides/${g.slug}/`,
    publisher: { "@type": "Organization", name: "Smeasy", url: SITE_URL },
  };

  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 0" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav style={{ fontSize: 14, marginBottom: 18 }}>
        <Link href="/guides/" style={{ color: C.secondary }}>← All guides</Link>
      </nav>
      <div style={{ fontSize: 13, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{g.category}</div>
      <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", lineHeight: 1.15, margin: "8px 0 12px" }}>{g.title}</h1>
      <p style={{ fontSize: 14, color: C.muted, margin: "0 0 28px" }}>Updated {fmtDate(g.updated)}</p>
      {g.body.map(render)}

      <div style={{ background: C.dark, color: C.white, borderRadius: 16, padding: "24px 22px", margin: "40px 0" }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Try Smeasy free</div>
        <p style={{ margin: "0 0 16px", color: "#d9d6cc", fontSize: 15 }}>Simple rostering for Australian small businesses. Free during early access.</p>
        <Link href="/auth/login/" style={{ background: C.accent, color: C.dark, padding: "11px 20px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>Get started</Link>
      </div>

      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>More guides</h2>
      <ul style={{ paddingLeft: 20, margin: 0, fontSize: 16, lineHeight: 1.9 }}>
        {others.map((o) => <li key={o.slug}><Link href={`/guides/${o.slug}/`} style={{ color: C.dark }}>{o.title}</Link></li>)}
      </ul>
    </article>
  );
}
