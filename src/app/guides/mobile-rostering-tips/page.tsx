"use client";

import Link from "next/link";

const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  muted: "#8a8678",
  secondary: "#5b584f",
};

export default function Guide() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: C.dark, textDecoration: "none" }}>Smeasy</Link>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/guides" style={{ color: C.secondary, textDecoration: "none", fontSize: 14 }}>Guides</Link>
          <Link href="/auth/login" style={{ color: C.secondary, textDecoration: "none", fontSize: 14 }}>Login</Link>
        </div>
      </nav>

      <article style={{ maxWidth: 720, margin: "0 auto", padding: "60px 20px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: "uppercase" }}>Tips & Tricks</span>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: C.dark, margin: "12px 0 24px 0", lineHeight: 1.2 }}>
          Mobile Rostering Tips
        </h1>
        <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
          Create and edit rosters on your phone. Perfect for managers on the go.
        </p>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 1: Use the Card View on Mobile</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            On your phone, Smeasy automatically switches to card view (one day per card instead of a 7-day grid). This is much easier to read on small screens.
          </p>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
            <strong style={{ color: C.dark }}>Why?</strong> The desktop grid is wide. On a phone, card view gives you focus on one day at a time.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 2: Tap to Add Shifts</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            See a day with no one scheduled? Tap the "Add shift" button and fill in start time, end time, and role. Takes 10 seconds.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 3: Edit Existing Shifts</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Someone's scheduled 09:00–17:00 but you need them until 18:00? Tap their shift and change the end time. No need to delete and recreate.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 4: Last-Minute Call-Outs</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Sarah texts: "I can't come in today." You're at home:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Open Smeasy on your phone</li>
            <li>Find today's roster</li>
            <li>Tap Sarah's shift</li>
            <li>Delete it</li>
            <li>Publish the updated roster</li>
            <li>Everyone sees Sarah's gone</li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Done in 1 minute instead of texting 5 people individually.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 5: Bookmark Your Roster</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Add Smeasy to your phone's home screen so you can open it like an app:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li><strong style={{ color: C.dark }}>iPhone:</strong> Open Safari → smeasy.au → Share → Add to Home Screen</li>
            <li><strong style={{ color: C.dark }}>Android:</strong> Open Chrome → smeasy.au → ⋮ → "Install app"</li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Now you can open Smeasy faster than opening the browser.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 6: Use Notifications</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Turn on push notifications (if on Pro plan with SMS enabled) so you know instantly when:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Staff request time off</li>
            <li>Someone confirms they've seen their shifts</li>
            <li>A staff member responds to a roster change</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Tip 7: Offline Access</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            At the cafe and no WiFi? Smeasy loads fast even on 4G. No need to be online constantly — the app caches your roster.
          </p>
        </section>

        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Manage rosters from anywhere.</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>Works perfectly on your phone.</p>
          <Link href="/auth/login" style={{ display: "inline-block", background: C.dark, color: C.white, padding: "12px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
            Get started free
          </Link>
        </div>
      </article>

      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "40px 20px", color: C.muted, fontSize: 13, textAlign: "center" }}>
        <p style={{ margin: 0 }}>© 2025 Smeasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
