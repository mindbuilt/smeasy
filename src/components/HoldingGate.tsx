"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { C } from "@/lib/mkt";
import { HOLDING_PAGE, PREVIEW_PASSWORD_SHA256 } from "@/lib/site";
import { btn, input } from "@/components/ui";

const KEY = "smeasy-preview";
const PUBLIC_PATHS = ["/privacy"]; // linked from Xero and Stripe, so always visible

async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const subscribe = (cb: () => void) => { window.addEventListener("storage", cb); return () => window.removeEventListener("storage", cb); };

/** While HOLDING_PAGE is on, public pages show "coming soon" until a tester enters the preview password. */
export default function HoldingGate({ children }: { children: ReactNode }) {
  const path = usePathname() ?? "/";
  const stored = useSyncExternalStore(subscribe, () => localStorage.getItem(KEY) === PREVIEW_PASSWORD_SHA256, () => false);
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  // Unlock link for testers' phones: smeasy.au/?preview=<password> unlocks this browser, then tidies the URL.
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("preview");
    if (!param) return;
    sha256(param.trim()).then((h) => {
      if (h === PREVIEW_PASSWORD_SHA256) { localStorage.setItem(KEY, h); setUnlocked(true); }
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    });
  }, []);

  if (!HOLDING_PAGE || stored || unlocked || PUBLIC_PATHS.some((p) => path.startsWith(p))) return <>{children}</>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if ((await sha256(value.trim())) === PREVIEW_PASSWORD_SHA256) {
      localStorage.setItem(KEY, PREVIEW_PASSWORD_SHA256);
      setUnlocked(true);
    } else setWrong(true);
  }

  return (
    <div className="app" style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "32px 20px", background: C.bg }}>
      <div style={{ width: "100%", maxWidth: 420, textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: C.accent, display: "block", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)" }} />
          <span style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em", color: C.dark }}>SMEasy</span>
        </span>
        <h1 style={{ fontSize: "clamp(28px, 6vw, 36px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: C.dark, margin: "0 0 10px" }}>Coming soon</h1>
        <p style={{ fontSize: 17, color: C.secondary, lineHeight: 1.55, margin: "0 0 28px" }}>
          Simple staff rostering for Australian small businesses.
        </p>
        <form onSubmit={submit} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input type="password" value={value} onChange={(e) => { setValue(e.target.value); setWrong(false); }} placeholder="Preview password"
            aria-label="Preview password" autoComplete="off" style={{ ...input, flex: 1 }} />
          <button type="submit" disabled={!value.trim()} className="app-press" style={{ ...btn("primary"), opacity: value.trim() ? 1 : 0.5 }}>Enter</button>
        </form>
        {wrong && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: "0 0 10px" }}>That&apos;s not the preview password.</p>}
        <p style={{ fontSize: 14, color: C.muted, margin: "18px 0 0", lineHeight: 1.6 }}>
          Already testing SMEasy? <Link href="/auth/login/" style={{ color: C.dark, fontWeight: 650 }}>Log in</Link><br />
          <a href="mailto:hello@smeasy.au" style={{ color: C.secondary }}>hello@smeasy.au</a> · <Link href="/privacy/" style={{ color: C.secondary }}>Privacy</Link>
        </p>
      </div>
    </div>
  );
}
