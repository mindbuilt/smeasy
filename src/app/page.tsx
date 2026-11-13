"use client";

import Link from "next/link";
import { useState } from "react";

const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  muted: "#8a8678",
  secondary: "#5b584f",
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Navigation */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.dark }}>Smeasy</div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Link href="/auth/login" style={{ color: C.secondary, textDecoration: "none", fontSize: 14 }}>Login</Link>
          <Link href="/auth/login" style={{ background: C.accent, color: C.dark, padding: "8px 16px", borderRadius: 6, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Sign up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: "60px 20px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700, color: C.dark, margin: "0 0 16px 0", lineHeight: 1.2 }}>
          Roster management that actually works
        </h1>
        <p style={{ fontSize: "clamp(16px, 3vw, 18px)", color: C.muted, margin: "0 0 32px 0", lineHeight: 1.6 }}>
          Create weekly rosters in seconds. Staff know their shifts instantly. No fuss, no spreadsheets, no chaos.
        </p>
        <div style={{ display: "flex", gap: 12, flexDirection: "column", alignItems: "center" }}>
          <Link href="/auth/login" style={{ background: C.accent, color: C.dark, padding: "12px 32px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 600, width: "100%", maxWidth: 300, textAlign: "center" }}>
            Get started free
          </Link>
          <Link href="#how-it-works" style={{ color: C.secondary, textDecoration: "none", fontSize: 14 }}>
            See how it works →
          </Link>
        </div>
      </section>

      {/* Social Proof */}
      <section style={{ padding: "40px 20px", background: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
        <p style={{ color: C.muted, fontSize: 14, margin: 0, marginBottom: 16 }}>Used by hospitality managers across Australia</p>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap", fontSize: 12, color: C.secondary }}>
          <span>Cafes</span>
          <span>•</span>
          <span>Bars</span>
          <span>•</span>
          <span>Restaurants</span>
          <span>•</span>
          <span>Venues</span>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: C.dark, textAlign: "center", margin: "0 0 48px 0" }}>
          Everything you need
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 32 }}>
          <div>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Quick rosters</h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Create a week's roster in under 5 minutes. Drag, drop, done.</p>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📱</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Mobile first</h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Works perfectly on your phone. Edit shifts anywhere, anytime.</p>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔔</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Staff notified</h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Publish and staff are notified instantly. No more "What's my shift?"</p>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Export easily</h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>One click to download. Ready for Xero or MYOB.</p>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✋</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Time off requests</h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Staff request days off. You approve or decline instantly.</p>
          </div>
          <div>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎯</div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Actually simple</h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>No training. No tutorials. No steep learning curve.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: "60px 20px", background: C.white, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: C.dark, textAlign: "center", margin: "0 0 48px 0" }}>
            How it works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: C.accent, width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20, fontWeight: 700, color: C.dark }}>1</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Add your staff</h3>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Import or manually add team members.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: C.accent, width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20, fontWeight: 700, color: C.dark }}>2</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Create shifts</h3>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Drag shifts onto the calendar or click to add.</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ background: C.accent, width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20, fontWeight: 700, color: C.dark }}>3</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Publish</h3>
              <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Send to staff with one click.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "60px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: C.dark, textAlign: "center", margin: "0 0 48px 0" }}>
          Pricing that makes sense
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Free</h3>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px 0" }}>Up to 10 staff</p>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.dark, margin: "0 0 24px 0" }}>$0<span style={{ fontSize: 14, color: C.muted }}>/month</span></div>
            <ul style={{ textAlign: "left", fontSize: 14, color: C.muted, margin: "0 0 24px 0", padding: 0, listStyle: "none" }}>
              <li style={{ padding: "8px 0" }}>✓ Create & publish rosters</li>
              <li style={{ padding: "8px 0" }}>✓ Time off requests</li>
              <li style={{ padding: "8px 0" }}>✓ Export to spreadsheet</li>
              <li style={{ padding: "8px 0", color: C.border }}>SMS notifications</li>
            </ul>
            <Link href="/auth/login" style={{ display: "block", background: C.border, color: C.dark, padding: "10px 20px", borderRadius: 6, textDecoration: "none", fontSize: 14, fontWeight: 600, textAlign: "center" }}>Get started</Link>
          </div>
          <div style={{ background: C.white, border: `2px solid ${C.accent}`, borderRadius: 12, padding: 32, textAlign: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: C.accent, color: C.dark, padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>Popular</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>Pro</h3>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 24px 0" }}>Unlimited staff</p>
            <div style={{ fontSize: 32, fontWeight: 700, color: C.dark, margin: "0 0 24px 0" }}>$19<span style={{ fontSize: 14, color: C.muted }}>/month</span></div>
            <ul style={{ textAlign: "left", fontSize: 14, color: C.muted, margin: "0 0 24px 0", padding: 0, listStyle: "none" }}>
              <li style={{ padding: "8px 0" }}>✓ Everything in Free</li>
              <li style={{ padding: "8px 0" }}>✓ SMS notifications</li>
              <li style={{ padding: "8px 0" }}>✓ Unlimited staff</li>
              <li style={{ padding: "8px 0" }}>✓ Priority support</li>
            </ul>
            <Link href="/auth/login" style={{ display: "block", background: C.accent, color: C.dark, padding: "10px 20px", borderRadius: 6, textDecoration: "none", fontSize: 14, fontWeight: 600, textAlign: "center", fontWeight: 700 }}>Start free trial</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "60px 20px", background: C.dark, textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 700, color: C.white, margin: "0 0 16px 0" }}>
            Ready to ditch the spreadsheet?
          </h2>
          <p style={{ fontSize: 16, color: C.border, margin: "0 0 32px 0", lineHeight: 1.6 }}>
            Free for up to 10 staff. No credit card needed. Create your first roster in 30 seconds.
          </p>
          <Link href="/auth/login" style={{ display: "inline-block", background: C.accent, color: C.dark, padding: "14px 40px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "40px 20px", color: C.muted, fontSize: 13, textAlign: "center" }}>
        <p style={{ margin: 0, marginBottom: 16 }}>
          © 2025 Smeasy. All rights reserved.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="#" style={{ color: C.secondary, textDecoration: "none" }}>Privacy</Link>
          <span>•</span>
          <Link href="#" style={{ color: C.secondary, textDecoration: "none" }}>Terms</Link>
          <span>•</span>
          <Link href="#" style={{ color: C.secondary, textDecoration: "none" }}>Contact</Link>
        </div>
      </footer>
    </div>
  );
}
