"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { useManager } from "@/lib/useManager";
import SetPassword from "@/components/SetPassword";
import { STATES, STATE_TIMEZONE, type State } from "@/lib/holidays";
import { roleSwatch } from "@/lib/roleColors";
import { AppShell, C, Loading, btn, input, label } from "@/components/ui";

const card = { background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: "18px 18px 20px", marginBottom: 16 } as const;
const h2 = { fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 4px" } as const;
const help = { fontSize: 13, color: C.secondary, margin: "0 0 12px", lineHeight: 1.5 } as const;

export default function SettingsPage() {
  const { business, setBusiness, email } = useManager();
  if (!business) return <AppShell><Loading /></AppShell>;

  async function update(patch: Database["public"]["Tables"]["businesses"]["Update"]) {
    const { data } = await supabase().from("businesses").update(patch).eq("id", business!.id).select().single();
    if (data) setBusiness(data);
  }

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: "0 0 20px" }}>Settings</h1>

        <section style={card}>
          <h2 style={h2}>Your business</h2>
          <p style={help}>Shown on your roster, the team link and the PDF.</p>
          <BusinessName key={business.name} name={business.name} onSave={(name) => update({ name })} />
          <label style={{ ...label, marginTop: 16 }} htmlFor="state">State or territory</label>
          <select id="state" style={{ ...input, maxWidth: 360 }} value={business.state ?? ""}
            onChange={(e) => {
              const state = (e.target.value || null) as State | null;
              update({ state, timezone: state ? STATE_TIMEZONE[state] : "Australia/Sydney" });
            }}>
            <option value="">Not set</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>Used to mark public holidays on your roster and set your time zone.</p>
        </section>

        <section style={card}>
          <RolesEditor key={business.roles.join("|")} roles={business.roles} onSave={(roles) => update({ roles })} />
        </section>

        <section id="login" style={card}>
          <h2 style={h2}>Your login</h2>
          <p style={help}>
            You&apos;re logged in as <strong>{email}</strong>. Set a password to log in with your email and password, without waiting for a login link. You can still use a link any time.
          </p>
          <SetPassword />
        </section>
      </div>
    </AppShell>
  );
}

function BusinessName({ name, onSave }: { name: string; onSave: (n: string) => Promise<void> }) {
  const [v, setV] = useState(name);
  const [saved, setSaved] = useState(false);
  const dirty = v.trim() !== name && v.trim().length > 0;
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (!dirty) return; await onSave(v.trim()); setSaved(true); }}>
      <label style={label} htmlFor="bname">Business name</label>
      <div style={{ display: "flex", gap: 8, maxWidth: 480 }}>
        <input id="bname" value={v} maxLength={80} onChange={(e) => { setV(e.target.value); setSaved(false); }} style={input} />
        {dirty && <button type="submit" style={{ ...btn("primary"), whiteSpace: "nowrap" }}>Save</button>}
      </div>
      {saved && <p role="status" style={{ fontSize: 12, color: C.shiftText, margin: "6px 0 0" }}>Saved ✓</p>}
    </form>
  );
}

function RolesEditor({ roles, onSave }: { roles: string[]; onSave: (r: string[]) => Promise<void> }) {
  const [list, setList] = useState(roles);
  const [next, setNext] = useState("");
  const dirty = list.join("|") !== roles.join("|");
  return (
    <>
      <h2 style={h2}>Shift roles</h2>
      <p style={help}>The jobs people can be rostered on. Each role gets its own colour on the roster, in this order.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {list.map((r) => {
          const sw = roleSwatch(r, list);
          return (
            <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: sw.bg, border: `1px solid ${sw.border}`, color: sw.text, fontSize: 13, fontWeight: 600 }}>
              {r}
              <button onClick={() => setList(list.filter((x) => x !== r))} aria-label={`Remove ${r}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: sw.text, padding: 0 }}>✕</button>
            </span>
          );
        })}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const v = next.trim(); if (v && !list.includes(v)) setList([...list, v]); setNext(""); }}
        style={{ display: "flex", gap: 8, maxWidth: 360 }}>
        <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Add a role, e.g. Delivery" style={input} aria-label="New role" />
        <button type="submit" style={btn()}>Add</button>
      </form>
      {dirty && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => onSave(list)} style={btn("primary")}>Save roles</button>
          <button onClick={() => setList(roles)} style={btn("ghost")}>Undo</button>
        </div>
      )}
    </>
  );
}
