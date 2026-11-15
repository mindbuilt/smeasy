"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { BILLING_ENABLED, FREE_STAFF_LIMIT, STAFF_LIMIT_ENFORCED } from "@/lib/site";
import { C, btn } from "@/components/ui";

type Billing = Database["public"]["Tables"]["billing"]["Row"];

const pill = (bg: string, color: string) => ({ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 9px", background: bg, color }) as const;
const fmt = (iso: string) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

/** Settings → Plan: current plan, staff count, and Upgrade / Manage billing (Stripe). */
export default function PlanCard({ businessId }: { businessId: string }) {
  const [billing, setBilling] = useState<Billing | null | undefined>(undefined);
  const [staffCount, setStaffCount] = useState<number | null>(null);
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
      if (result === "cancelled") setNotice("No changes made. You're still on Free.");
      if (result === "success") {
        // Stripe tells us through the webhook, which can take a few seconds.
        setNotice(b?.plan === "pro" ? "Thanks! You're on Pro." : "Payment received. Switching you to Pro…");
        for (let i = 0; i < 8 && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const nb = await load();
          if (nb?.plan === "pro") { setNotice("Thanks! You're on Pro."); break; }
        }
      }
      if (result) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  async function go(action: "checkout" | "portal") {
    setBusy(true); setError(null);
    const { data, error: err } = await supabase().functions.invoke("billing", { body: { action } });
    if (err || !data?.url) {
      let msg = "Couldn't open billing. Please try again.";
      try { const body = await (err as { context?: Response })?.context?.json(); if (body?.error) msg = body.error; } catch { /* keep default */ }
      setError(msg); setBusy(false);
      return;
    }
    window.location.href = data.url;
  }

  if (billing === undefined) return <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Loading your plan…</p>;

  const pro = billing?.plan === "pro";
  const overLimit = !pro && staffCount !== null && staffCount > FREE_STAFF_LIMIT;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <h2 style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: 0 }}>Plan</h2>
        {pro ? <span style={pill("#dcfce7", "#166534")}>Pro</span> : <span style={pill("#eef0f3", C.secondary)}>Free</span>}
      </div>

      {notice && <p role="status" style={{ fontSize: 15, background: C.shiftBg, color: C.shiftText, borderRadius: 12, padding: "10px 12px", margin: "8px 0 12px" }}>{notice}</p>}

      {pro ? (
        <>
          <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 14px", lineHeight: 1.5 }}>
            Unlimited staff and priority email support. $19 a month plus GST.{" "}
            {billing?.current_period_end && (billing.cancel_at_period_end
              ? <>Your plan ends on <strong style={{ color: C.dark }}>{fmt(billing.current_period_end)}</strong>.</>
              : <>Renews on {fmt(billing.current_period_end)}.</>)}
          </p>
          {billing?.status === "past_due" && (
            <p style={{ fontSize: 15, background: "#fff5f3", color: "#9b2c25", borderRadius: 12, padding: "10px 12px", margin: "0 0 14px" }}>
              Your last payment didn&apos;t go through. Update your card in Manage billing to keep Pro.
            </p>
          )}
          {BILLING_ENABLED && <button type="button" onClick={() => go("portal")} disabled={busy} className="app-press" style={{ ...btn("secondary"), opacity: busy ? 0.6 : 1 }}>
            {busy ? "Opening…" : "Manage billing"}
          </button>}
          <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Change your card, download invoices or cancel. Billing is handled securely by Stripe.</p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 14px", lineHeight: 1.5 }}>
            Every feature, for up to {FREE_STAFF_LIMIT} staff. You have <strong style={{ color: overLimit ? "#9b2c25" : C.dark }}>{staffCount ?? "…"}</strong>.
            {!STAFF_LIMIT_ENFORCED && " There's no staff limit during early access."}
            {" "}Pro is for bigger teams: more than {FREE_STAFF_LIMIT} staff and priority email support, for $19 a month plus GST.
          </p>
          {BILLING_ENABLED && (
            <button type="button" onClick={() => go("checkout")} disabled={busy} className="app-press" style={{ ...btn("accent"), opacity: busy ? 0.6 : 1 }}>
              {busy ? "Opening checkout…" : "Upgrade to Pro"}
            </button>
          )}
          {BILLING_ENABLED && billing?.stripe_customer_id && (
            <button type="button" onClick={() => go("portal")} disabled={busy} style={{ ...btn("ghost"), marginLeft: 6 }}>Billing history</button>
          )}
          {BILLING_ENABLED && <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0" }}>Monthly, cancel any time. Payments are handled securely by Stripe.</p>}
        </>
      )}

      {error && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: "10px 0 0" }}>{error}</p>}
    </>
  );
}
