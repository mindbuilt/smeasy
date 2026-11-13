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
        <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: "uppercase" }}>Integration</span>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: C.dark, margin: "12px 0 24px 0", lineHeight: 1.2 }}>
          Export Your Roster to Xero or MYOB
        </h1>
        <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
          Get your roster data into payroll software in one click. No manual copy-paste needed.
        </p>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Why Export Your Roster?</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Your roster tells you exactly how many hours each person worked. Your accountant needs that data to process payroll. Instead of manually typing hours into Xero or MYOB, Smeasy exports it for you.
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>No data entry errors</li>
            <li>Saves 20+ minutes per week</li>
            <li>Ready to import directly into your accounting software</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>How to Export</h2>
          <ol style={{ paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Open the roster you want to export</li>
            <li>Click the <strong style={{ color: C.dark }}>Export</strong> button (top right)</li>
            <li>Select format: <strong style={{ color: C.dark }}>Xero</strong> or <strong style={{ color: C.dark }}>MYOB</strong></li>
            <li>Download the file</li>
            <li>Open your accounting software</li>
            <li>Import the file (usually <strong style={{ color: C.dark }}>File → Import</strong>)</li>
          </ol>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
            <strong style={{ color: C.dark }}>What's in the export?</strong> Staff name, hours per day, total weekly hours, role. Everything your accountant needs.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Setting Up Payroll IDs</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            For the cleanest import, add your staff members' payroll IDs in Smeasy:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Go to <strong style={{ color: C.dark }}>Staff Settings</strong></li>
            <li>Edit each staff member</li>
            <li>Add their <strong style={{ color: C.dark }}>Payroll ID</strong> (from Xero/MYOB)</li>
            <li>Save</li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Now when you export, the payroll IDs match your accounting software exactly. The import will be seamless.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Pro Tips</h2>
          <ul style={{ paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li><strong style={{ color: C.dark }}>Export at week-end</strong> — Finish your roster Friday evening, export, send to your accountant.</li>
            <li><strong style={{ color: C.dark }}>Keep a backup</strong> — Save exported files in a folder so you have a record.</li>
            <li><strong style={{ color: C.dark }}>Check penalties</strong> — Xero/MYOB handle penalty rates; Smeasy shows base hours.</li>
            <li><strong style={{ color: C.dark }}>Ask your accountant</strong> — They might have a preferred import format. Smeasy can export to their spec.</li>
          </ul>
        </section>

        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Stop manual data entry.</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>Export rosters to payroll in one click.</p>
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
