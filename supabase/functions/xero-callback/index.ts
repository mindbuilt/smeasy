// Xero sends the manager's browser here after they approve the connection.
//   GET /functions/v1/xero-callback?code=...&state=...   (no Supabase JWT: Xero redirects here)
// The signed state says which business is connecting. We swap the code for
// tokens, find the Xero organisation they just picked, store the tokens
// encrypted, and send them back to Settings.

import { SITE_URL, admin, exchangeCode, readState, saveTokens } from "../_shared/xero.ts";

const back = (result: string) => Response.redirect(`${SITE_URL}/settings/?xero=${result}#payroll`, 302);

function jwtPayload(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part + "===".slice((part.length + 3) % 4)));
  } catch { return {}; }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.searchParams.get("error")) return back("cancelled"); // they clicked Cancel at Xero

  const businessId = await readState(url.searchParams.get("state") ?? "");
  const code = url.searchParams.get("code");
  if (!businessId || !code) return back("expired");

  try {
    const tokens = await exchangeCode(code);
    const event = jwtPayload(tokens.access_token).authentication_event_id;

    // The organisation(s) approved in this sign-in. We use the first organisation.
    const res = await fetch("https://api.xero.com/connections", { headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" } });
    const connections = (await res.json()) as { id: string; authEventId: string; tenantId: string; tenantType: string; tenantName: string }[];
    const org = connections.find((c) => c.tenantType === "ORGANISATION" && c.authEventId === event)
      ?? connections.find((c) => c.tenantType === "ORGANISATION");
    if (!org) return back("no-organisation");

    const db = admin();
    // A different Xero organisation than before: old staff matches no longer apply.
    const { data: before } = await db.from("xero_connections").select("tenant_id").eq("business_id", businessId).maybeSingle();
    if (before && before.tenant_id !== org.tenantId) {
      await db.from("staff").update({ xero_employee_id: null }).eq("business_id", businessId);
    }

    await saveTokens(businessId, tokens);
    const { error } = await db.from("xero_connections").upsert({
      business_id: businessId, tenant_id: org.tenantId, tenant_name: org.tenantName, connection_id: org.id, connected_at: new Date().toISOString(),
    });
    if (error) throw error;
    return back("connected");
  } catch (e) {
    console.error("xero callback failed", e);
    return back("error");
  }
});
