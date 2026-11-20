import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { C, pageTitle, groupTitle, card, inkCard, onInk, button, pill } from "@/lib/mkt";
import { SITE_URL, SIGNUPS_OPEN, SIGNUP_HREF, SIGNUP_CTA_SHORT } from "@/lib/site";
import { guides, guideBySlug, Block } from "@/content/guides";
import { guideImage, GUIDE_IMAGE } from "@/content/guideImages";
import DeviceShot from "@/components/DeviceShot";

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
    openGraph: {
      url, title: g.title, description: g.description, type: "article",
      images: [{ url: guideImage(g.slug).src, ...GUIDE_IMAGE, alt: guideImage(g.slug).alt }],
    },
    twitter: { card: "summary_large_image" },
  };
}

const text = { fontSize: 17, lineHeight: 1.7, color: "#374151", margin: "0 0 16px" } as const;

function render(b: Block, i: number) {
  if ("h2" in b) return <h2 key={i} style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2, margin: "40px 0 12px", color: C.dark }}>{b.h2}</h2>;
  if ("p" in b) return <p key={i} style={text}>{b.p}</p>;
  if ("shot" in b) return (
    <figure key={i} style={{ margin: "26px 0 30px" }}>
      <DeviceShot name={b.shot} alt={b.alt} />
      <figcaption style={{ fontSize: 14, color: C.muted, textAlign: "center", margin: "16px auto 0", maxWidth: 460, lineHeight: 1.45 }}>{b.caption}</figcaption>
    </figure>
  );
  if ("tip" in b) return (
    <div key={i} style={{ display: "flex", gap: 12, background: "#ecfccb", borderRadius: 12, padding: "14px 16px", margin: "8px 0 22px", fontSize: 16, lineHeight: 1.55, color: "#3f6212" }}>
      <Lightbulb size={19} strokeWidth={2.2} style={{ flex: "none", marginTop: 2 }} aria-hidden />
      <div><strong style={{ fontWeight: 700 }}>Tip: </strong>{b.tip}</div>
    </div>
  );
  const items = "ul" in b ? b.ul : b.ol;
  // Tailwind's reset strips list markers; put them back for reading.
  const style = { ...text, margin: "0 0 18px", paddingLeft: 24, listStyle: "ul" in b ? "disc" : "decimal" };
  const lis = items.map((t, j) => <li key={j} style={{ marginBottom: 8, paddingLeft: 4 }}>{t}</li>);
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
    image: `${SITE_URL}${guideImage(g.slug).src}`,
    publisher: { "@type": "Organization", name: "SMEasy", url: SITE_URL },
  };

  return (
    <article style={{ maxWidth: 720, margin: "0 auto", padding: "36px 20px 0" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav style={{ marginBottom: 22 }}>
        <Link href="/guides/" className="mkt-navlink" style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: -10, color: C.secondary }}>
          <ChevronLeft size={18} strokeWidth={2.2} aria-hidden />All guides
        </Link>
      </nav>
      <h1 style={{ ...pageTitle, fontSize: "clamp(30px, 5vw, 42px)", margin: "0 0 16px" }}>{g.title}</h1>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", margin: "0 0 26px", fontSize: 14, color: C.muted }}>
        <span style={pill("quiet")}>{g.category}</span>
        <span>Updated {fmtDate(g.updated)}</span>
      </div>
      <img src={guideImage(g.slug).src} alt={guideImage(g.slug).alt} {...GUIDE_IMAGE} fetchPriority="high"
        style={{ width: "100%", height: "auto", display: "block", borderRadius: C.r2, boxShadow: C.shadow, margin: "0 0 36px", background: C.divider }} />
      {g.body.map(render)}

      <div style={{ ...inkCard, padding: "26px 24px", margin: "48px 0 40px" }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6 }}>{SIGNUPS_OPEN ? "Try SMEasy free" : "SMEasy is coming soon"}</div>
        <p style={{ margin: "0 0 18px", color: onInk, fontSize: 16, lineHeight: 1.5 }}>
          {SIGNUPS_OPEN ? "Simple rostering for Australian small businesses. Free during the open beta." : "Simple rostering for Australian small businesses. Join the waitlist and we'll let you know when it opens."}
        </p>
        <Link href={SIGNUP_HREF} className="app-press" style={button("onInk", "md")}>{SIGNUP_CTA_SHORT}</Link>
      </div>

      <h2 style={{ ...groupTitle, margin: "0 0 12px" }}>More guides</h2>
      <div style={{ ...card, overflow: "hidden" }}>
        {others.map((o) => (
          <Link key={o.slug} href={`/guides/${o.slug}/`} className="mkt-row">
            <img src={guideImage(o.slug).thumb} alt="" width={84} height={47} loading="lazy"
              style={{ width: 84, height: 47, objectFit: "cover", borderRadius: 8, flex: "none", background: C.divider }} />
            <span style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>{o.title}</span>
            <ChevronRight size={20} strokeWidth={2.2} className="mkt-chev" aria-hidden />
          </Link>
        ))}
      </div>
    </article>
  );
}
