"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { signOut, useManager } from "@/lib/useManager";
import { LogOut } from "lucide-react";
import SetPassword from "@/components/SetPassword";
import PlanCard from "@/components/PlanCard";
import XeroCard from "@/components/XeroCard";
import { hasPro, usePlan } from "@/lib/usePlan";
import { STATES, STATE_TIMEZONE, type State } from "@/lib/holidays";
import { AppShell, C, Loading, btn, haptic, input, label } from "@/components/ui";
import { WEEKDAYS, fmtWeek, thisWeekStart } from "@/lib/dates";

const card = { background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: "20px 20px 22px", marginBottom: 14 } as const;
const h2 = { fontSize: 18, fontWeight: 750, color: C.dark, margin: "0 0 4px" } as const;
const help = { fontSize: 15, color: C.secondary, margin: "0 0 14px", lineHeight: 1.5 } as const;

export default function SettingsPage() {
  const { business, setBusiness, email } = useManager();
  const plan = usePlan(business?.id);
  if (!business) return <AppShell><Loading /></AppShell>;

  async function update(patch: Database["public"]["Tables"]["businesses"]["Update"]) {
    const { data } = await supabase().from("businesses").update(patch).eq("id", business!.id).select().single();
    if (data) setBusiness(data);
  }

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 20px", letterSpacing: "-0.02em" }}>Settings</h1>

        <section style={card}>
          <h2 style={h2}>Your business</h2>
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
          <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>For public holidays and your time zone.</p>
          <WeekStart day={business.week_start_day} onChanged={(week_start_day) => setBusiness({ ...business, week_start_day })} />
        </section>

        <section id="plan" style={card}>
          <PlanCard businessId={business.id} />
        </section>

        <section id="payroll" style={card}>
          <XeroCard businessId={business.id} pro={hasPro(plan)} />
        </section>

        <section id="login" style={card}>
          <h2 style={h2}>Your login</h2>
          <p style={help}>You&apos;re logged in as <strong>{email}</strong>.</p>
          <SetPassword />
          <button type="button" onClick={signOut} className="app-press" style={{ ...btn(), marginTop: 16 }}>
            <LogOut size={17} /> Log out
          </button>
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

/** "Week starts on": changing it regroups existing shifts into the new weeks (server side). */
function WeekStart({ day, onChanged }: { day: number; onChanged: (day: number) => void }) {
  const [pending, setPending] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "warn" | "error" } | null>(null);
  const range = (d: number) => `${WEEKDAYS[d - 1]} to ${WEEKDAYS[(d + 5) % 7]}`;

  async function confirm() {
    if (pending === null) return;
    setSaving(true);
    const { data, error } = await supabase().rpc("set_week_start_day", { p_day: pending });
    setSaving(false);
    if (error) { setMsg({ text: "Couldn't change your week. Please try again.", tone: "error" }); return; }
    const redrafted = Number(data ?? 0);
    onChanged(pending);
    setPending(null);
    haptic(10);
    const ws = thisWeekStart(pending);
    setMsg(redrafted > 0
      ? { text: `Done. Your weeks now run ${range(pending)}. ${redrafted === 1 ? "1 week mixes" : `${redrafted} weeks mix`} published and draft shifts, so ${redrafted === 1 ? "it's" : "they're"} back to draft. Check ${redrafted === 1 ? "it" : "them"} and publish again.`, tone: "warn" }
      : { text: `Done. Your weeks now run ${range(pending)}. This week is ${fmtWeek(ws)}.`, tone: "ok" });
  }

  return (
    <>
      <label style={{ ...label, marginTop: 16 }} htmlFor="weekstart">Your week starts on</label>
      <select id="weekstart" style={{ ...input, maxWidth: 360 }} value={pending ?? day}
        onChange={(e) => { const d = Number(e.target.value); setMsg(null); setPending(d === day ? null : d); }}>
        {WEEKDAYS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
      </select>
      <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>Match your pay week.</p>
      {pending !== null && (
        <div role="status" style={{ marginTop: 12, background: "#fef3c7", color: "#92400e", borderRadius: 12, padding: "12px 14px", fontSize: 14, lineHeight: 1.5 }}>
          Your weeks will run <strong>{range(pending)}</strong>. Shifts you&apos;ve already rostered keep their dates and are regrouped into the new weeks. Any week that ends up mixing published and draft shifts goes back to draft for you to check. Staff links follow straight away.
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={confirm} disabled={saving} className="app-press" style={btn("primary")}>{saving ? "Changing…" : `Start weeks on ${WEEKDAYS[pending - 1]}`}</button>
            <button type="button" onClick={() => setPending(null)} className="app-press" style={btn("ghost")}>Cancel</button>
          </div>
        </div>
      )}
      {msg && (
        <p role="status" style={{ marginTop: 12, marginBottom: 0, borderRadius: 12, padding: "10px 12px", fontSize: 14, lineHeight: 1.5,
          background: msg.tone === "ok" ? C.shiftBg : msg.tone === "warn" ? "#fef3c7" : "#fff5f3",
          color: msg.tone === "ok" ? C.shiftText : msg.tone === "warn" ? "#92400e" : C.danger }}>{msg.text}</p>
      )}
    </>
  );
}
