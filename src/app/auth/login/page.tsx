"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { C, btn, input, label } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/week");
    });
  }, [router]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const { error } = await supabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback/` },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: "32px 28px", width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <span style={{ width: 24, height: 24, borderRadius: 5, background: C.accent, display: "block" }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>Smeasy</span>
        </div>

        {sent ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: "0 0 8px" }}>Check your email</h1>
            <p style={{ fontSize: 14, color: C.secondary, lineHeight: 1.5, margin: "0 0 20px" }}>
              We sent a login link to <strong>{email}</strong>. Open it on any device to sign in.
            </p>
            <button onClick={() => setSent(false)} style={btn("ghost")}>Use a different email</button>
          </>
        ) : (
          <form onSubmit={send}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: "0 0 6px" }}>Rostering, sorted.</h1>
            <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 20px" }}>
              Enter your email and we&apos;ll send you a link. No password needed — new here? This sets up your account too.
            </p>
            <label style={label} htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)} style={input}
              placeholder="you@yourbusiness.com.au" />
            {error && <p style={{ color: C.danger, fontSize: 13, margin: "10px 0 0" }}>{error}</p>}
            <button type="submit" disabled={sending} style={{ ...btn("primary"), width: "100%", marginTop: 16, opacity: sending ? 0.6 : 1 }}>
              {sending ? "Sending…" : "Email me a login link"}
            </button>
            <p style={{ fontSize: 12, color: C.muted, margin: "14px 0 0", lineHeight: 1.5 }}>
              By continuing you agree to how we handle data in our <a href="/privacy/" style={{ color: C.secondary }}>privacy policy</a>.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
