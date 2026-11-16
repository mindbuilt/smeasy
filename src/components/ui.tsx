"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Clock, Settings, Users, X } from "lucide-react";
import { APP } from "@/lib/theme";

// App screens use the app palette under the familiar name.
export const C = APP;

export const input: CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 16,
  border: `1px solid ${C.border}`, borderRadius: C.r1, background: C.white,
  color: C.dark, fontFamily: "inherit", minHeight: 46, transition: "border-color 150ms ease, box-shadow 150ms ease",
};

export const label: CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 6,
};

export const card: CSSProperties = {
  background: C.white, borderRadius: C.r2, boxShadow: C.shadow,
};

type BtnKind = "primary" | "secondary" | "ghost" | "danger" | "accent";

export function btn(kind: BtnKind = "secondary"): CSSProperties {
  const base: CSSProperties = {
    padding: "10px 16px", borderRadius: C.r1, fontSize: 15, fontWeight: 600, minHeight: 42,
    cursor: "pointer", fontFamily: "inherit", border: "1px solid transparent",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    transition: "transform 120ms cubic-bezier(.2,.8,.2,1), background-color 150ms ease, box-shadow 150ms ease",
  };
  if (kind === "primary") return { ...base, background: C.dark, color: C.white };
  if (kind === "accent") return { ...base, background: C.accent, color: C.dark, boxShadow: "0 2px 6px rgba(101,163,13,0.25)" };
  if (kind === "danger") return { ...base, background: C.white, color: C.danger, borderColor: C.border };
  if (kind === "ghost") return { ...base, background: "transparent", color: C.secondary };
  return { ...base, background: C.white, color: C.dark, borderColor: C.border };
}

/**
 * Small haptic tick. Android: the Vibration API. iPhone (iOS 18+ Safari): toggling a
 * native switch input gives a system haptic, so we flip a hidden one. Elsewhere, nothing.
 */
let iosSwitch: HTMLLabelElement | null = null;
export function haptic(pattern: number | number[] = 8) {
  if (typeof window === "undefined") return;
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    try { if (navigator.vibrate(pattern)) return; } catch { /* not allowed */ }
  }
  if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return;
  try {
    if (!iosSwitch) {
      iosSwitch = document.createElement("label");
      iosSwitch.setAttribute("aria-hidden", "true");
      iosSwitch.style.cssText = "position:fixed;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;left:-9px;top:0";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.setAttribute("switch", "");
      box.tabIndex = -1;
      iosSwitch.appendChild(box);
      document.body.appendChild(iosSwitch);
    }
    iosSwitch.click();
  } catch { /* no haptics */ }
}

export function Avatar({ name, size = 36, tone }: { name: string; size?: number; tone?: { bg: string; text: string } }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
  return (
    <span aria-hidden style={{
      width: size, height: size, borderRadius: "50%", flex: "none", display: "inline-grid", placeItems: "center",
      background: tone?.bg ?? "#eef0f3", color: tone?.text ?? C.secondary, fontSize: Math.round(size * 0.36), fontWeight: 700,
      letterSpacing: "0.01em",
    }}>{initials}</span>
  );
}

const NAV = [
  { href: "/week", label: "Roster", Icon: CalendarDays },
  { href: "/team", label: "Team", Icon: Users },
  { href: "/hours", label: "Hours", Icon: Clock },
];

function Logo() {
  return (
    <Link href="/week" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
      <span style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "block", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)" }} />
      <span style={{ fontWeight: 800, fontSize: 17, color: C.dark, letterSpacing: "-0.01em" }}>SMEasy</span>
    </Link>
  );
}

/** The business you're in, as plain text. Your login and Log out live in Settings → Your login. */
function BusinessName({ businessName }: { businessName?: string }) {
  if (!businessName) return null;
  return (
    <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 650, color: C.secondary, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {businessName}
    </span>
  );
}

