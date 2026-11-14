"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { C, btn } from "@/components/ui";

// The magic link lands here. supabase-js reads the session from the URL
// on start-up; we then route to the roster, or to setup for new accounts.
export default function AuthCallback() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const sb = supabase();
    const linkError = new URLSearchParams(window.location.hash.slice(1)).has("error");

    async function route() {
      if (linkError) { setFailed(true); return true; }
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return false;
      const { data } = await sb.from("businesses").select("id").maybeSingle();
      router.replace(data ? "/week" : "/welcome");
      return true;
    }

    const { data: sub } = sb.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") route();
    });
    route();
    const timer = setTimeout(async () => { if (!(await route())) setFailed(true); }, 4000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, [router]);

  return (
    <div className="app" style={{ minHeight: "100dvh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        {failed ? (
          <>
            <p style={{ fontSize: 16, fontWeight: 600, color: C.dark }}>That link has expired or was already used.</p>
            <button onClick={() => router.replace("/auth/login")} style={{ ...btn("primary"), marginTop: 12 }}>Send a new link</button>
          </>
        ) : (
          <p style={{ fontSize: 15, color: C.secondary }}>Signing you in…</p>
        )}
      </div>
    </div>
  );
}
