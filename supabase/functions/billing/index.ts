// Billing actions for the signed-in owner.
//   POST /functions/v1/billing  { "action": "checkout", "interval": "month" | "year" }  ->  { url }
//   POST /functions/v1/billing  { "action": "portal" }  ->  { url }
// "checkout" starts a Stripe Checkout for Plus (plan "core") or Pro (plan "pro"), from a free business;
// a paid business changes plan through "portal" (Stripe's plan switching). "portal" opens the Stripe
// customer portal (change card, invoices, cancel). The caller's own JWT decides which
// business this is (RLS), and only the service role writes public.billing.
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_CORE_MONTHLY, STRIPE_PRICE_CORE_ANNUAL,
// STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL, STRIPE_TAX_RATE_ID (GST, optional), SITE_URL (optional).

import Stripe from "https://esm.sh/stripe@17.7.0?target=denonext";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.smeasy.au";
const PRICES: Record<"core" | "pro", Record<string, string>> = {
  core: {
    month: Deno.env.get("STRIPE_PRICE_CORE_MONTHLY") ?? "",
    year: Deno.env.get("STRIPE_PRICE_CORE_ANNUAL") ?? "",
  },
  pro: {
    month: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "",
    year: Deno.env.get("STRIPE_PRICE_PRO_ANNUAL") ?? "",
  },
};
const TAX_RATE_ID = Deno.env.get("STRIPE_TAX_RATE_ID") ?? "";


// Service-role key: legacy env name, or the newer SUPABASE_SECRET_KEYS JSON map.
function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
function publicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
// Created on first use, so a missing secret shows up as a logged error, not a crash on boot.
let _stripe: Stripe | null = null;
const getStripe = () => (_stripe ??= new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { httpClient: Stripe.createFetchHttpClient() }));

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const asUser = createClient(SUPABASE_URL, publicKey(), { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: "Please log in again." }, 401);

    // RLS: this only ever returns the caller's own business.
    const { data: business } = await asUser.from("businesses").select("id, name").maybeSingle();
    if (!business) return json({ error: "Set up your business first." }, 400);

    const admin = createClient(SUPABASE_URL, serviceKey());
    const { data: billing } = await admin.from("billing").select("*").eq("business_id", business.id).maybeSingle();
    const { action, interval = "month", plan = "core" } = await req.json().catch(() => ({ action: "" }));

    if (action === "portal") {
      if (!billing?.stripe_customer_id) return json({ error: "There's no billing account yet." }, 400);
      try {
        const portal = await getStripe().billingPortal.sessions.create({
          customer: billing.stripe_customer_id,
          return_url: `${SITE_URL}/settings/#plan`,
        });
        return json({ url: portal.url });
      } catch (e) {
        // A customer from test mode (or deleted in Stripe) doesn't exist in live mode.
        if ((e as { code?: string })?.code === "resource_missing") {
          return json({ error: "We can't find your billing account in Stripe. Email hello@smeasy.au and we'll sort it out." }, 409);
        }
        throw e;
      }
    }

    if (action === "checkout") {
      if (plan !== "core" && plan !== "pro") return json({ error: "Unknown plan." }, 400);
      if (interval !== "month" && interval !== "year") return json({ error: "Pick monthly or annual." }, 400);
      const price = PRICES[plan][interval];
      if (!price) return json({ error: `${plan === "pro" ? "Pro" : "Plus"} billing isn't set up yet.` }, 500);
      if (billing?.plan && billing.plan !== "free") return json({ error: "You're already on a paid plan. Use Manage billing to change it." }, 400);

      let customer = billing?.stripe_customer_id;
      if (!customer) {
        const c = await getStripe().customers.create({
          email: user.email, name: business.name, metadata: { business_id: business.id },
        });
        customer = c.id;
        const { error } = await admin.from("billing")
          .upsert({ business_id: business.id, stripe_customer_id: customer, updated_at: new Date().toISOString() });
        if (error) throw error;
      }

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer,
        client_reference_id: business.id,
        line_items: [{ price, quantity: 1 }],
        subscription_data: {
          metadata: { business_id: business.id },
          ...(TAX_RATE_ID ? { default_tax_rates: [TAX_RATE_ID] } : {}),
        },
        customer_update: { name: "auto", address: "auto" },
        tax_id_collection: { enabled: true }, // lets them add an ABN for their tax invoice
        allow_promotion_codes: true,
        success_url: `${SITE_URL}/settings/?billing=success#plan`,
        cancel_url: `${SITE_URL}/settings/?billing=cancelled#plan`,
      });
      return json({ url: session.url });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("billing error", e);
    return json({ error: "Something went wrong with billing. Please try again." }, 500);
  }
});
