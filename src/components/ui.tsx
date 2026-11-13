"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, ReactNode, useState } from "react";
import { signOut } from "@/lib/useManager";

export const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  divider: "#f0ede4",
  muted: "#8a8678",
  secondary: "#5b584f",
  faint: "#c2bcaa",
  shiftBg: "#eaf9c8",
  shiftBorder: "#b7e021",
  shiftText: "#3d5200",
  offBg: "#fdf1e0",
  offBorder: "#d98c1f",
  offText: "#8a5a10",
  danger: "#b3261e",
};

export const input: CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 15,
  border: `1px solid ${C.border}`, borderRadius: 8, background: C.white,
  color: C.dark, fontFamily: "inherit", outline: "none",
};

export const label: CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600, color: C.secondary, marginBottom: 5,
};

export function btn(kind: "primary" | "secondary" | "ghost" | "danger" = "secondary"): CSSProperties {
  const base: CSSProperties = {
    padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent",
  };
  if (kind === "primary") return { ...base, background: C.dark, color: C.white };
  if (kind === "danger") return { ...base, background: "transparent", color: C.danger, borderColor: C.border };
  if (kind === "ghost") return { ...base, background: "transparent", color: C.secondary };
  return { ...base, background: C.white, color: C.dark, borderColor: C.border };
}

const NAV = [
  { href: "/week", label: "This week" },
  { href: "/team", label: "Team" },
];

export function AppShell({ businessName, email, children }: {
  businessName?: string; email?: string; children: ReactNode;
}) {
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 40, background: C.white,
        borderBottom: `1px solid ${C.border}`, height: 56, display: "flex",
        alignItems: "center", gap: 16, padding: "0 16px",
      }}>
        <Link href="/week" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ width: 22, height: 22, borderRadius: 5, background: C.accent, display: "block" }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>Smeasy</span>
        </Link>
        <nav style={{ display: "flex", gap: 4 }}>
          {NAV.map((n) => {
            const active = path?.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} style={{
                padding: "6px 12px", borderRadius: 7, fontSize: 14, fontWeight: 600,
                textDecoration: "none", color: active ? C.white : C.secondary,
                background: active ? C.dark : "transparent",
              }}>{n.label}</Link>
            );
          })}
        </nav>
        <div style={{ marginLeft: "auto", position: "relative" }}>
          <button onClick={() => setMenu((m) => !m)} style={{ ...btn("ghost"), padding: "6px 10px" }}>
            {businessName ?? "Account"} ▾
          </button>
          {menu && (
            <div style={{
              position: "absolute", right: 0, top: 40, background: C.white, minWidth: 220,
              border: `1px solid ${C.border}`, borderRadius: 10, padding: 8,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}>
              {email && <div style={{ fontSize: 12, color: C.muted, padding: "6px 8px" }}>{email}</div>}
              <button onClick={signOut} style={{ ...btn("ghost"), width: "100%", textAlign: "left" }}>Log out</button>
            </div>
          )}
        </div>
      </header>
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>{children}</main>
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(33,31,26,0.35)", zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 12,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: C.white, width: "100%", maxWidth: 440, borderRadius: 16,
        padding: 20, margin: "0 auto", maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: C.dark, margin: 0 }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{ ...btn("ghost"), marginLeft: "auto", padding: "4px 8px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Loading() {
  return <p style={{ color: C.muted, fontSize: 14, padding: 24 }}>Loading…</p>;
}
