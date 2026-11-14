"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { C, btn } from "@/components/ui";
import SetPassword from "@/components/SetPassword";

// The "reset password" email link lands here. supabase-js reads the session
// from the URL; we then let the manager choose a new password.
export default function ResetPassword() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "failed">("checking");

  useEffect(() => {
    const sb = supabase();
    const linkError = new URLSearchParams(window.location.hash.slice(1)).has("error");
    let done = false;
    const check = async () => {
      if (done) return;
      if (linkError) { done = true; setState("failed"); return; }
      const { data } = await sb.auth.getSession();
      if (data.session) { done = true; setState("ready"); }
    };
    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") check();
    });
    check();
    const timer = setTimeout(() => { if (!done) { done = true; setState("failed"); } }, 5000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  async function goIn() {
    const { data } = await supabase().from("businesses").select("id").maybeSingle();
    router.replace(data ? "/week/" : "/welcome/");
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "32px 28px", width: "100%", maxWidth: 380 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, textDecoration: "none" }}>
          <span style={{ width: 24, height: 24, borderRadius: C.r1, background: C.accent, display: "block" }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>SMEasy</span>
        </Link>
        {state === "checking" && <p style={{ fontSize: 14, color: C.secondary, margin: 0 }}>Checking your link…</p>}
        {state === "failed" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>That link has expired</h1>
            <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 16px", lineHeight: 1.5 }}>Reset links work once and expire after an hour. Ask for a new one.</p>
            <button onClick={() => router.replace("/auth/login/")} style={btn("primary")}>Back to log in</button>
          </>
        )}
        {state === "ready" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Choose a new password</h1>
            <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 18px", lineHeight: 1.5 }}>You&apos;ll use this with your email to log in from now on.</p>
            <SetPassword cta="Save and continue" onDone={goIn} />
          </>
        )}
      </div>
    </div>
  );
}
