"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { MIN_PASSWORD } from "@/lib/auth";
import { C, btn, input, label } from "@/components/ui";

/** New-password form for the logged-in user. Used on /auth/reset and in Settings → Your login. */
export default function SetPassword({ cta = "Save password", onDone }: { cta?: string; onDone?: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (password.length < MIN_PASSWORD) { setMsg({ ok: false, text: `Use at least ${MIN_PASSWORD} characters.` }); return; }
    if (password !== confirm) { setMsg({ ok: false, text: "The two passwords don't match." }); return; }
    setBusy(true);
    const { error } = await supabase().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      const m = error.message.toLowerCase();
      setMsg({ ok: false, text: m.includes("different from the old") ? "That's your current password. Choose a new one." : m.includes("reauthentication") ? "For security, log out and back in with a login link, then try again." : error.message });
      return;
    }
    setPassword(""); setConfirm("");
    setMsg({ ok: true, text: "Password saved. Next time, log in with your email and this password." });
    onDone?.();
  }

  return (
    <form onSubmit={save} style={{ display: "grid", gap: 10, maxWidth: 360 }}>
      <div>
        <label style={label} htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD}
          value={password} onChange={(e) => setPassword(e.target.value)} style={input} />
      </div>
      <div>
        <label style={label} htmlFor="confirm-password">Type it again</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required
          value={confirm} onChange={(e) => setConfirm(e.target.value)} style={input} />
      </div>
      <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>At least {MIN_PASSWORD} characters. A short phrase is easy to remember and hard to guess.</p>
      {msg && <p role={msg.ok ? "status" : "alert"} style={{ fontSize: 13, margin: 0, color: msg.ok ? C.shiftText : C.danger }}>{msg.text}</p>}
      <button type="submit" disabled={busy} style={{ ...btn("primary"), justifySelf: "start", opacity: busy ? 0.6 : 1 }}>{busy ? "Saving…" : cta}</button>
    </form>
  );
}
