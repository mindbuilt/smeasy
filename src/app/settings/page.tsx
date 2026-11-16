"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { useManager } from "@/lib/useManager";
import SetPassword from "@/components/SetPassword";
import PlanCard from "@/components/PlanCard";
import XeroCard from "@/components/XeroCard";
import { STATES, STATE_TIMEZONE, type State } from "@/lib/holidays";
import { roleSwatch } from "@/lib/roleColors";
import { payDetailsOn, withPayDetails } from "@/lib/pay";
import { AppShell, C, Loading, btn, haptic, input, label } from "@/components/ui";
import { WEEKDAYS, fmtWeek, thisWeekStart } from "@/lib/dates";

const card = { background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: "20px 20px 22px", marginBottom: 14 } as const;
const h2 = { fontSize: 18, fontWeight: 750, color: C.dark, margin: "0 0 4px" } as const;
const help = { fontSize: 15, color: C.secondary, margin: "0 0 14px", lineHeight: 1.5 } as const;

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
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 20px", letterSpacing: "-0.02em" }}>Settings</h1>

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
          <WeekStart day={business.week_start_day} onChanged={(week_start_day) => setBusiness({ ...business, week_start_day })} />
        </section>

        <section id="plan" style={card}>
          <PlanCard businessId={business.id} />
        </section>

        <section id="payroll" style={card}>
          <XeroCard businessId={business.id} />
        </section>

        <section style={card}>
          <RolesEditor key={business.roles.join("|")} roles={business.roles} onSave={(roles) => update({ roles })} />
        </section>

        <section id="pay" style={card}>
          <h2 style={h2}>Pay details <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>(optional)</span></h2>
          <p style={help}>
            Turn this on to add each person&apos;s hourly rate and payroll ID on the Team page. SMEasy then shows a base-rate wage estimate on the roster,
            and adds payroll ID, hourly rate and base pay to your hours CSV.
          </p>
          <Switch on={payDetailsOn(business)} label="Use pay details"
            onChange={(on) => update({ payroll_settings: withPayDetails(business, on) })} />
          <p style={{ fontSize: 12, color: C.muted, margin: "10px 0 0", lineHeight: 1.5 }}>
            The estimate is hours × the rate you enter. It doesn&apos;t include penalty rates, overtime, allowances or super, and it isn&apos;t award advice.
            Only you see pay details. They never appear on the team link, personal links or the PDF.
          </p>
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

function Switch({ on, label: text, onChange }: { on: boolean; label: string; onChange: (on: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => { haptic(6); onChange(!on); }} className="app-press"
      style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 16, fontWeight: 650, color: C.dark }}>
      <span aria-hidden style={{ width: 50, height: 30, borderRadius: 999, background: on ? C.accent : "#d1d5db", position: "relative", transition: "background-color 200ms ease", flex: "none" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: "50%", background: C.white, boxShadow: "0 1px 3px rgba(17,24,39,0.25)", transition: "left 220ms cubic-bezier(.16,1,.3,1)" }} />
      </span>
      {text}
    </button>
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
      <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>Match your pay week, so the hours export lines up with each pay run.</p>
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