export function AppShell({ businessName, children }: {
  businessName?: string; email?: string; children: ReactNode;
}) {
  const path = usePathname();
  const isActive = (href: string) => path?.startsWith(href);
  return (
    <div className="app" style={{ minHeight: "100dvh", background: C.bg }}>
      <header style={{
        position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.92)", backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)", borderBottom: `1px solid ${C.border}`,
        paddingTop: "env(safe-area-inset-top)",
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", height: 60, display: "flex", alignItems: "center", gap: 20, padding: "0 16px" }}>
          <Logo />
          <nav className="app-topnav" aria-label="Main" style={{ gap: 4 }}>
            {NAV.map(({ href, label, Icon }) => (
              <Link key={href} href={href} aria-current={isActive(href) ? "page" : undefined} className="app-press" style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 12px", borderRadius: 10, fontSize: 15, fontWeight: 600,
                textDecoration: "none", color: isActive(href) ? C.dark : C.muted, background: isActive(href) ? "#eef0f3" : "transparent",
              }}><Icon size={18} strokeWidth={isActive(href) ? 2.4 : 2} />{label}</Link>
            ))}
          </nav>
          <BusinessName businessName={businessName} />
          {/* Settings is occasional, so it's an icon up here rather than a main tab. */}
          <Link href="/settings" aria-label="Settings" title="Settings" aria-current={isActive("/settings") ? "page" : undefined} className="app-press" style={{
            display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 999, flex: "none", textDecoration: "none",
            color: isActive("/settings") ? C.dark : C.secondary, background: isActive("/settings") ? "#eef0f3" : "transparent",
          }}><Settings size={20} strokeWidth={isActive("/settings") ? 2.4 : 2} /></Link>
        </div>
      </header>

      <main key={path} className="app-main route-in" style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 16px 64px" }}>{children}</main>

      <nav className="app-tabbar" aria-label="Main" style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 45, background: "rgba(255,255,255,0.96)",
        backdropFilter: "saturate(180%) blur(12px)", WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderTop: `1px solid ${C.border}`, padding: "8px 8px calc(8px + env(safe-area-inset-bottom))", justifyContent: "space-around",
      }}>
        {NAV.map(({ href, label, Icon }) => {
          const on = isActive(href);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined} onClick={() => haptic(6)} className="app-press" style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 0",
              textDecoration: "none", fontSize: 12, fontWeight: 700, color: on ? C.dark : C.muted,
            }}>
              <span style={{ display: "grid", placeItems: "center", width: 56, height: 30, borderRadius: 999, background: on ? C.accent : "transparent", transition: "background-color 200ms ease" }}>
                <Icon size={21} strokeWidth={on ? 2.4 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      <footer className="app-topnav" style={{ justifyContent: "center", gap: 14, padding: "8px 20px 28px", fontSize: 13, color: C.muted }}>
        <Link href="/" style={{ color: C.muted }}>smeasy.au</Link>
        <Link href="/guides/" style={{ color: C.muted }}>Guides</Link>
        <Link href="/faq/" style={{ color: C.muted }}>FAQ</Link>
        <Link href="/contact/" style={{ color: C.muted }}>Help</Link>
        <Link href="/privacy/" style={{ color: C.muted }}>Privacy</Link>
      </footer>
    </div>
  );
}

/** Dialog on desktop, bottom sheet on phones. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onClose(); return; }
    setClosing(true);
    setTimeout(onClose, 220);
  };
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div onClick={close} className={`sheet-scrim app${closing ? " is-closing" : ""}`} style={{
      position: "fixed", inset: 0, background: "rgba(17,24,39,0.38)", zIndex: 60,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className={`sheet${closing ? " is-closing" : ""}`} style={{
        background: C.white, width: "100%", maxWidth: 460, borderRadius: 20, boxShadow: C.shadowLift,
        padding: "8px 20px 20px", maxHeight: "92dvh", overflowY: "auto",
      }}>
        <div aria-hidden style={{ width: 40, height: 4, borderRadius: 4, background: C.border, margin: "4px auto 8px" }} />
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ fontSize: 19, fontWeight: 750, color: C.dark, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
          <button onClick={close} aria-label="Close" className="app-press" style={{ ...btn("ghost"), marginLeft: "auto", width: 40, minHeight: 40, padding: 0, borderRadius: 999, background: "#f3f4f6" }}>
            <X size={18} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" style={{ display: "grid", gap: 10, paddingTop: 8 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton" style={{ ...card, height: i ? 72 : 44, opacity: 1 - i * 0.25 }} />
      ))}
    </div>
  );
}
