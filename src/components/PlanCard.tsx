"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { BILLING_ENABLED, FREE_STAFF_LIMIT, PLAN_NAMES, PRICES, PRO_AVAILABLE, type Interval, type PlanId } from "@/lib/site";
import { C, btn } from "@/components/ui";

type Billing = Database["public"]["Tables"]["billing"]["Row"];

const pill = (bg: string, color: string) => ({ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 9px", background: bg, color }) as const;
const fmt = (iso: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
type BuyablePlan = "core" | "pro";
const priceText = (p: BuyablePlan, i: Interval) => (i === "year" ? `$${PRICES[p].year} a year` : `$${PRICES[p].month} a month`);

/** Settings → Plan: current plan, staff count, and Upgrade / Manage billing (Stripe). */
export default function PlanCard({ businessId }: { businessId: string }) {
  const [billing, setBilling] = useState<Billing | null | undefined>(undefined);
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [interval, setBillingInterval] = useState<Interval>("month");
  const [choice, setChoice] = useState<BuyablePlan>("core");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = supabase();
    const load = async () => {
      const [{ data: b }, { count }] = await Promise.all([
        sb.from("billing").select("*").eq("business_id", businessId).maybeSingle(),
        sb.from("staff").select("id", { count: "exact", head: true }).eq("active", true),
      ]);
      if (cancelled) return null;
      setBilling(b ?? null);
      setStaffCount(count ?? 0);
      return b;
    };

    const result = new URLSearchParams(window.location.search).get("billing");
    (async () => {
      const b = await load();
      const paid = (x: Billing | null | undefined) => !!x && x.plan !== "free";
      if (result === "cancelled") setNotice("No changes made. You're still on Free.");
      if (result === "success") {
        // Stripe tells us through the webhook, which can take a few seconds.
        setNotice(paid(b) ? `Thanks! You're on ${PLAN_NAMES[b!.plan as PlanId]}.` : "Payment received. Switching your plan…");
        for (let i = 0; i < 8 && !cancelled && !paid(b); i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const nb = await load();
          if (paid(nb)) { setNotice(`Thanks! You're on ${PLAN_NAMES[nb!.plan as PlanId]}.`); break; }
        }
      }
      if (result) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  async function go(action: "checkout" | "portal") {
    setBusy(true); setError(null);
    const { data, error: err } = await supabase().functions.invoke("billing", { body: { action, plan: choice, interval } });
    if (err || !data?.url) {
      let msg = "Couldn't open billing. Please try again.";
      try { const body = await (err as { context?: Response })?.context?.json(); if (body?.error) msg = body.error; } catch { /* keep default */ }
      setError(msg); setBusy(false);
      return;
    }
    window.location.href = data.url;
  }

  if (billing === undefined) return <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Loading your plan…</p>;

  const plan = (billing?.plan ?? "free") as PlanId;
  const paid = plan !== "free";
  const overLimit = !paid && staffCount !== null && staffCount > FREE_STAFF_LIMIT;
  const tone = paid ? pill("#dcfce7", "#166534") : pill("#eef0f3", C.secondary);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: 0 }}>Plan</h2>
        <span style={tone}>{PLAN_NAMES[plan]}{paid && billing?.billing_interval === "year" ? " · annual" : ""}</span>
      </div>

      {notice && <p role="status" style={{ fontSize: 15, background: C.shiftBg, color: C.shiftText, borderRadius: 12, padding: "10px 12px", margin: "8px 0 12px" }}>{notice}</p>}

      {paid ? (
        <>
          <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 14px", lineHeight: 1.5 }}>
            Unlimited staff, flat rate.{" "}
            {billing?.current_period_end && (billing.cancel_at_period_end
              ? <>Your plan ends on <strong style={{ color: C.dark }}>{fmt(billing.current_period_end)}</strong>.</>
              : <>Renews on {fmt(billing.current_period_end)}.</>)}
          </p>
          {billing?.status === "past_due" && (
            <p style={{ fontSize: 15, background: "#fff5f3", color: "#9b2c25", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px" }}>
              Your last payment didn&apos;t go through. Update your card in Manage billing to keep your plan.
            </p>
          )}
          {BILLING_ENABLED && <button type="button" onClick={() => go("portal")} disabled={busy} className="app-press" style={{ ...btn("secondary"), opacity: busy ? 0.6 : 1 }}>
            {busy ? "Opening…" : "Manage billing"}
          </button>}
          <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Change your card, switch between monthly and annual, download invoices or cancel. Billing is handled securely by Stripe.</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 14px", lineHeight: 1.5 }}>
            Free is for up to {FREE_STAFF_LIMIT} staff. You have <strong style={{ color: overLimit ? "#9b2c25" : C.dark }}>{staffCount ?? "…"}</strong>.
            {" "}Plus gives you unlimited staff for one flat price: ${PRICES.core.month} a month or ${PRICES.core.year} a year (2 months free), plus GST.
            {PRO_AVAILABLE && <> Pro adds payroll sync with Xero for ${PRICES.pro.month} a month or ${PRICES.pro.year} a year.</>}
          </p>
          {BILLING_ENABLED && (
            <>
              {PRO_AVAILABLE && (
                <div role="radiogroup" aria-label="Plan" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2, marginBottom: 8 }}>
                  {(["core", "pro"] as BuyablePlan[]).map((p) => (
                    <button key={p} type="button" role="radio" aria-checked={choice === p} onClick={() => setChoice(p)} className="app-press" style={{
                      border: "none", borderRadius: 999, padding: "7px 14px", minHeight: 36, fontSize: 14, fontWeight: 650, fontFamily: "inherit", cursor: "pointer",
                      background: choice === p ? C.dark : "transparent", color: choice === p ? C.white : C.secondary,
                    }}>{PLAN_NAMES[p]}</button>
                  ))}
                </div>
              )}
              <div role="radiogroup" aria-label="Billing" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2, marginBottom: 12 }}>
                {(["month", "year"] as Interval[]).map((i) => (
                  <button key={i} type="button" role="radio" aria-checked={interval === i} onClick={() => setBillingInterval(i)} className="app-press" style={{
                    border: "none", borderRadius: 999, padding: "7px 14px", minHeight: 36, fontSize: 14, fontWeight: 650, fontFamily: "inherit", cursor: "pointer",
                    background: interval === i ? C.dark : "transparent", color: interval === i ? C.white : C.secondary,
                  }}>{i === "month" ? "Monthly" : "Annual · 2 months free"}</button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => go("checkout")} disabled={busy} className="app-press" style={{ ...btn("accent"), opacity: busy ? 0.6 : 1 }}>
                  {busy ? "Opening checkout…" : `Upgrade to ${PLAN_NAMES[choice]} · ${priceText(choice, interval)}`}
                </button>
                {billing?.stripe_customer_id && (
                  <button type="button" onClick={() => go("portal")} disabled={busy} style={btn("ghost")}>Billing history</button>
                )}
              </div>
              <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Plus GST. Cancel any time. Payments are handled securely by Stripe. <Link href="/pricing/" style={{ color: C.secondary }}>Compare plans</Link></p>
            </>
          )}
        </>
      )}

      {error && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: "10px 0 0" }}>{error}</p>}
    </>
  );
}
