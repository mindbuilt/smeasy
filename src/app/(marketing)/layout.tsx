import Link from "next/link";
import type { ReactNode } from "react";
import { C } from "@/lib/theme";
import { CONTACT_EMAIL, LEGAL_ENTITY } from "@/lib/site";
import CookieNotice, { CookieSettingsLink } from "@/components/CookieNotice";

// Public, pre-login pages: landing, guides, FAQ. Analytics loads here only,
// after consent — never on manager or staff pages, whose URLs carry private links.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.dark }}>
      <CookieNotice />

      <header style={{ borderBottom: `1px solid ${C.border}`, background: C.white }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <span style={{ width: 24, height: 24, borderRadius: C.r1, background: C.accent, display: "block" }} />
            <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>Smeasy</span>
          </Link>
          <nav className="mkt-nav" style={{ display: "flex", gap: 18, fontSize: 14, fontWeight: 500 }}>
            <Link href="/pricing/" style={{ color: C.secondary, textDecoration: "none" }}>Pricing</Link>
            <Link href="/guides/" style={{ color: C.secondary, textDecoration: "none" }}>Guides</Link>
            <Link href="/faq/" style={{ color: C.secondary, textDecoration: "none" }}>FAQ</Link>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/auth/login/" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Log in</Link>
            <Link href="/auth/login/" style={{ background: C.dark, color: C.white, padding: "9px 16px", borderRadius: C.r1, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Get started</Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 64 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", fontSize: 13, color: C.muted }}>
          <span>© {new Date().getFullYear()} {LEGAL_ENTITY} · Smeasy</span>
          <nav style={{ marginLeft: "auto", display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/pricing/" style={{ color: C.secondary }}>Pricing</Link>
            <Link href="/guides/" style={{ color: C.secondary }}>Guides</Link>
            <Link href="/faq/" style={{ color: C.secondary }}>FAQ</Link>
            <Link href="/auth/login/" style={{ color: C.secondary }}>Log in</Link>
            <Link href="/privacy/" style={{ color: C.secondary }}>Privacy</Link>
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: C.secondary }}>Contact</a>
            <CookieSettingsLink style={{ color: C.secondary }} />
          </nav>
        </div>
      </footer>
    </div>
  );
}
