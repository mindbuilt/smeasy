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
          Managing Time Off Requests
        </h1>
        <p style={{ fontSize: 18, color: C.muted, margin: "0 0 40px 0", lineHeight: 1.6 }}>
          Handle staff leave requests without the email chaos. Approve or decline in seconds.
        </p>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>How Staff Request Time Off</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Staff don't email you anymore. They request time off directly in Smeasy:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>They open their roster week</li>
            <li>Click the day they want off</li>
            <li>Select <strong style={{ color: C.dark }}>Request Time Off</strong></li>
            <li>Add a reason (optional)</li>
            <li>Hit <strong style={{ color: C.dark }}>Submit</strong></li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            You get a notification. No more "Can I have Tuesday off?" texts at 11pm.
          </p>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>How to Approve or Decline</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            When a staff member requests time off:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>Go to the roster for that week</li>
            <li>You'll see "Off (req)" in orange on their day</li>
            <li>Click the cell to open the request</li>
            <li>Choose <strong style={{ color: C.dark }}>Approve</strong> or <strong style={{ color: C.dark }}>Decline</strong></li>
            <li>Save — they're instantly notified</li>
          </ol>
          <div style={{ background: "#f0ede4", border: `1px solid ${C.border}`, borderRadius: 8, padding: 16, marginTop: 16 }}>
            <strong style={{ color: C.dark }}>Pro tip:</strong> Approved requests show as "Off" in green. Pending requests stay orange so you don't forget them.
          </div>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>Best Practices for Time Off</h2>
          <ul style={{ paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li><strong style={{ color: C.dark }}>Set a deadline</strong> — Tell staff they need to request 2 weeks in advance.</li>
            <li><strong style={{ color: C.dark }}>Be fair</strong> — Use it consistently so staff know expectations.</li>
            <li><strong style={{ color: C.dark }}>Communicate early</strong> — If you decline, let them know why ASAP.</li>
            <li><strong style={{ color: C.dark }}>Check coverage</strong> — Before approving, make sure you have enough staff that day.</li>
            <li><strong style={{ color: C.dark }}>Use the reason field</strong> — They can explain (sick, holiday, personal) so you understand urgency.</li>
          </ul>
        </section>

        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>What About Last-Minute Time Off?</h2>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>
            Someone's sick and can't come in today? No problem:
          </p>
          <ol style={{ marginTop: 16, paddingLeft: 20, fontSize: 16, color: C.muted, lineHeight: 2 }}>
            <li>They text/call/message you</li>
            <li>You open Smeasy and click their shift</li>
            <li>Delete the shift or mark them as "Off"</li>
            <li>Publish the updated roster</li>
            <li>Everyone sees the change instantly</li>
          </ol>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.8, margin: "16px 0 0 0" }}>
            Much faster than manually texting everyone "Sarah's not coming in, can someone cover?"
          </p>
        </section>

        <div style={{ background: C.accent, borderRadius: 12, padding: 32, textAlign: "center", marginBottom: 60 }}>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: C.dark, margin: "0 0 12px 0" }}>Ready to stop the time-off chaos?</h3>
          <p style={{ fontSize: 16, color: C.dark, margin: "0 0 20px 0" }}>Let staff request time off in-app instead of texts.</p>
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
