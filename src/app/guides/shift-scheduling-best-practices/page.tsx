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
          Shift Scheduling Best Practices
        </h1>
        <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
          Create rosters that keep your team happy and your business running smoothly.
        </p>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>1. Plan Ahead (2+ Weeks)</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Don't surprise your staff with shifts they didn't expect. Create rosters 2-3 weeks in advance so:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Staff can plan their personal time</li>
            <li>They can request time off early</li>
            <li>You have time to find cover if someone calls in sick</li>
            <li>Everyone knows what to expect</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>2. Balance Workload Fairly</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Don't burn out your good workers. When creating shifts:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Rotate who gets weekend shifts</li>
            <li>Mix early and late shifts so no one's always on nights</li>
            <li>Check total hours per person (use Smeasy's weekly hours counter)</li>
            <li>Give consistent schedules to reliable staff (Monday-Friday, same times)</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>3. Cover Peak Times</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Your busiest times need your best people:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Friday & Saturday nights? Schedule experienced staff</li>
            <li>Lunch rush? Get your fastest servers on</li>
            <li>Slow Tuesday afternoon? Fine to roster a junior or trainee</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>4. Respect Availability</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Some staff are only available certain days (uni, part-time, second job). Remember who and work around them. Smeasy lets you tag staff availability so you don't forget.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>5. Publish Early</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Once your roster is final, publish it immediately. Don't sit on it for days. Staff want certainty, and delays create anxiety. Publish on Sunday for the week ahead, or Friday for the following Monday.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>6. Keep Buffer Staff Available</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Someone will always call in sick. Keep 1-2 people on a rotating "on-call" list they know about. They stay home but are ready to jump in if needed (and you pay them for it).
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>7. Legal Shifts (Australian Context)</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Check your award:
          </p>
          <ul style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Minimum shift lengths (often 3-4 hours)</li>
            <li>Rest breaks (paid and unpaid)</li>
            <li>Penalty rates (weekends, public holidays, late nights)</li>
            <li>Notice periods for schedule changes</li>
          </ul>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            <strong style={{ color: C.dark }}>Tip:</strong> Ask your accountant or check Fair Work Australia's website for your specific award.
          </p>
        </section>

        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Happy staff = better rosters.</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>Use Smeasy to organize schedules with ease.</p>
          <Link href="/auth/login" style={{ display: "inline-block", background: C.dark, color: C.white, padding: "12px 32px", borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>
            Get started
          </Link>
        </div>
      </article>

      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "40px 20px", color: C.muted, fontSize: 13, textAlign: "center" }}>
        <p style={{ margin: 0 }}>© 2025 Smeasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
