"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { useManager } from "@/lib/useManager";
import { BETA_PAID_FROM, OPEN_BETA, PLAN_NAMES, PRICES, PRO_AVAILABLE, type Interval, type PlanId } from "@/lib/site";
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
      .then(({ data }) => { if (!cancelled) setBilling(data ?? null); });
    load();
    // Back from Stripe: say what happened. Stripe tells us the new plan through the webhook, which can take a few seconds.
    const r = new URLSearchParams(window.location.search).get("billing");
    if (r) window.history.replaceState(null, "", window.location.pathname);
    supabase().auth.getSession().then(() => {
      if (cancelled) return;
      if (r === "cancelled") setNotice("No changes made.");
      if (r === "success") { setNotice("Thanks. Your plan updates in a moment."); setTimeout(load, 2500); }
    });
    return () => { cancelled = true; };
  }, [business]);

  if (!business || billing === undefined) return <AppShell businessName={business?.name} email={email}><Loading /></AppShell>;

  // Open beta: nothing to choose or pay for yet.
  if (OPEN_BETA) return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <Link href="/settings/" className="app-press" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 15, fontWeight: 600, color: C.secondary, textDecoration: "none", margin: "0 0 10px -4px", padding: "4px 4px" }}>
          <ChevronLeft size={18} aria-hidden /> Settings
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Plans</h1>
        <section style={{ ...card, padding: "20px 18px" }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: C.dark, margin: "0 0 6px" }}>Open beta: everything included</p>
          <p style={{ fontSize: 15, color: C.secondary, margin: 0, lineHeight: 1.55 }}>
            Unlimited staff, timesheets and Xero sync, all free while SMEasy is in open beta. Paid plans won&apos;t start before {BETA_PAID_FROM}.
            Before any billing starts you&apos;ll get at least 30 days&apos; notice, and beta businesses get a founder discount.
          </p>
        </section>
        <p style={{ fontSize: 13, color: C.muted, margin: "12px 0 0" }}><Link href="/pricing/" style={{ color: C.secondary }}>Planned pricing</Link></p>
      </div>
    </AppShell>
  );

  const plan = (billing?.plan ?? "free") as PlanId;
  const paid = plan !== "free";
  // Billed through Stripe: plan changes happen in Stripe's portal.
  const subscribed = paid && !!billing?.stripe_subscription_id;
  // A paid plan with no subscription was set up by hand (no card, nothing billed). Choosing a plan starts a normal checkout.
  const handSet = paid && !subscribed;

  async function moveToFree() {
    setBusy("free"); setError(null);
    const { data, error: err } = await supabase().functions.invoke("billing", { body: { action: "free" } });
    if (err || !data?.ok) { setError("Couldn't change your plan. Please try again."); setBusy(null); return; }
    window.location.reload();
  }

  async function go(action: "checkout" | "portal", target?: PaidPlan) {
    setBusy(`${action}${target ?? ""}`); setError(null);
    const { data, error: err } = await supabase().functions.invoke("billing", { body: { action, plan: target ?? "core", interval } });
    if (err || !data?.url) {
      let msg = "Couldn't open billing. Please try again.";
      try { const body = await (err as { context?: Response })?.context?.json(); if (body?.error) msg = body.error; } catch { /* keep default */ }
      setError(msg); setBusy(null);
      return;
    }
    window.location.assign(data.url);
  }

  // Taking a plan: without a subscription, check out; with one, Stripe's portal applies the change.
  const choose = (target: PaidPlan) => (subscribed ? go("portal", target) : go("checkout", target));

  function action(id: PlanId): React.ReactNode {
    const yours = <span style={{ fontSize: 14, fontWeight: 700, color: C.secondary }}>Your plan</span>;
    if (id === "free") {
      if (!paid) return yours;
      if (handSet) return <button type="button" onClick={moveToFree} disabled={!!busy} className="app-press" style={btn()}>{busy === "free" ? "Moving…" : "Move to Free"}</button>;
      return <button type="button" onClick={() => go("portal")} disabled={!!busy} className="app-press" style={btn()}>{busy ? "Opening…" : "Move to Free"}</button>;
    }
    if (id === plan && subscribed && billing?.billing_interval === interval) return yours;
    if (id === "pro" && !PRO_AVAILABLE) return <span style={{ fontSize: 14, color: C.muted }}>Coming soon</span>;
    const name = PLAN_NAMES[id];
    // On a hand-set plan, choosing the same plan means starting to pay for it.
    const verb = id === plan ? (handSet ? "Pay for" : "Switch to") : subscribed ? "Switch to" : "Choose";
    return (
      <button type="button" onClick={() => choose(id as PaidPlan)} disabled={!!busy} className="app-press" style={{ ...btn(id === "core" ? "accent" : "secondary"), opacity: busy ? 0.6 : 1 }}>
        {busy ? "Opening Stripe…" : `${verb} ${name}`}
      </button>
    );
  }

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        <Link href="/settings/" className="app-press" style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 15, fontWeight: 600, color: C.secondary, textDecoration: "none", margin: "0 0 10px -4px", padding: "4px 4px" }}>
          <ChevronLeft size={18} aria-hidden /> Settings
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Plans</h1>
        <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 18px", lineHeight: 1.5 }}>
          You&apos;re on <strong style={{ color: C.dark }}>{PLAN_NAMES[plan]}</strong>
          {subscribed && billing?.current_period_end && (billing.cancel_at_period_end
            ? <>. It ends on {fmt(billing.current_period_end)}.</>
            : <>. Renews on {fmt(billing.current_period_end)}.</>)}
          {!subscribed && "."}
        </p>

        {notice && <p role="status" style={{ fontSize: 15, background: C.shiftBg, color: C.shiftText, borderRadius: 12, padding: "10px 12px", margin: "0 0 14px" }}>{notice}</p>}
        {billing?.status === "past_due" && (
          <p style={{ fontSize: 15, background: "#fff5f3", color: "#9b2c25", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px" }}>
            Your last payment didn&apos;t go through. Update your card under payment details to keep your plan.
          </p>
        )}
        {handSet && (
          <p style={{ fontSize: 15, color: C.secondary, background: "#f3f4f6", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px", lineHeight: 1.5 }}>
            There&apos;s nothing to pay for this plan right now. Choose a plan below to pay for it yourself, or move to Free.
          </p>
        )}

        <div role="radiogroup" aria-label="Billing" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2, marginBottom: 16 }}>
          {(["month", "year"] as Interval[]).map((i) => (
            <button key={i} type="button" role="radio" aria-checked={interval === i} onClick={() => setInterval(i)} className="app-press" style={{
              border: "none", borderRadius: 999, padding: "7px 14px", minHeight: 36, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
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

        {subscribed && (
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
