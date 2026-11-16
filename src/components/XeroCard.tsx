"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Staff } from "@/lib/types";
import { C, Modal, btn, haptic, input } from "@/components/ui";

type Connection = Database["public"]["Tables"]["xero_connections"]["Row"];
type XeroEmployee = { id: string; name: string; basis?: string | null };

async function callXero<T>(body: Record<string, unknown>): Promise<{ data?: T; error?: string }> {
  const { data, error } = await supabase().functions.invoke("xero", { body });
  if (error || !data) {
    let msg = "Couldn't reach Xero. Please try again.";
    try { const b = await (error as { context?: Response })?.context?.json(); if (b?.error) msg = b.error; } catch { /* keep default */ }
    return { error: msg };
  }
  return { data: data as T };
}

const RESULT_TEXT: Record<string, string> = {
  connected: "Connected to Xero.",
  cancelled: "Xero connection cancelled. Nothing changed.",
  expired: "That took too long. Please connect again.",
  "no-organisation": "No Xero organisation was picked. Please connect again and choose one.",
  error: "Couldn't connect to Xero. Please try again.",
};

/** Settings → Payroll: connect Xero, match staff to Xero employees, disconnect. */
export default function XeroCard({ businessId, pro }: { businessId: string; pro: boolean }) {
  const [conn, setConn] = useState<Connection | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [matching, setMatching] = useState(false);
  const [unmatched, setUnmatched] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const sb = supabase();
    (async () => {
      const [{ data }, { data: staff }] = await Promise.all([
        sb.from("xero_connections").select("*").eq("business_id", businessId).maybeSingle(),
        sb.from("staff").select("id, xero_employee_id").eq("active", true),
      ]);
      if (cancelled) return;
      setConn(data ?? null);
      setUnmatched((staff ?? []).filter((s) => !s.xero_employee_id).length);
      // Back from Xero (?xero=connected etc.): say what happened, then tidy the URL.
      const result = new URLSearchParams(window.location.search).get("xero");
      if (result && RESULT_TEXT[result]) {
        setNotice({ text: RESULT_TEXT[result], ok: result === "connected" });
        if (result === "connected" && data) setMatching(true); // next step: match staff
        window.history.replaceState(null, "", window.location.pathname + window.location.hash);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  async function connect() {
    setBusy(true);
    const { data, error } = await callXero<{ url: string }>({ action: "start" });
    if (error || !data) { setNotice({ text: error ?? "Couldn't start.", ok: false }); setBusy(false); return; }
    window.location.href = data.url;
  }

  async function disconnectXero() {
    setBusy(true);
    const { error } = await callXero({ action: "disconnect" });
    setBusy(false);
    if (error) { setNotice({ text: error, ok: false }); return; }
    setConn(null);
    setNotice({ text: "Disconnected from Xero. SMEasy no longer has access.", ok: true });
  }

  if (conn === undefined) return <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Loading…</p>;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h3 style={{ fontSize: 16, fontWeight: 750, color: C.dark, margin: 0 }}>Xero Payroll</h3>
        <span style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: "3px 9px", background: "#eef0f3", color: C.secondary }}>Pro</span>
      </div>
      {pro && <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px", lineHeight: 1.5 }}>Approved hours go to Xero as draft timesheets for you to check and approve.</p>}

      {notice && <p role="status" style={{ fontSize: 14, background: notice.ok ? C.shiftBg : "#fff5f3", color: notice.ok ? C.shiftText : C.danger, borderRadius: 12, padding: "10px 12px", margin: "0 0 12px" }}>{notice.text}</p>}

      {!pro ? (
        <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5 }}>
          Send approved hours straight to Xero. Coming to Pro.
          {conn && <> · <button type="button" onClick={disconnectXero} disabled={busy} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.secondary, textDecoration: "underline", cursor: "pointer" }}>Disconnect Xero</button></>}
        </p>
      ) : conn ? (
        <>
          <p style={{ fontSize: 15, color: C.dark, margin: "0 0 4px" }}>Connected to <strong>{conn.tenant_name ?? "your Xero organisation"}</strong></p>
          <p style={{ fontSize: 13, color: C.muted, margin: "0 0 12px" }}>
            {unmatched ? `${unmatched} ${unmatched === 1 ? "person isn't" : "people aren't"} matched to a Xero employee yet.` : "Everyone is matched to a Xero employee."}
            {conn.last_sent_at && ` Last sent ${new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short" }).format(new Date(conn.last_sent_at))}.`}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setMatching(true)} className="app-press" style={btn()}>Match staff</button>
            <button type="button" onClick={disconnectXero} disabled={busy} className="app-press" style={btn("ghost")}>{busy ? "Disconnecting…" : "Disconnect"}</button>
          </div>
        </>
      ) : (
        <button type="button" onClick={connect} disabled={busy} className="app-press" style={{
          ...btn(), background: "#13B5EA", color: "#fff", borderColor: "#13B5EA", fontWeight: 700, opacity: busy ? 0.7 : 1,
        }}>{busy ? "Opening Xero…" : "Connect to Xero"}</button>
      )}

      {matching && conn && pro && <MatchStaff onClose={(n) => { setMatching(false); if (n !== undefined) setUnmatched(n); }} />}
    </>
  );
}

