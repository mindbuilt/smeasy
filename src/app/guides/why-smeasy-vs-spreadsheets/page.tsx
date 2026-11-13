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
          <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: "uppercase" }}>Comparison</span>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: C.dark, margin: "12px 0 24px 0", lineHeight: 1.2 }}>
            Why Smeasy Beats Spreadsheets for Roster Management
          </h1>
          <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
            Stop managing rosters with Google Sheets and Excel. Here's why a dedicated roster tool is worth it.
          </p>
        </div>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>The Problem with Spreadsheets</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Spreadsheets are cheap and familiar. That's why so many cafes, bars, and restaurants still use them. But cheap comes with a hidden cost:
          </p>
          <ul style={{ marginTop: 20, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li><strong style={{ color: C.dark }}>No notifications</strong> — You manually text or email every staff member their shifts.</li>
            <li><strong style={{ color: C.dark }}>Errors are easy</strong> — Formulas break, people overwrite data, shifts get double-booked.</li>
            <li><strong style={{ color: C.dark }}>Mobile is painful</strong> — Squinting at a spreadsheet on your phone is terrible.</li>
            <li><strong style={{ color: C.dark }}>Updates are chaotic</strong> — Someone calls in sick and you have to manually resend the whole roster.</li>
            <li><strong style={{ color: C.dark }}>No audit trail</strong> — Who changed what? When? Good luck finding out.</li>
            <li><strong style={{ color: C.dark }}>Integration is manual</strong> — Copy, paste, import into Xero. Repeat every week.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48, background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 20px 0" }}>Spreadsheet vs Smeasy</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "12px 0", color: C.dark, fontWeight: 600 }}>Feature</th>
                <th style={{ textAlign: "center", padding: "12px 0", color: C.dark, fontWeight: 600 }}>Spreadsheet</th>
                <th style={{ textAlign: "center", padding: "12px 0", color: C.accent, fontWeight: 600 }}>Smeasy</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Staff notifications", "❌ Manual", "✅ Automatic"],
                ["Mobile-friendly", "❌ No", "✅ Yes"],
                ["Prevent double-booking", "❌ Easy to miss", "✅ Prevented"],
                ["Edit & update instantly", "❌ Manual resend", "✅ Automatic"],
                ["Time off requests", "❌ Text/email chaos", "✅ In-app approval"],
                ["Export to Xero/MYOB", "❌ Manual copy/paste", "✅ One click"],
                ["See who made changes", "❌ No history", "✅ Full audit trail"],
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: "12px 0", color: C.dark, fontWeight: 500 }}>{row[0]}</td>
                  <td style={{ textAlign: "center", padding: "12px 0", color: C.muted }}>{row[1]}</td>
                  <td style={{ textAlign: "center", padding: "12px 0", color: C.secondary }}>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Real Cost of Spreadsheets</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            It's not about the cost of the tool. It's about the time you waste:
          </p>
          <div style={{ marginTop: 20, paddingLeft: 20 }}>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "0 0 16px 0" }}>
              <strong style={{ color: C.dark }}>Every week:</strong>
            </p>
            <ul style={{ paddingLeft: 20, margin: "0 0 16px 0" }}>
              <li style={{ fontSize: 16, color: C.muted, lineHeight: 1.8 }}>15 mins to create the roster</li>
              <li style={{ fontSize: 16, color: C.muted, lineHeight: 1.8 }}>15 mins to copy & send it to 10+ people</li>
              <li style={{ fontSize: 16, color: C.muted, lineHeight: 1.8 }}>10 mins answering "What's my shift?" texts</li>
              <li style={{ fontSize: 16, color: C.muted, lineHeight: 1.8 }}>20 mins fixing errors and double-bookings</li>
              <li style={{ fontSize: 16, color: C.muted, lineHeight: 1.8 }}>10 mins exporting and importing to payroll</li>
            </ul>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              <strong style={{ color: C.dark }}>That's 70 minutes a week.</strong> Or 61 hours a year.
            </p>
          </div>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 20 }}>
            <p style={{ fontSize: 16, color: C.dark, margin: 0 }}>
              At $30/hour labor cost, that's <strong>$1,830 a year</strong> in wasted manager time. Smeasy costs $228 a year. That's a 8x return on investment.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>What Smeasy Does Better</h2>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>💬 Staff Know Their Shifts Instantly</h3>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              Publish once, staff are notified via email or SMS (Pro plan). No more back-and-forth messages.
            </p>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>📱 Works on Your Phone</h3>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              Create and edit rosters on mobile. No squinting at spreadsheets or tiny cells.
            </p>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>🔒 Prevents Mistakes</h3>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              No double-booking, formula errors, or accidental deletions. The app enforces valid data.
            </p>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>📊 One-Click Export</h3>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              Download your roster and import directly into Xero or MYOB. No manual copy/paste.
            </p>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "0 0 8px 0" }}>🔄 Staff Can Request Time Off</h3>
            <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
              No more "Can I have Tuesday off?" texts. They request in-app, you approve with one click.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>The Bottom Line</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Spreadsheets are "free" but cost you time and sanity every single week. Smeasy costs $228/year and saves you 61 hours. It's an easy decision.
          </p>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Plus, your staff will actually know their shifts without asking you five times.
          </p>
        </section>

        {/* CTA */}
        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Ready to ditch the spreadsheet?</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>Try Smeasy free. No credit card needed.</p>
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
