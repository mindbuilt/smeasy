// Stripe webhook: keeps public.billing in step with each business's subscription.
//   POST /functions/v1/stripe-webhook   (called by Stripe, not the browser; no JWT)
// Every request is verified against STRIPE_WEBHOOK_SECRET before anything is written.
//
// Events: checkout.session.completed, customer.subscription.created / updated / deleted.

import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { disconnect } from "../_shared/xero.ts";


// Service-role key: legacy env name, or the newer SUPABASE_SECRET_KEYS JSON map.
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
// Created on first use, so a missing secret shows up as a logged error, not a crash on boot.
let _stripe: Stripe | null = null;
const getStripe = () => (_stripe ??= new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { httpClient: Stripe.createFetchHttpClient() }));
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
let _admin: ReturnType<typeof createClient> | null = null;
const admin = () => (_admin ??= createClient(Deno.env.get("SUPABASE_URL")!, serviceKey()));

// Statuses that still count as paid. past_due keeps the plan while Stripe retries the card.
const PAID_STATUSES = new Set(["active", "trialing", "past_due"]);
// Pro prices, once Pro goes on sale. Any other paid price is Core.
const PRO_PRICES = new Set([Deno.env.get("STRIPE_PRICE_PRO_MONTHLY"), Deno.env.get("STRIPE_PRICE_PRO_ANNUAL")].filter(Boolean));

async function save(sub: Stripe.Subscription, fallbackBusinessId?: string | null) {
  const customer = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  // Newer API versions keep the period on the subscription item.
  const item = sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }) | undefined;
  const periodEnd = item?.current_period_end ?? (sub as unknown as { current_period_end?: number }).current_period_end;
  const paidPlan = item?.price?.id && PRO_PRICES.has(item.price.id) ? "pro" : "core";
  const interval = item?.price?.recurring?.interval;

  const row = {
    stripe_customer_id: customer,
    stripe_subscription_id: sub.id,
    plan: PAID_STATUSES.has(sub.status) ? paidPlan : "free",
    billing_interval: interval === "month" || interval === "year" ? interval : null,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  };

  // Find the business and the plan it had before this event.
  const { data: before } = await admin().from("billing").select("business_id, plan")
    .or(`stripe_customer_id.eq.${customer}${fallbackBusinessId || sub.metadata?.business_id ? `,business_id.eq.${fallbackBusinessId || sub.metadata?.business_id}` : ""}`)
    .maybeSingle();
  const businessId = sub.metadata?.business_id || fallbackBusinessId || before?.business_id;

  // Leaving Pro ends payroll sync: revoke Xero first, so a failure here makes Stripe retry
  // (the plan is only saved after the disconnect succeeds).
  if (before?.plan === "pro" && row.plan !== "pro" && businessId) {
    await disconnect(businessId);
    console.log("xero disconnected after Pro ended", businessId);
  }

  const { error } = businessId
    ? await admin().from("billing").upsert({ business_id: businessId, ...row })
    : await admin().from("billing").update(row).eq("stripe_customer_id", customer);
  if (error) throw error;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  let event: Stripe.Event;
  try {
    const body = await req.text();
    event = await getStripe().webhooks.constructEventAsync(body, req.headers.get("Stripe-Signature") ?? "", WEBHOOK_SECRET, undefined, Stripe.createSubtleCryptoProvider());
  } catch (e) {
    console.error("webhook signature check failed", e);
    return new Response("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.mode === "subscription" && s.subscription) {
          const sub = await getStripe().subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
          await save(sub, s.client_reference_id);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await save(event.data.object as Stripe.Subscription);
        break;
      default:
        break; // not an event we act on
    }
    return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error("webhook handling failed", event.type, e);
    return new Response("Webhook handler error", { status: 500 }); // Stripe will retry
  }
});
