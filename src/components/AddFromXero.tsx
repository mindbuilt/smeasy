"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Staff } from "@/lib/types";
import { FREE_STAFF_LIMIT } from "@/lib/site";
import Link from "next/link";
import { C, Modal, btn, haptic } from "@/components/ui";

type XeroEmployee = { id: string; name: string; email: string | null; mobile: string | null; basis?: string | null };

const norm = (n: string) => n.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Team → Add from Xero: pick Xero employees to add as staff. Each comes in with
 * their name, email and mobile, already matched to Xero. Nothing changes in Xero.
 */
export default function AddFromXero({ businessId, defaultRole, staff, slots, onClose, onAdded }: {
  businessId: string; defaultRole: string | null; staff: Staff[];
  /** Places left on the Free plan (null = no limit). */
  slots: number | null;
  onClose: () => void; onAdded: (added: Staff[]) => void;
}) {
  const [employees, setEmployees] = useState<XeroEmployee[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase().functions.invoke("xero", { body: { action: "employees", details: true } });
      if (cancelled) return;
      if (err || !data) {
        let msg = "Couldn't load your Xero employees. Please try again.";
        try { const b = await (err as { context?: Response })?.context?.json(); if (b?.error) msg = b.error; } catch { /* keep default */ }
        setError(msg); return;
      }
      // Leave out anyone already in SMEasy: linked to that Xero employee, or an active person with the same name.
      const linked = new Set(staff.map((s) => s.xero_employee_id).filter(Boolean));
      const names = new Set(staff.filter((s) => s.active).map((s) => norm(s.name)));
      const fresh = (data.employees as XeroEmployee[]).filter((e) => !linked.has(e.id) && !names.has(norm(e.name)));
      setEmployees(fresh);
      setPicked(new Set(fresh.slice(0, slots ?? fresh.length).map((e) => e.id)));
    })();
    return () => { cancelled = true; };
  }, [staff, slots]);

  async function add() {
    if (!employees) return;
    setSaving(true); setError(null);
    const rows = employees.filter((e) => picked.has(e.id)).map((e) => ({
      business_id: businessId, name: e.name, email: e.email, mobile: e.mobile, xero_employee_id: e.id, default_role: defaultRole,
      employment_basis: e.basis ?? null,
    }));
    const { data, error: err } = await supabase().from("staff").insert(rows).select();
    setSaving(false);
    if (err) {
      setError(err.code === "P0001" ? `The Free plan is for up to ${FREE_STAFF_LIMIT} staff. Upgrade to Plus for unlimited staff.` : "Couldn't add them. Please try again.");
      return;
    }
    haptic([10, 40, 16]);
    onAdded(data ?? []);
  }

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const all = employees ? picked.size === employees.length : false;
  const full = slots !== null && picked.size >= slots; // no more ticks on Free
  const capped = slots !== null && !!employees && employees.length > slots;

  return (
    <Modal title="Add from Xero" onClose={onClose}>
      {error ? <p style={{ fontSize: 15, color: C.danger, margin: 0 }}>{error}</p>
        : !employees ? <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>Loading your Xero employees…</p>
        : employees.length === 0 ? <p style={{ fontSize: 15, color: C.secondary, margin: 0 }}>Everyone in Xero is already on your team.</p>
        : (
          <div style={{ display: "grid", gap: 12 }}>
            {capped ? (
              <p style={{ fontSize: 14, color: C.secondary, margin: 0, lineHeight: 1.5, background: C.shiftBg, borderRadius: 12, padding: "10px 12px" }}>
                The Free plan has room for {slots} more {slots === 1 ? "person" : "people"}. <Link href="/plan/" style={{ color: C.dark, fontWeight: 700 }}>Upgrade</Link> to add everyone.
              </p>
            ) : (
              <button type="button" onClick={() => setPicked(all ? new Set() : new Set(employees.map((e) => e.id)))}
                style={{ ...btn("ghost"), justifySelf: "start", padding: "4px 0", minHeight: 30, color: C.dark }}>
                {all ? "Untick all" : "Tick all"}
              </button>
            )}
            <div style={{ display: "grid" }}>
              {employees.map((e) => (
                <label key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${C.divider}`, cursor: "pointer" }}>
                  <input type="checkbox" checked={picked.has(e.id)} disabled={full && !picked.has(e.id)} onChange={() => toggle(e.id)} style={{ width: 20, height: 20, accentColor: C.dark, flex: "none" }} />
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: C.dark }}>{e.name}</span>
                    {(e.email || e.mobile) && <span style={{ display: "block", fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{[e.email, e.mobile].filter(Boolean).join(" · ")}</span>}
                  </span>
                </label>
              ))}
            </div>
            <button type="button" onClick={add} disabled={saving || picked.size === 0} className="app-press"
              style={{ ...btn("primary"), minHeight: 48, opacity: picked.size ? 1 : 0.5 }}>
              {saving ? "Adding…" : `Add ${picked.size} ${picked.size === 1 ? "person" : "people"}`}
            </button>
          </div>
        )}
    </Modal>
  );
}
