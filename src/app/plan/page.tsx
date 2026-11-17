"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { useManager } from "@/lib/useManager";
import { PLAN_NAMES, PRICES, PRO_AVAILABLE, type Interval, type PlanId } from "@/lib/site";
import { AppShell, C, Loading, btn, card } from "@/components/ui";

type Billing = Database["public"]["Tables"]["billing"]["Row"];
type PaidPlan = "core" | "pro";

// What each plan includes. Keep in step with the features gated in src/lib/usePlan.ts.
const PLANS: { id: PlanId; tagline: string; features: string[] }[] = [
  { id: "free", tagline: "For a small team of up to 6 people.", features: [
    "Up to 6 staff",
    "Build, copy and publish the roster",
    "Team link and personal links for staff",
    "Time-off requests and roster emails",
    "Hours CSV for payroll",
  ] },
  { id: "core", tagline: "Unlimited staff, one flat price.", features: [
    "Unlimited staff",
    "Everything in Free",
    "Timesheets: confirm and approve each week's hours",
    "Usual-hours notes on the roster",
  ] },
  { id: "pro", tagline: "Plus, with payroll sync.", features: [
    "Everything in Plus",
    "Send approved hours to Xero as draft timesheets",
    "Match your staff to Xero employees once",
  ] },
];

