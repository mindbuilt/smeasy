"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { GTM_ID } from "@/lib/site";

const KEY = "smeasy_analytics"; // "yes" | "no"
const OPEN_EVENT = "smeasy:cookie-settings";

function loadGtm() {
  if (document.getElementById("gtm-script")) return;
  const w = window as unknown as { dataLayer: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const s = document.createElement("script");
  s.id = "gtm-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
}

/** Analytics (GTM) loads only after the visitor agrees. Public pages only. */
export default function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const choice = localStorage.getItem(KEY);
    if (choice === "yes") loadGtm();
    const open = () => setShow(true);
    window.addEventListener(OPEN_EVENT, open);
    if (!choice) queueMicrotask(open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  function choose(yes: boolean) {
    const was = localStorage.getItem(KEY);
    localStorage.setItem(KEY, yes ? "yes" : "no");
    setShow(false);
    if (yes) loadGtm();
    else if (was === "yes") window.location.reload(); // unload analytics already running
  }

  if (!show) return null;
  return (
    <div role="dialog" aria-label="Cookie preferences" style={{
      position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 80, maxWidth: 520, margin: "0 auto",
      background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "14px 16px",
      boxShadow: "0 10px 30px rgba(33,31,26,0.12)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap",
    }}>
      <p style={{ margin: 0, fontSize: 14, color: C.secondary, flex: 1, minWidth: 220, lineHeight: 1.45 }}>
        Can we use analytics cookies to see how people use this site? They&apos;re never used on rostering screens.
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => choose(false)} style={{ padding: "8px 14px", borderRadius: C.r1, border: `1px solid ${C.border}`, background: C.white, color: C.dark, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>No thanks</button>
        <button onClick={() => choose(true)} style={{ padding: "8px 14px", borderRadius: C.r1, border: "none", background: C.dark, color: C.white, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>OK</button>
      </div>
    </div>
  );
}

export function CookieSettingsLink({ style }: { style?: React.CSSProperties }) {
  return (
    <button onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textDecoration: "underline", font: "inherit", ...style }}>
      Cookie settings
    </button>
  );
}
