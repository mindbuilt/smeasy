#!/usr/bin/env node
// One-time Stripe setup for SMEasy's paid plans. Safe to re-run: it finds what already exists.
//
// Run it in your own Terminal (not through Claude, so your key stays out of chat logs):
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
// Add --live only when you mean to set up real billing with a live key.
// Add --new-webhook-secret to recreate the webhook endpoint (Stripe only reveals a
// signing secret once, when the endpoint is created).
//
// It creates or finds:
//   - Product "SMEasy Core": A$29/month (smeasy_core_monthly) and A$290/year (smeasy_core_annual), GST on top
//   - Tax rate "GST" 10%, Australia, exclusive
//   - Customer portal settings (update card, invoices, cancel at period end)
//   - Webhook endpoint for the stripe-webhook Edge Function
// Then it stores STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_CORE_MONTHLY,
// STRIPE_PRICE_CORE_ANNUAL and STRIPE_TAX_RATE_ID as Supabase Edge Function secrets
// (needs `npx supabase login`). Pro prices are added when Pro goes on sale.
// Secrets are never printed.

import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PROJECT_REF = "jrbjkrukmcqxrthhpdwx";
const WEBHOOK_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook`;
const CORE = [
  { key: "smeasy_core_monthly", amount: 2900, interval: "month", nickname: "Core monthly", secret: "STRIPE_PRICE_CORE_MONTHLY" },
  { key: "smeasy_core_annual", amount: 29000, interval: "year", nickname: "Core annual", secret: "STRIPE_PRICE_CORE_ANNUAL" },
];
const EVENTS = ["checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"];

const KEY = process.env.STRIPE_SECRET_KEY ?? "";
const live = process.argv.includes("--live");
const newWebhook = process.argv.includes("--new-webhook-secret");
if (!/^sk_(test|live)_/.test(KEY) && !/^rk_(test|live)_/.test(KEY)) {
  console.error("Set STRIPE_SECRET_KEY to your Stripe secret key (sk_test_...).");
  process.exit(1);
}
if (KEY.includes("_live_") && !live) {
  console.error("That's a LIVE key. Re-run with --live if you really mean to set up real billing.");
  process.exit(1);
}

function form(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? form(x, `${key}[${i}]`, out) : out.append(`${key}[${i}]`, String(x))));
    else if (typeof v === "object") form(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function api(method, path, params) {
  const url = new URL(`https://api.stripe.com/v1/${path}`);
  const init = { method, headers: { Authorization: `Bearer ${KEY}` } };
  if (params && method === "GET") form(params).forEach((v, k) => url.searchParams.append(k, v));
  else if (params) { init.body = form(params); init.headers["Content-Type"] = "application/x-www-form-urlencoded"; }
  const res = await fetch(url, init);
  const body = await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${body.error?.message ?? res.status}`);
  return body;
}

// 1. Core product + monthly and annual prices
const corePrices = {};
let coreProduct = null;
for (const p of CORE) {
  const found = (await api("GET", `prices?lookup_keys[]=${p.key}&active=true`)).data[0];
  if (found) { corePrices[p.secret] = found.id; coreProduct ??= found.product; console.log(`✓ ${p.nickname} price exists: ${found.id}`); continue; }
  coreProduct ??= (await api("POST", "products", { name: "SMEasy Core", description: "Unlimited staff, flat rate per business. Timesheets and overtime warnings." })).id;
  const price = await api("POST", "prices", {
    product: coreProduct, currency: "aud", unit_amount: p.amount, recurring: { interval: p.interval },
    tax_behavior: "exclusive", lookup_key: p.key, nickname: p.nickname,
  });
  corePrices[p.secret] = price.id;
  console.log(`✓ Created ${p.nickname} price ${price.id} (A$${p.amount / 100}/${p.interval} + GST)`);
}

// 2. GST tax rate
let tax = (await api("GET", "tax_rates", { active: true, limit: 100 })).data
  .find((t) => t.display_name === "GST" && t.percentage === 10 && t.country === "AU" && !t.inclusive);
if (tax) console.log(`✓ GST tax rate exists: ${tax.id}`);
else {
  tax = await api("POST", "tax_rates", { display_name: "GST", percentage: 10, inclusive: false, country: "AU", jurisdiction: "AU", description: "Australian GST" });
  console.log(`✓ Created GST tax rate ${tax.id}`);
}

// 3. Customer portal
const portals = (await api("GET", "billing_portal/configurations", { is_default: true, limit: 1 })).data;
// Lets customers switch between Core monthly and annual themselves.
const switchPlans = { enabled: true, default_allowed_updates: ["price"], proration_behavior: "create_prorations",
  products: [{ product: coreProduct, prices: Object.values(corePrices) }] };
if (portals.length) {
  await api("POST", `billing_portal/configurations/${portals[0].id}`, { features: { subscription_update: switchPlans } });
  console.log(`✓ Customer portal is configured (${portals[0].id}), with monthly / annual switching`);
} else {
  const p = await api("POST", "billing_portal/configurations", {
    business_profile: { headline: "SMEasy billing", privacy_policy_url: "https://www.smeasy.au/privacy/" },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "name", "address", "tax_id"] },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: switchPlans,
    },
  });
  console.log(`✓ Created customer portal settings ${p.id}`);
}

// 4. Webhook endpoint (Stripe only reveals the signing secret when it's created)
let webhookSecret = "";
let hooks = (await api("GET", "webhook_endpoints", { limit: 100 })).data.filter((h) => h.url === WEBHOOK_URL);
if (hooks.length && newWebhook) {
  for (const h of hooks) await api("DELETE", `webhook_endpoints/${h.id}`);
  console.log(`✓ Removed the old webhook so a new signing secret can be issued`);
  hooks = [];
}
if (hooks.length) {
  console.log(`✓ Webhook exists (${hooks[0].id}). Its secret can't be read back.`);
  console.log("  If STRIPE_WEBHOOK_SECRET isn't saved in Supabase yet, re-run with --new-webhook-secret.");
} else {
  const h = await api("POST", "webhook_endpoints", { url: WEBHOOK_URL, enabled_events: EVENTS, description: "SMEasy billing sync" });
  webhookSecret = h.secret;
  console.log(`✓ Created webhook ${h.id} → ${WEBHOOK_URL}`);
}

// 5. Supabase secrets (written to a private temp file, passed to the CLI, then deleted)
const lines = [`STRIPE_SECRET_KEY=${KEY}`, ...Object.entries(corePrices).map(([k, v]) => `${k}=${v}`), `STRIPE_TAX_RATE_ID=${tax.id}`];
if (webhookSecret) lines.push(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
const dir = mkdtempSync(join(tmpdir(), "smeasy-stripe-"));
const envFile = join(dir, "secrets.env");
writeFileSync(envFile, lines.join("\n") + "\n", { mode: 0o600 });
try {
  // --yes: CLI v3 asks before changing a hosted project, and this runs non-interactively.
  execFileSync("npx", ["supabase", "secrets", "set", "--env-file", envFile, `--remote=${PROJECT_REF}`, "--yes"], { stdio: "inherit" });
  console.log(`✓ Saved ${lines.map((l) => l.split("=")[0]).join(", ")} as Supabase secrets`);
} catch {
  console.error("✗ Couldn't save Supabase secrets. Run `npx supabase login` first, then re-run this script.");
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (!process.exitCode) console.log(`\nDone (${KEY.includes("_live_") ? "LIVE" : "test"} mode). Check with:  npx supabase secrets list --remote=${PROJECT_REF}`);