const fmt = (iso: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

export default function PlanPage() {
  const { business, email } = useManager();
  const [billing, setBilling] = useState<Billing | null | undefined>(undefined);
  const [interval, setInterval] = useState<Interval>("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    const load = () => supabase().from("billing").select("*").eq("business_id", business.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setBilling(data ?? null); return data; });
    load();
    const r = new URLSearchParams(window.location.search).get("billing");
    if (r === "cancelled") setNotice("No changes made.");
    if (r === "success") {
      setNotice("Thanks. Your plan updates in a moment.");
      setTimeout(load, 2500); // Stripe tells us through the webhook, which can take a few seconds
    }
    if (r) window.history.replaceState(null, "", window.location.pathname);
    return () => { cancelled = true; };
  }, [business]);

  if (!business || billing === undefined) return <AppShell businessName={business?.name} email={email}><Loading /></AppShell>;

  const plan = (billing?.plan ?? "free") as PlanId;
  const paid = plan !== "free";
  const hasCustomer = !!billing?.stripe_customer_id;
  // A paid plan with no Stripe customer was set up by hand: changes go through us.
  const handSet = paid && !hasCustomer;

  async function go(action: "checkout" | "portal", target?: PaidPlan) {
    setBusy(`${action}${target ?? ""}`); setError(null);
    const { data, error: err } = await supabase().functions.invoke("billing", { body: { action, plan: target ?? "core", interval } });
    if (err || !data?.url) {
      let msg = "Couldn't open billing. Please try again.";
      try { const body = await (err as { context?: Response })?.context?.json(); if (body?.error) msg = body.error; } catch { /* keep default */ }
      setError(msg); setBusy(null);
      return;
    }
    window.location.href = data.url;
  }

  // Taking a plan: a free business checks out; a paid one changes plan in Stripe's portal, which applies the change.
  const choose = (target: PaidPlan) => (paid ? go("portal", target) : go("checkout", target));

  function action(id: PlanId): React.ReactNode {
    if (id === plan && (id === "free" || billing?.billing_interval === interval || !paid)) return <span style={{ fontSize: 14, fontWeight: 700, color: C.secondary }}>Your plan</span>;
    if (id === "free") {
      if (!paid) return null;
      if (handSet) return null;
      return <button type="button" onClick={() => go("portal")} disabled={!!busy} className="app-press" style={btn()}>{busy ? "Opening…" : "Move to Free"}</button>;
    }
    if (id === "pro" && !PRO_AVAILABLE) return <span style={{ fontSize: 14, color: C.muted }}>Coming soon</span>;
    if (handSet) return null;
    const name = PLAN_NAMES[id];
    const verb = paid ? "Switch to" : "Choose";
    return (
      <button type="button" onClick={() => choose(id as PaidPlan)} disabled={!!busy} className="app-press" style={{ ...btn(id === "core" ? "accent" : "secondary"), opacity: busy ? 0.6 : 1 }}>
        {busy ? "Opening Stripe…" : `${verb} ${name}`}
      </button>
    );
  }

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Plans</h1>
        <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 18px", lineHeight: 1.5 }}>
          You&apos;re on <strong style={{ color: C.dark }}>{PLAN_NAMES[plan]}</strong>
          {paid && billing?.current_period_end && (billing.cancel_at_period_end
            ? <>. It ends on {fmt(billing.current_period_end)}.</>
            : <>. Renews on {fmt(billing.current_period_end)}.</>)}
          {!paid && "."}
        </p>

        {notice && <p role="status" style={{ fontSize: 15, background: C.shiftBg, color: C.shiftText, borderRadius: 12, padding: "10px 12px", margin: "0 0 14px" }}>{notice}</p>}
        {billing?.status === "past_due" && (
          <p style={{ fontSize: 15, background: "#fff5f3", color: "#9b2c25", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px" }}>
            Your last payment didn&apos;t go through. Update your card under payment details to keep your plan.
          </p>
        )}
        {handSet && (
          <p style={{ fontSize: 15, color: C.secondary, background: "#f3f4f6", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px", lineHeight: 1.5 }}>
            This plan was set up for you. To change it, email <a href="mailto:hello@smeasy.au" style={{ color: C.dark, fontWeight: 650 }}>hello@smeasy.au</a>.
          </p>
        )}

        <div role="radiogroup" aria-label="Billing" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2, marginBottom: 16 }}>
          {(["month", "year"] as Interval[]).map((i) => (
            <button key={i} type="button" role="radio" aria-checked={interval === i} onClick={() => setInterval(i)} className="app-press" style={{
              border: "none", borderRadius: 999, padding: "7px 14px", minHeight: 36, fontSize: 14, fontWeight: 650, fontFamily: "inherit", cursor: "pointer",
              background: interval === i ? C.dark : "transparent", color: interval === i ? C.white : C.secondary,
            }}>{i === "month" ? "Monthly" : "Annual · 2 months free"}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
          {PLANS.map((p) => {
            const current = p.id === plan;
            const price = p.id === "free" ? null : PRICES[p.id][interval];
            return (
              <section key={p.id} aria-label={PLAN_NAMES[p.id]} style={{ ...card, padding: "20px 18px", display: "flex", flexDirection: "column", gap: 12, outline: current ? `2px solid ${C.accent}` : "none" }}>
                <div>
                  <h2 style={{ fontSize: 19, fontWeight: 800, color: C.dark, margin: "0 0 4px" }}>{PLAN_NAMES[p.id]}</h2>
                  <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5 }}>{p.tagline}</p>
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: 0, letterSpacing: "-0.02em" }}>
                  {price === null ? "Free" : `$${price}`}
                  {price !== null && <span style={{ fontSize: 14, fontWeight: 600, color: C.muted }}> {interval === "month" ? "a month" : "a year"} + GST</span>}
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: C.secondary, lineHeight: 1.6, display: "grid", gap: 4 }}>
                  {p.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div style={{ marginTop: "auto", paddingTop: 6 }}>{action(p.id)}</div>
              </section>
            );
          })}
        </div>

        {error && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: "14px 0 0" }}>{error}</p>}

        {hasCustomer && (
          <p style={{ fontSize: 13, color: C.muted, margin: "18px 0 0", lineHeight: 1.5 }}>
            <button type="button" onClick={() => go("portal")} disabled={!!busy} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.secondary, textDecoration: "underline", cursor: "pointer" }}>
              Payment details and invoices
            </button>{" "}
            are handled securely by Stripe. Cancel any time, and changes apply from your next bill.
          </p>
        )}
        <p style={{ fontSize: 13, color: C.muted, margin: "10px 0 0" }}>Prices are in Australian dollars plus GST, per business, with no per-person fees. <Link href="/pricing/" style={{ color: C.secondary }}>Compare plans</Link></p>
      </div>
    </AppShell>
  );
}