/** Pair each SMEasy staff member with their Xero employee. Exact name matches are suggested. */
function MatchStaff({ onClose }: { onClose: (unmatched?: number) => void }) {
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [employees, setEmployees] = useState<XeroEmployee[] | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: st }, res] = await Promise.all([
        supabase().from("staff").select("*").eq("active", true).order("name"),
        callXero<{ employees: XeroEmployee[] }>({ action: "employees", details: true }),
      ]);
      if (cancelled) return;
      if (res.error || !res.data) { setError(res.error ?? "Couldn't load Xero employees."); return; }
      const emps = res.data.employees;
      const norm = (n: string) => n.toLowerCase().replace(/\s+/g, " ").trim();
      const initial: Record<string, string> = {};
      for (const p of st ?? []) {
        const found = p.xero_employee_id && emps.some((e) => e.id === p.xero_employee_id) ? p.xero_employee_id
          : emps.find((e) => norm(e.name) === norm(p.name))?.id ?? "";
        initial[p.id] = found ?? "";
      }
      setStaff(st ?? []); setEmployees(emps); setPicks(initial);
    })();
    return () => { cancelled = true; };
  }, []);

  async function save() {
    if (!staff) return;
    setSaving(true);
    const sb = supabase();
    const changed = staff.filter((p) => (p.xero_employee_id ?? "") !== (picks[p.id] ?? ""));
    // Matching also fills in employment type from Xero where it isn't set yet.
    const basisOf = (id: string) => employees?.find((e) => e.id === id)?.basis ?? null;
    const results = await Promise.all(changed.map((p) => sb.from("staff").update({
      xero_employee_id: picks[p.id] || null,
      ...(picks[p.id] && !p.employment_basis && basisOf(picks[p.id]) ? { employment_basis: basisOf(picks[p.id]) } : {}),
    }).eq("id", p.id)));
    setSaving(false);
    if (results.some((r) => r.error)) { setError("Couldn't save every match. Please try again."); return; }
    haptic(10);
    onClose(staff.filter((p) => !picks[p.id]).length);
  }

  const taken = (id: string, except: string) => Object.entries(picks).some(([sid, eid]) => eid === id && sid !== except);

  return (
    <Modal title="Match staff to Xero" onClose={() => onClose()}>
      {error ? <p style={{ fontSize: 15, color: C.danger, margin: 0 }}>{error}</p>
        : !staff || !employees ? <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Loading your Xero employees…</p>
        : (
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5 }}>
              Pick each person&apos;s Xero employee. Names that match exactly are filled in for you. Anyone left as &ldquo;Not in Xero&rdquo; is skipped when you send hours.
            </p>
            {staff.map((p) => (
              <label key={p.id} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)", gap: 10, alignItems: "center", fontSize: 15, fontWeight: 650, color: C.dark }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <select value={picks[p.id] ?? ""} onChange={(e) => setPicks({ ...picks, [p.id]: e.target.value })} style={{ ...input, minHeight: 42, padding: "8px 10px", fontSize: 15 }}>
                  <option value="">Not in Xero</option>
                  {employees.map((e) => <option key={e.id} value={e.id} disabled={taken(e.id, p.id)}>{e.name}</option>)}
                </select>
              </label>
            ))}
            <button type="button" onClick={save} disabled={saving} className="app-press" style={{ ...btn("primary"), minHeight: 48 }}>{saving ? "Saving…" : "Save matches"}</button>
          </div>
        )}
    </Modal>
  );
}
