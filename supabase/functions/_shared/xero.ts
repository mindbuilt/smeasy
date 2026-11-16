// Shared Xero helpers for the xero and xero-callback Edge Functions.
// Secrets: XERO_CLIENT_ID, XERO_CLIENT_SECRET, XERO_TOKEN_KEY (base64, 32 bytes: encrypts
// tokens at rest and signs the OAuth state).

import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://www.smeasy.au";
export const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/xero-callback`;
// Least access: AU payroll timesheets, plus read-only employees and settings (pay calendars).
export const SCOPES = "openid profile email offline_access payroll.employees.read payroll.timesheets payroll.settings.read";

const CLIENT_ID = Deno.env.get("XERO_CLIENT_ID") ?? "";
const CLIENT_SECRET = Deno.env.get("XERO_CLIENT_SECRET") ?? "";

export function serviceKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
export function publicKey(): string {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}"); return keys.default ?? Object.values(keys)[0] ?? ""; } catch { return ""; }
}
export const admin = (): SupabaseClient => createClient(Deno.env.get("SUPABASE_URL")!, serviceKey());

// ── Crypto ────────────────────────────────────────────────────────────────
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (u: Uint8Array) => b64(u).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const rawKey = () => unb64(Deno.env.get("XERO_TOKEN_KEY") ?? "");

async function aesKey() {
  return crypto.subtle.importKey("raw", rawKey(), "AES-GCM", false, ["encrypt", "decrypt"]);
}
export async function encrypt(text: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), new TextEncoder().encode(text)));
  return `${b64(iv)}.${b64(data)}`;
}
export async function decrypt(blob: string): Promise<string> {
  const [iv, data] = blob.split(".");
  const out = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(), unb64(data));
  return new TextDecoder().decode(out);
}

async function hmac(text: string) {
  const key = await crypto.subtle.importKey("raw", rawKey(), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(text))));
}

/** OAuth state: which business is connecting, valid for 15 minutes, signed so it can't be forged. */
export async function makeState(businessId: string) {
  const body = `${businessId}.${Date.now() + 15 * 60_000}.${b64url(crypto.getRandomValues(new Uint8Array(9)))}`;
  return `${body}.${await hmac(body)}`;
}
export async function readState(state: string): Promise<string | null> {
  const parts = state.split(".");
  if (parts.length !== 4) return null;
  const [businessId, exp, nonce, sig] = parts;
  if (Number(exp) < Date.now()) return null;
  if ((await hmac(`${businessId}.${exp}.${nonce}`)) !== sig) return null;
  return businessId;
}

// ── OAuth ─────────────────────────────────────────────────────────────────
export function authorizeUrl(state: string) {
  const u = new URL("https://login.xero.com/identity/connect/authorize");
  u.search = new URLSearchParams({ response_type: "code", client_id: CLIENT_ID, redirect_uri: REDIRECT_URI, scope: SCOPES, state }).toString();
  return u.toString();
}

type TokenSet = { access_token: string; refresh_token: string; expires_in: number };

async function tokenRequest(body: Record<string, string>): Promise<TokenSet> {
  const res = await fetch("https://identity.xero.com/connect/token", {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`xero token ${res.status}: ${await res.text()}`);
  return await res.json();
}
export const exchangeCode = (code: string) => tokenRequest({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI });

export async function saveTokens(businessId: string, t: TokenSet) {
  const { error } = await admin().from("xero_tokens").upsert({
    business_id: businessId,
    access_token: await encrypt(t.access_token),
    refresh_token: await encrypt(t.refresh_token),
    expires_at: new Date(Date.now() + (t.expires_in - 60) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** A working access token for the business's Xero connection, refreshing it if needed. */
export async function accessFor(businessId: string): Promise<{ token: string; tenantId: string; connectionId: string | null; refresh: string }> {
  const db = admin();
  const [{ data: tok }, { data: conn }] = await Promise.all([
    db.from("xero_tokens").select("*").eq("business_id", businessId).maybeSingle(),
    db.from("xero_connections").select("tenant_id, connection_id").eq("business_id", businessId).maybeSingle(),
  ]);
  if (!tok || !conn) throw new NotConnected();
  let refresh = await decrypt(tok.refresh_token);
  let token = await decrypt(tok.access_token);
  if (new Date(tok.expires_at).getTime() < Date.now()) {
    const t = await tokenRequest({ grant_type: "refresh_token", refresh_token: refresh }).catch((e) => {
      console.error("xero refresh failed", e);
      throw new NotConnected();
    });
    await saveTokens(businessId, t);
    token = t.access_token; refresh = t.refresh_token;
  }
  return { token, tenantId: conn.tenant_id, connectionId: conn.connection_id, refresh };
}

export class NotConnected extends Error { constructor() { super("Xero isn't connected. Connect it again in Settings."); } }

/** Revoke access at Xero and remove the connection (used by Disconnect and on cancellation). */
export async function disconnect(businessId: string) {
  try {
    const { token, connectionId, refresh } = await accessFor(businessId);
    if (connectionId) await fetch(`https://api.xero.com/connections/${connectionId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    await fetch("https://identity.xero.com/connect/revocation", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token: refresh }),
    });
  } catch (e) {
    console.error("xero revoke failed (removing our copy anyway)", e);
  }
  const db = admin();
  await db.from("xero_tokens").delete().eq("business_id", businessId);
  await db.from("xero_connections").delete().eq("business_id", businessId);
}

/** Payroll AU API call. Waits and retries once if Xero says to slow down (429). */
export async function payroll(a: { token: string; tenantId: string }, path: string, init: RequestInit = {}): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`https://api.xero.com/payroll.xro/1.0/${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${a.token}`, "Xero-Tenant-Id": a.tenantId, Accept: "application/json", "Content-Type": "application/json", ...(init.headers ?? {}) },
    });
    if (res.status === 429 && attempt === 0) {
      const wait = Math.min(Number(res.headers.get("Retry-After") ?? "5"), 30);
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    const text = await res.text();
    if (!res.ok) throw new Error(`xero ${init.method ?? "GET"} ${path.split("?")[0]} ${res.status}: ${text.slice(0, 500)}`);
    return text ? JSON.parse(text) : {};
  }
}

/** Xero dates come as "/Date(1700000000000+0000)/". Returns "YYYY-MM-DD". */
export function xeroDate(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /\/Date\((-?\d+)/.exec(v);
  const d = m ? new Date(Number(m[1])) : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}
