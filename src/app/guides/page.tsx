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

const guides = [
  {
    slug: "how-to-create-a-roster",
    title: "How to Create a Roster in 5 Minutes",
    description: "Step-by-step guide to building your first weekly roster.",
    category: "Getting Started",
  },
  {
    slug: "shift-scheduling-best-practices",
    title: "Shift Scheduling Best Practices for Hospitality",
    description: "Tips for creating rosters that keep your team happy and your business running.",
    category: "Management",
  },
  {
    slug: "why-smeasy-vs-spreadsheets",
    title: "Why Smeasy Beats Spreadsheets",
    description: "See how modern roster management saves time and reduces mistakes.",
    category: "Comparison",
  },
  {
    slug: "managing-time-off-requests",
    title: "Managing Time Off Requests",
    description: "How to handle staff leave requests without the chaos.",
    category: "Management",
  },
  {
    slug: "exporting-to-payroll-software",
    title: "Export to Xero, MYOB & QuickBooks",
    description: "Get your roster data into your accounting software in one click.",
    category: "Integration",
  },
  {
    slug: "staff-shift-swaps",
    title: "How to Handle Shift Swaps",
    description: "Let your team trade shifts without overloading your inbox.",
    category: "Management",
  },
];

export default function GuidesPage() {
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

      {/* Header */}
      <section style={{ padding: "60px 20px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 700, color: C.dark, margin: "0 0 16px 0" }}>
          Roster Management Guides
        </h1>
        <p style={{ fontSize: 16, color: C.muted, margin: 0, lineHeight: 1.6 }}>
          Learn how to master roster creation, staff scheduling, and keep your team happy.
        </p>
      </section>

      {/* Guides Grid */}
      <section style={{ padding: "40px 20px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
          {guides.map((guide) => (
            <Link key={guide.slug} href={`/guides/${guide.slug}`} style={{ textDecoration: "none" }}>
              <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24, cursor: "pointer", transition: "all 0.2s", "&:hover": { borderColor: C.accent } }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.accent, textTransform: "uppercase" }}>{guide.category}</span>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: C.dark, margin: "12px 0 8px 0" }}>{guide.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>{guide.description}</p>
                <div style={{ marginTop: 16, color: C.accent, fontSize: 14, fontWeight: 600 }}>Read guide →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 20px", background: C.dark, textAlign: "center", marginTop: 60 }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: C.white, margin: "0 0 16px 0" }}>
            Ready to get started?
          </h2>
          <Link href="/auth/login" style={{ display: "inline-block", background: C.accent, color: C.dark, padding: "12px 32px", borderRadius: 8, textDecoration: "none", fontSize: 16, fontWeight: 700 }}>
            Create your first roster free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.white, borderTop: `1px solid ${C.border}`, padding: "40px 20px", color: C.muted, fontSize: 13, textAlign: "center" }}>
        <p style={{ margin: 0 }}>© 2025 Smeasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
