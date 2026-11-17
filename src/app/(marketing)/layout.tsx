import Link from "next/link";
import type { ReactNode } from "react";
import { C } from "@/lib/mkt";
import { LEGAL_ENTITY } from "@/lib/site";
import AccountLinks from "@/components/AccountLinks";
import MarketingNav from "@/components/MarketingNav";
import CookieNotice, { CookieSettingsLink } from "@/components/CookieNotice";
import HoldingGate from "@/components/HoldingGate";

// Public, pre-login pages: landing, guides, FAQ. Analytics loads here only,
// after consent — never on manager or staff pages, whose URLs carry private links.
// Same system as the app screens (the .app scope): cool ground, Figtree, ink, one lime.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  const footLink = { color: C.secondary, textDecoration: "none" } as const;
  return (
    <HoldingGate>
    <div className="app" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <CookieNotice />

      <header style={{
        position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.92)",
        backdropFilter: "saturate(1.4) blur(12px)", WebkitBackdropFilter: "saturate(1.4) blur(12px)",
        borderBottom: `1px solid ${C.border}`, paddingTop: "env(safe-area-inset-top)",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 20px", height: 60, display: "flex", alignItems: "center", gap: 18 }}>
          <Link href="/" aria-label="SMEasy home" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none", marginRight: 6 }}>
            <span style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "block", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)" }} />
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em", color: C.dark }}>SMEasy</span>
          </Link>
          <MarketingNav />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <AccountLinks />
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer style={{ borderTop: `1px solid ${C.border}`, marginTop: 88, background: C.white }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 20px calc(28px + env(safe-area-inset-bottom))", display: "flex", flexWrap: "wrap", gap: "14px 24px", alignItems: "center", fontSize: 14, color: C.muted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 14, height: 14, borderRadius: 4, background: C.accent, display: "block" }} />
            © {new Date().getFullYear()} {LEGAL_ENTITY} · SMEasy
          </span>
          <nav aria-label="Footer" style={{ marginLeft: "auto", display: "flex", gap: "8px 18px", flexWrap: "wrap", fontWeight: 600 }}>
            <Link href="/pricing/" style={footLink}>Pricing</Link>
            <Link href="/guides/" style={footLink}>Guides</Link>
            <Link href="/faq/" style={footLink}>FAQ</Link>
            <Link href="/privacy/" style={footLink}>Privacy</Link>
            <Link href="/terms/" style={footLink}>Terms</Link>
            <Link href="/contact/" style={footLink}>Contact</Link>
            <CookieSettingsLink style={{ ...footLink, textDecoration: "none", fontWeight: 600 }} />
          </nav>
        </div>
      </footer>
    </div>
    </HoldingGate>
  );
}
