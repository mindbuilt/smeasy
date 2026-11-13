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
        <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: "uppercase" }}>Management</span>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: C.dark, margin: "12px 0 24px 0", lineHeight: 1.2 }}>
          How to Handle Staff Shift Swaps
        </h1>
        <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
          Let your team trade shifts without flooding your inbox. Coming soon to Smeasy — here's how to handle it now.
        </p>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Why Shift Swaps Matter</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Staff have lives outside work. Sometimes they need to swap:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>"Sarah, can I take your Friday shift if you take my Wednesday?"</li>
            <li>Without swaps, they'd call in sick (costing you coverage)</li>
            <li>Swaps keep everyone happy and your roster covered</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Current Best Practice: In-App Requests</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Until swaps are built into Smeasy, here's how to manage them:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Staff contacts each other directly (text, Slack, etc.)</li>
            <li>Once both agree, one requests time off for their original shift</li>
            <li>You approve the time off request</li>
            <li>You manually update the other person's shift</li>
            <li>Publish the updated roster</li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            It's not automated yet, but at least it keeps requests out of your email.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Swap Rules (Set These Clear)</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            To avoid chaos, tell your staff:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li><strong style={{ color: C.dark }}>Similar shifts only</strong> — They can't swap a morning for a late night (different skill sets or energy)</li>
            <li><strong style={{ color: C.dark }}>No compensation needed</strong> — Swaps are even trades, not paid changes</li>
            <li><strong style={{ color: C.dark }}> 48-hour notice</strong> — Can't swap last-minute unless you approve</li>
            <li><strong style={{ color: C.dark }}>Tell the manager</strong> — Don't assume it's approved until you confirm</li>
            <li><strong style={{ color: C.dark }}>Limited swaps</strong> — Maybe 2 swaps per person per month to avoid chaos</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Why Not Just Accept Any Swap?</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            You need to approve swaps because:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>One person might be much faster than the other (experience gap)</li>
            <li>You might lose coverage at critical times</li>
            <li>Someone might be on probation and shouldn't be swapping yet</li>
            <li>Hours need to be tracked for payroll accurately</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Coming Soon: Automatic Swaps</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Smeasy is working on built-in shift swaps. Soon, staff will be able to:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Request a swap directly in the app</li>
            <li>See available staff to swap with</li>
            <li>You approve or decline with one click</li>
            <li>Roster updates automatically</li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Stay tuned!
          </p>
        </section>

        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Happy staff, stable rosters.</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>Manage shifts and swaps with Smeasy.</p>
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
