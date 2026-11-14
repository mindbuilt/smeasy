"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { STATES, STATE_TIMEZONE, type State } from "@/lib/holidays";
import Link from "next/link";
import { C, btn, input, label } from "@/components/ui";

const PRESETS: Record<string, string[]> = {
  "Café / restaurant": ["Floor", "Kitchen", "Barista", "Bar", "Manager"],
  "Retail": ["Sales floor", "Stockroom", "Checkout", "Manager"],
  "Other": ["Staff", "Supervisor", "Manager"],
};

export default function Welcome() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState("Café / restaurant");
  const [state, setState] = useState<State | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      const { data } = await sb.from("businesses").select("id").maybeSingle();
      if (data) router.replace("/week");
    })();
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error } = await supabase().from("businesses").insert({ name: name.trim(), roles: PRESETS[kind], state: state || null, timezone: state ? STATE_TIMEZONE[state] : "Australia/Sydney" });
    setSaving(false);
    if (error) setError("Couldn't save that. Please try again.");
    else router.replace("/team?new=1");
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <form onSubmit={save} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "32px 28px", width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.dark, margin: "0 0 6px" }}>Welcome to SMEasy</h1>
        <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 20px" }}>Three quick questions, then you can add your team.</p>

        <label style={label} htmlFor="name">Business name</label>
        <input id="name" required autoFocus value={name} onChange={(e) => setName(e.target.value)}
          style={input} placeholder="e.g. Corner Café" />

        <div style={{ ...label, marginTop: 18 }}>What kind of business?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Object.keys(PRESETS).map((k) => (
            <label key={k} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer",
              borderRadius: C.r2, border: `1.5px solid ${kind === k ? C.dark : C.border}`, fontSize: 14, color: C.dark,
            }}>
              <input type="radio" name="kind" checked={kind === k} onChange={() => setKind(k)} style={{ accentColor: C.dark }} />
              <span>{k}<span style={{ display: "block", fontSize: 12, color: C.muted }}>{PRESETS[k].join(" · ")}</span></span>
            </label>
          ))}
        </div>
        <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>These are your shift roles. You can change them any time.</p>

        <label style={{ ...label, marginTop: 18 }} htmlFor="state">State or territory</label>
        <select id="state" style={input} value={state} onChange={(e) => setState(e.target.value as State | "")}>
          <option value="">Choose…</option>
          {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>So we can mark your public holidays on the roster.</p>

        {error && <p style={{ color: C.danger, fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={saving || !name.trim()} style={{ ...btn("primary"), width: "100%", marginTop: 20, opacity: saving || !name.trim() ? 0.6 : 1 }}>
          {saving ? "Setting up…" : "Continue"}
        </button>
      </form>
      <footer style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 20px", textAlign: "center", fontSize: 12, color: C.muted }}>
        <Link href="/" style={{ color: C.secondary }}>SMEasy</Link>
        {" · "}
        <Link href="/guides/" style={{ color: C.secondary }}>Guides</Link>
        {" · "}
        <Link href="/faq/" style={{ color: C.secondary }}>FAQ</Link>
        {" · "}
        <Link href="/privacy/" style={{ color: C.secondary }}>Privacy</Link>
      </footer>
    </div>
  );
}
