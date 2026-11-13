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
      {/* Navigation */}
      <nav style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: C.dark, textDecoration: "none" }}>Smeasy</Link>
        <div style={{ display: "flex", gap: 16 }}>
          <Link href="/guides" style={{ color: C.secondary, textDecoration: "none", fontSize: 14 }}>Guides</Link>
          <Link href="/auth/login" style={{ color: C.secondary, textDecoration: "none", fontSize: 14 }}>Login</Link>
        </div>
      </nav>

      {/* Article */}
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "60px 20px" }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: "uppercase" }}>Getting Started</span>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: C.dark, margin: "12px 0 24px 0", lineHeight: 1.2 }}>
            How to Create a Roster in 5 Minutes
          </h1>
          <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
            A complete step-by-step guide to building your first weekly staff roster using Smeasy.
          </p>
        </div>

        <div style={{ background: C.white, borderRadius: 12, padding: 32, marginBottom: 40, border: `1px solid ${C.border}` }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: C.dark, margin: "0 0 12px 0" }}>Table of Contents</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {["Step 1: Add Your Staff", "Step 2: Create Your First Roster", "Step 3: Add Shifts", "Step 4: Publish & Notify", "Pro Tips for Faster Rostering"].map((item) => (
              <li key={item} style={{ padding: "8px 0", color: C.secondary }}>
                • {item}
              </li>
            ))}
          </ul>
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Step 1: Add Your Staff</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Before you create a roster, you need to add your team. In Smeasy, go to <strong style={{ color: C.dark }}>Staff Settings</strong> and add each staff member's name and role.
          </p>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            You can set roles like <strong style={{ color: C.dark }}>Floor, Kitchen, Barista, Bar, Manager, or Other</strong>. You can also mark who can be rostered (some staff might be admin-only).
          </p>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
            <strong style={{ color: C.dark }}>Pro tip:</strong> Import your staff list if you have it in a spreadsheet — saves time if you have 20+ people.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Step 2: Create Your First Roster</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Go to <strong style={{ color: C.dark }}>New Roster</strong> and select the week you want to schedule. Smeasy will show a calendar view with Monday–Sunday.
          </p>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            You'll see your staff list on the left and the week's dates across the top. Empty cells mean no shift is assigned yet.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Step 3: Add Shifts</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Click any empty cell to add a shift. A modal will pop up where you can enter:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 1.8 }}>
            <li><strong style={{ color: C.dark }}>Start time</strong> (e.g., 09:00)</li>
            <li><strong style={{ color: C.dark }}>End time</strong> (e.g., 17:00)</li>
            <li><strong style={{ color: C.dark }}>Role</strong> (Floor, Kitchen, etc.)</li>
          </ul>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Hit save and the shift appears in green on the calendar. You can edit it anytime by clicking on it again.
          </p>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
            <strong style={{ color: C.dark }}>Tip:</strong> Staff can also request time off. Click the <strong style={{ color: C.dark }}>Time Off</strong> tab in the cell editor to mark someone unavailable.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Step 4: Publish & Notify</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Once your roster is done, click <strong style={{ color: C.dark }}>Publish</strong>. Your staff will be notified instantly (if you're on the Pro plan with SMS, they'll get a text).
          </p>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Your roster is now live. Staff can see their shifts in the app or via email notification.
          </p>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
            <strong style={{ color: C.dark }}>Don't worry:</strong> You can still edit the roster after publishing. Changes are updated instantly.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Pro Tips for Faster Rostering</h2>
          <ul style={{ paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li><strong style={{ color: C.dark }}>Use recurring shifts</strong> — if Sarah works every Tuesday & Thursday, set it once and it auto-fills.</li>
            <li><strong style={{ color: C.dark }}>Copy from last week</strong> — if next week is similar, duplicate last week's roster and edit from there.</li>
            <li><strong style={{ color: C.dark }}>Export for payroll</strong> — download as a spreadsheet and import into Xero or MYOB.</li>
            <li><strong style={{ color: C.dark }}>Mobile-friendly</strong> — create rosters on your phone on the commute to work.</li>
          </ul>
        </section>

        {/* CTA */}
        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Ready to create your first roster?</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>It takes less than 5 minutes. Free for up to 10 staff.</p>
          <Link href="/auth/login" style={{ display: "inline-block", background: C.dark, color: C.white, padding: "12px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
            Get started
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "40px 20px", color: C.muted, fontSize: 13, textAlign: "center" }}>
        <p style={{ margin: 0 }}>© 2025 Smeasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
