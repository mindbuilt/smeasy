"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const API = "https://smeasy-production.up.railway.app";

const C = {
  bg: "#faf8f3",
  white: "#ffffff",
  dark: "#211f1a",
  accent: "#b7e021",
  border: "#e7e2d6",
  muted: "#8a8678",
  secondary: "#5b584f",
  danger: "#b3261e",
};

function InvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done">("loading");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    fetch(`${API}/invite/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setStatus("invalid"); return; }
        setBusinessName(data.businessName);
        setEmail(data.email);
        setStatus("valid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/staff-auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("smeasy_token", data.token);
        localStorage.setItem("smeasy_role", "staff");
        localStorage.setItem("smeasy_staff_name", data.name ?? "");
        setStatus("done");
        setTimeout(() => router.push("/rostering"), 1500);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Could not reach server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 28px", width: "100%", maxWidth: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 28, height: 28, background: C.accent, borderRadius: 5 }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>Smeasy</span>
        </div>

        {status === "loading" && (
          <p style={{ color: C.muted, fontSize: 14 }}>Checking your invite…</p>
        )}

        {status === "invalid" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 12 }}>Invalid invite</h1>
            <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>
              This invite link is invalid or has expired. Ask your manager to send a new one.
            </p>
          </>
        )}

        {status === "valid" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 6 }}>
              Set your password
            </h1>
            <p style={{ fontSize: 13, color: C.secondary, marginBottom: 20, marginTop: 0, lineHeight: 1.5 }}>
              You&apos;ve been invited to <strong>{businessName}</strong> on Smeasy. Set a password to access your roster.
            </p>
            <div style={{ marginBottom: 14, padding: "9px 12px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.muted }}>
              {email}
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.secondary, marginBottom: 5 }}>Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 14, color: C.dark, background: C.white, boxSizing: "border-box", outline: "none" }}
                />
              </div>
              {error && <p style={{ fontSize: 13, color: C.danger, marginBottom: 12 }}>{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                style={{ width: "100%", padding: "11px 0", background: C.dark, color: C.white, border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? "…" : "Set password & log in"}
              </button>
            </form>
          </>
        )}

        {status === "done" && (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, marginTop: 0, marginBottom: 12 }}>All set!</h1>
            <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.6 }}>
              Your account is ready. Taking you to your roster…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvitePageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#faf8f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#8a8678", fontSize: 14 }}>Loading…</p>
      </div>
    }>
      <InvitePage />
    </Suspense>
  );
}
