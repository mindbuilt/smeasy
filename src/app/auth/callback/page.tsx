"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3", white: "#ffffff", dark: "#211f1a", accent: "#b7e021",
  border: "#e7e2d6", muted: "#8a8678", danger: "#b3261e",
  shiftBg: "#eaf9c8", shiftBorder: "#b7e021", shiftColor: "#3d5200",
};

function CallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setErrorMsg("No token provided."); return; }

    fetch(`${API}/auth/magic/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("smeasy_token", data.token);
          localStorage.setItem("smeasy_role", "manager");
          localStorage.setItem("smeasy_business_name", data.businessName || "My Business");
          setStatus("success");
          setTimeout(() => router.replace("/dashboard"), 800);
        } else {
          setStatus("error");
          setErrorMsg(data.error || "Link invalid or expired.");
        }
      })
      .catch(() => { setStatus("error"); setErrorMsg("Could not reach server."); });
  }, [searchParams, router]);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 5, margin: "0 auto 24px" }} />

        {status === "verifying" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 8 }}>Logging you in…</h1>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Verifying your magic link.</p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 8 }}>Logged in!</h1>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Taking you to your dashboard…</p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 8 }}>Link expired</h1>
            <p style={{ fontSize: 14, color: C.muted, marginBottom: 20 }}>{errorMsg}</p>
            <button onClick={() => router.replace("/auth/login")}
              style={{ padding: "10px 20px", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Request a new link
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#faf8f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#8a8678", fontSize: 14 }}>Loading…</p>
      </div>
    }>
      <CallbackPage />
    </Suspense>
  );
}
