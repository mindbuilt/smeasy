"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3", white: "#ffffff", dark: "#211f1a", accent: "#b7e021",
  border: "#e7e2d6", muted: "#8a8678", secondary: "#5b584f", danger: "#b3261e",
  shiftBg: "#eaf9c8", shiftBorder: "#b7e021", shiftColor: "#3d5200",
};

type Mode = "login" | "signup";
type Method = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [method, setMethod] = useState<Method>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);

  // Redirect if already logged in as manager
  useEffect(() => {
    if (typeof window === "undefined") return;
    const tk = localStorage.getItem("smeasy_token");
    const role = localStorage.getItem("smeasy_role");
    if (tk && role === "manager") router.replace("/dashboard");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (method === "magic") {
        const res = await fetch(`${API}/auth/magic`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (data.ok) { setMagicSent(true); }
        else { setError(data.error || "Failed to send link"); }
      } else {
        const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
        const body: Record<string, string> = { email, password };
        if (mode === "signup") body.businessName = businessName || "My Business";
        const res = await fetch(`${API}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("smeasy_token", data.token);
          localStorage.setItem("smeasy_role", "manager");
          localStorage.setItem("smeasy_business_name", data.businessName || "My Business");
          router.replace("/dashboard");
        } else {
          setError(data.error || "Authentication failed");
        }
      }
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "36px 32px", width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 5 }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>Smeasy</span>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 6 }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p style={{ fontSize: 13, color: C.muted, marginTop: 0, marginBottom: 24 }}>
          {mode === "login" ? "Log in to manage your roster." : "Get started with Smeasy Rostering."}
        </p>

        {/* Password / Magic toggle (login only) */}
        {mode === "login" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20, background: C.bg, borderRadius: 8, padding: 4 }}>
            {(["password", "magic"] as Method[]).map((m) => (
              <button key={m} onClick={() => { setMethod(m); setError(null); setMagicSent(false); }}
                style={{ flex: 1, padding: "6px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: method === m ? C.white : "transparent", color: method === m ? C.dark : C.muted, boxShadow: method === m ? `0 0 0 1px ${C.border}` : "none" }}>
                {m === "password" ? "Password" : "Magic link"}
              </button>
            ))}
          </div>
        )}

        {magicSent ? (
          <div style={{ background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 10, padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: C.shiftColor, marginBottom: 4 }}>Check your email</div>
            <div style={{ fontSize: 13, color: C.secondary }}>A login link was sent to <strong>{email}</strong>. It expires in 15 minutes.</div>
            <button onClick={() => { setMagicSent(false); setError(null); }}
              style={{ marginTop: 12, fontSize: 12, color: C.muted, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
              Try a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }} />
            </div>

            {(mode === "signup" || method === "password") && mode !== "login" || (mode === "login" && method === "password") ? (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required={method === "password"}
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }} />
              </div>
            ) : null}

            {mode === "signup" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Business name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Acme Cafe"
                  style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }} />
              </div>
            )}

            {error && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "11px 0", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1, marginBottom: 16 }}>
              {loading ? "…" : method === "magic" ? "Send magic link" : mode === "login" ? "Log in" : "Create account"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: C.muted, margin: 0 }}>
          {mode === "login" ? "No account yet? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setMagicSent(false); }}
            style={{ background: "none", border: "none", color: C.dark, fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 13 }}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
