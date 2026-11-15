"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { C, btn, input, label } from "@/components/ui";
import { MIN_PASSWORD } from "@/lib/auth";
import { SIGNUPS_OPEN, SIGNUP_HREF } from "@/lib/site";

type Mode = "login" | "signup" | "forgot";
type Sent = { kind: "link" | "confirm" | "reset"; email: string } | null;

/** Turns Supabase auth errors into plain English. */
function friendly(message: string, mode: Mode) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "That email and password don't match. Check them, or use “Forgot password?” or “Email me a login link” below. If you've only ever logged in with a link, you won't have a password yet.";
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox for the email from SMEasy.";
  if (m.includes("already registered")) return "There's already an account with that email. Log in instead, or use “Forgot password?”.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Too many attempts. Please wait a minute and try again.";
  if (m.includes("signups not allowed") || m.includes("signup is disabled"))
    return "There's no SMEasy account for that email. We're not open to new sign-ups yet.";
  if (m.includes("password") && mode === "signup") return `Choose a password of at least ${MIN_PASSWORD} characters.`;
  return message;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<Sent>(null);
  const [error, setError] = useState<string | null>(null);
  // Don't show the login form until we know they aren't already logged in.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase().auth.getSession().then(({ data }) => {
      if (data.session) { router.replace("/week/"); return; }
      if (SIGNUPS_OPEN && new URLSearchParams(window.location.search).has("signup")) setMode("signup");
      setChecking(false);
    });
  }, [router]);

  const callback = () => `${window.location.origin}/auth/callback/`;

  async function goIn() {
    const { data } = await supabase().from("businesses").select("id").maybeSingle();
    router.replace(data ? "/week/" : "/welcome/");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const sb = supabase().auth;
    const addr = email.trim();
    try {
      if (mode === "login") {
        const { error } = await sb.signInWithPassword({ email: addr, password });
        if (error) throw error;
        await goIn();
        return;
      }
      if (mode === "signup") {
        if (password.length < MIN_PASSWORD) throw new Error(`Choose a password of at least ${MIN_PASSWORD} characters.`);
        const { data, error } = await sb.signUp({ email: addr, password, options: { emailRedirectTo: callback() } });
        if (error) throw error;
        if (data.session) { await goIn(); return; }
        setSent({ kind: "confirm", email: addr });
      }
      if (mode === "forgot") {
        const { error } = await sb.resetPasswordForEmail(addr, { redirectTo: `${window.location.origin}/auth/reset/` });
        if (error) throw error;
        setSent({ kind: "reset", email: addr });
      }
    } catch (err) {
      setError(friendly((err as Error).message, mode));
    } finally {
      setBusy(false);
    }
  }

  async function emailLink() {
    setError(null);
    if (!email.trim()) { setError("Enter your email first."); return; }
    setBusy(true);
    const { error } = await supabase().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback(), shouldCreateUser: SIGNUPS_OPEN } });
    setBusy(false);
    if (error) setError(friendly(error.message, mode));
    else setSent({ kind: "link", email: email.trim() });
  }

  function switchTo(m: Mode) {
    setMode(m);
    setError(null);
    setPassword("");
  }

  const heading = { fontSize: 20, fontWeight: 700, color: C.dark, margin: "0 0 6px" } as const;
  const sub = { fontSize: 14, color: C.secondary, margin: "0 0 20px", lineHeight: 1.5 } as const;
  const linkBtn = { background: "none", border: 0, padding: 0, color: C.dark, textDecoration: "underline", cursor: "pointer", fontSize: 13, fontFamily: "inherit" } as const;

  return (
    <>
    {/* Desktop only: a quiet café at opening time fills the left half */}
    <div className="login-photo" aria-hidden>
      <img src="/login.jpg" alt="" width={1100} height={1473} />
    </div>
    <div className="app login-main" style={{ minHeight: "100dvh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px 0" }}>
      <div style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: "32px 28px", width: "100%", maxWidth: 380, margin: "auto 0" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, textDecoration: "none" }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, background: C.accent, display: "block", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.08)" }} />
          <span style={{ fontWeight: 700, fontSize: 17, color: C.dark }}>SMEasy</span>
        </Link>

        {checking ? (
          <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>Checking if you&apos;re already logged in…</p>
        ) : sent ? (
          <>
            <h1 style={heading}>Check your email</h1>
            <p style={sub}>
              {sent.kind === "link" && <>We sent a login link to <strong>{sent.email}</strong>. Open it on any device to log in.</>}
              {sent.kind === "confirm" && <>We sent an email to <strong>{sent.email}</strong>. Tap the link in it to confirm your address and log in.</>}
              {sent.kind === "reset" && <>If there&apos;s an account for <strong>{sent.email}</strong>, we&apos;ve sent a link to set a new password.</>}
            </p>
            <button onClick={() => { setSent(null); switchTo("login"); }} style={btn("ghost")}>Back to log in</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <h1 style={heading}>
              {mode === "login" ? "Log in to SMEasy" : mode === "signup" ? "Create your account" : "Reset your password"}
            </h1>
            <p style={sub}>
              {mode === "login" && "Welcome back. Rostering, sorted."}
              {mode === "signup" && "Free during early access. You'll be building your first roster in about five minutes."}
              {mode === "forgot" && "Enter your email and we'll send you a link to set a new password."}
            </p>

            <label style={label} htmlFor="email">Email</label>
            <input id="email" type="email" required autoComplete="email" autoFocus
              value={email} onChange={(e) => setEmail(e.target.value)} style={input}
              placeholder="you@yourbusiness.com.au" />

            {mode !== "forgot" && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: 14 }}>
                  <label style={label} htmlFor="password">Password</label>
                  {mode === "login" && (
                    <button type="button" onClick={() => switchTo("forgot")} style={{ ...linkBtn, marginLeft: "auto", fontSize: 12, color: C.secondary }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input id="password" type="password" required minLength={mode === "signup" ? MIN_PASSWORD : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} style={input} />
                {mode === "signup" && <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>At least {MIN_PASSWORD} characters.</p>}
              </>
            )}

            {error && <p role="alert" style={{ color: C.danger, fontSize: 13, margin: "12px 0 0", lineHeight: 1.45 }}>{error}</p>}

            <button type="submit" disabled={busy} style={{ ...btn("primary"), width: "100%", marginTop: 16, opacity: busy ? 0.6 : 1 }}>
              {busy ? "One moment…" : mode === "login" ? "Log in" : mode === "signup" ? "Create account" : "Send reset link"}
            </button>

            {mode !== "forgot" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: C.muted, fontSize: 12 }}>
                  <span style={{ flex: 1, height: 1, background: C.border }} />or<span style={{ flex: 1, height: 1, background: C.border }} />
                </div>
                <button type="button" onClick={emailLink} disabled={busy} style={{ ...btn("secondary"), width: "100%" }}>
                  Email me a login link instead
                </button>
                <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0", textAlign: "center" }}>
                  {SIGNUPS_OPEN ? "No password needed. Works for new and existing accounts." : "No password needed."}
                </p>
              </>
            )}

            <p style={{ fontSize: 13, color: C.secondary, margin: "20px 0 0", textAlign: "center" }}>
              {mode === "login" && (SIGNUPS_OPEN
                ? <>New to SMEasy? <button type="button" onClick={() => switchTo("signup")} style={linkBtn}>Create an account</button></>
                : <>New to SMEasy? We&apos;re opening soon. <Link href={SIGNUP_HREF} style={{ color: C.dark }}>Get early access</Link></>)}
              {mode === "signup" && <>Already have an account? <button type="button" onClick={() => switchTo("login")} style={linkBtn}>Log in</button></>}
              {mode === "forgot" && <button type="button" onClick={() => switchTo("login")} style={linkBtn}>Back to log in</button>}
            </p>

            {mode === "signup" && (
              <p style={{ fontSize: 12, color: C.muted, margin: "14px 0 0", lineHeight: 1.5 }}>
                By continuing you agree to how we handle data in our <a href="/privacy/" style={{ color: C.secondary }}>privacy policy</a>.
              </p>
            )}
          </form>
        )}
      </div>
      <footer style={{ padding: "24px 20px 16px", textAlign: "center", fontSize: 13, color: C.muted }}>
        <Link href="/" style={{ color: C.secondary }}>Home</Link>
        {" · "}
        <Link href="/guides/" style={{ color: C.secondary }}>Guides</Link>
        {" · "}
        <Link href="/faq/" style={{ color: C.secondary }}>FAQ</Link>
        {" · "}
        <Link href="/privacy/" style={{ color: C.secondary }}>Privacy</Link>
      </footer>
    </div>
    </>
  );
}
