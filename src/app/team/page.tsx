"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import type { Staff } from "@/lib/types";
import { AppShell, C, Loading, Modal, btn, input, label } from "@/components/ui";

function staffLink(s: Staff) {
  return `${window.location.origin}/s/#${s.roster_token}`;
}

function smsHref(s: Staff, business: string) {
  const body = `Hi ${s.name.split(" ")[0]}, here's your ${business} roster link — bookmark it: ${staffLink(s)}`;
  return `sms:${s.mobile ?? ""}?&body=${encodeURIComponent(body)}`;
}

function TeamPage() {
  const { business, setBusiness, email } = useManager();
  const isNew = useSearchParams().get("new") === "1";
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<Staff | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showFormer, setShowFormer] = useState(false);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    supabase().from("staff").select("*").order("name").then(({ data }) => { if (!cancelled) setStaff(data ?? []); });
    return () => { cancelled = true; };
  }, [business]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !newName.trim()) return;
    const { data } = await supabase().from("staff")
      .insert({ business_id: business.id, name: newName.trim(), default_role: business.roles[0] ?? null })
      .select().single();
    setNewName("");
    if (data) setStaff((s) => [...(s ?? []), data].sort((a, b) => a.name.localeCompare(b.name)));
  }

  async function copyLink(s: Staff) {
    await navigator.clipboard.writeText(staffLink(s));
    setCopied(s.id);
    setTimeout(() => setCopied(null), 1800);
  }

  if (!business || !staff) return <AppShell><Loading /></AppShell>;

  const active = staff.filter((s) => s.active);
  const former = staff.filter((s) => !s.active);

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.dark, margin: "0 0 4px" }}>Team</h1>
        <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 20px" }}>
          {isNew && active.length === 0
            ? "Add the people you roster. Your team sees published rosters on one shared link — no app or password."
            : "The people you roster, and the link your team uses to see published rosters."}
        </p>

        <TeamLinkCard token={business.team_token} onReset={async () => {
          const { data } = await supabase().from("businesses").update({ team_token: crypto.randomUUID() }).eq("id", business.id).select().single();
          if (data) setBusiness(data);
        }} />

        <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name, e.g. Sam Nguyen"
            style={input} aria-label="New team member name" />
          <button type="submit" disabled={!newName.trim()} style={{ ...btn("primary"), whiteSpace: "nowrap", opacity: newName.trim() ? 1 : 0.5 }}>Add</button>
        </form>

        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, overflow: "hidden" }}>
          {active.length === 0 && (
            <div style={{ padding: "32px 24px", margin: 0, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }} aria-hidden>&#128075;</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, margin: "0 0 4px" }}>No one here yet</p>
              <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Type a name above to add your first team member.</p>
            </div>
          )}
          {active.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: i ? `1px solid ${C.divider}` : "none", flexWrap: "wrap" }}>
              <button onClick={() => setEditing(s)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.dark }}>{s.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {[s.default_role, s.mobile].filter(Boolean).join(" · ") || "Tap to add details"}
                </div>
              </button>
              <a href={smsHref(s, business.name)} title="Their personal link: own shifts + time-off requests"
                style={{ ...btn(), padding: "7px 12px", fontSize: 13, textDecoration: "none" }}>Text personal link</a>
              <button onClick={() => copyLink(s)} title="Their personal link: own shifts + time-off requests" style={{ ...btn(), padding: "7px 12px", fontSize: 13 }}>
                {copied === s.id ? "Copied ✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>

        {former.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <button onClick={() => setShowFormer((v) => !v)} style={{ ...btn("ghost"), padding: "4px 0", fontSize: 13 }}>
              {showFormer ? "Hide" : "Show"} former staff ({former.length})
            </button>
            {showFormer && former.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", padding: "8px 0", fontSize: 14, color: C.muted }}>
                {s.name}
                <button onClick={() => setEditing(s)} style={{ ...btn("ghost"), marginLeft: "auto", fontSize: 13 }}>Edit</button>
              </div>
            ))}
          </div>
        )}

        <RolesEditor key={business.roles.join("|")} roles={business.roles} onSave={async (roles) => {
          const { data } = await supabase().from("businesses").update({ roles }).eq("id", business.id).select().single();
          if (data) setBusiness(data);
        }} />
      </div>

      {editing && (
        <StaffEditor staff={editing} roles={business.roles} onClose={() => setEditing(null)}
          onSaved={(s) => { setStaff((all) => all!.map((x) => (x.id === s.id ? s : x))); setEditing(null); }} />
      )}
    </AppShell>
  );
}

function TeamLinkCard({ token, onReset }: { token: string; onReset: () => Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const link = typeof window === "undefined" ? "" : `${window.location.origin}/r/#${token}`;
  return (
    <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: C.r2, padding: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.dark }}>Team roster link</div>
      <p style={{ fontSize: 13, color: C.secondary, margin: "4px 0 12px" }}>
        Pin this in your staff group chat. It always shows the latest published roster, and staff can download it as a PDF.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input readOnly value={link} onFocus={(e) => e.target.select()} style={{ ...input, flex: 1, minWidth: 200, fontSize: 13, color: C.secondary }} aria-label="Team roster link" />
        <button onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          style={btn("primary")}>{copied ? "Copied ✓" : "Copy"}</button>
        <a href={link} target="_blank" rel="noreferrer" style={{ ...btn(), textDecoration: "none" }}>Open</a>
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: C.muted }}>
        {confirmReset ? (
          <>Old link stops working for everyone.{" "}
            <button onClick={async () => { await onReset(); setConfirmReset(false); }} style={{ ...btn("danger"), padding: "3px 8px", fontSize: 12 }}>Reset link</button>{" "}
            <button onClick={() => setConfirmReset(false)} style={{ ...btn("ghost"), padding: "3px 8px", fontSize: 12 }}>Cancel</button>
          </>
        ) : (
          <>Anyone with this link can see the roster (names and shift times only). Someone left?{" "}
            <button onClick={() => setConfirmReset(true)} style={{ background: "none", border: "none", padding: 0, color: C.secondary, textDecoration: "underline", cursor: "pointer", fontSize: 12 }}>Reset the link</button>
          </>
        )}
      </div>
    </div>
  );
}

function StaffEditor({ staff, roles, onClose, onSaved }: {
  staff: Staff; roles: string[]; onClose: () => void; onSaved: (s: Staff) => void;
}) {
  const [f, setF] = useState({
    name: staff.name, mobile: staff.mobile ?? "", email: staff.email ?? "",
    default_role: staff.default_role ?? "", hourly_rate: staff.hourly_rate?.toString() ?? "",
    payroll_id: staff.payroll_id ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function save(patch?: Partial<Staff>) {
    setError(null);
    const rate = f.hourly_rate.trim() === "" ? null : Number(f.hourly_rate);
    if (rate != null && (Number.isNaN(rate) || rate < 0)) { setError("Hourly rate should be a number."); return; }
    const { data, error } = await supabase().from("staff").update({
      name: f.name.trim(), mobile: f.mobile.trim() || null, email: f.email.trim() || null,
      default_role: f.default_role || null, hourly_rate: rate, payroll_id: f.payroll_id.trim() || null,
      ...patch,
    }).eq("id", staff.id).select().single();
    if (error) setError(error.code === "23505" ? "That payroll ID is already used by someone else." : "Couldn't save. Please try again.");
    else if (data) onSaved(data);
  }

  return (
    <Modal title={staff.name} onClose={onClose}>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={label}>Name</label><input style={input} value={f.name} onChange={set("name")} /></div>
        <div><label style={label}>Mobile</label><input style={input} type="tel" value={f.mobile} onChange={set("mobile")} placeholder="04xx xxx xxx" /></div>
        <div><label style={label}>Usual role</label>
          <select style={input} value={f.default_role} onChange={set("default_role")}>
            <option value="">—</option>
            {roles.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <details>
          <summary style={{ fontSize: 13, color: C.secondary, cursor: "pointer" }}>Pay and payroll (optional)</summary>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <div><label style={label}>Email</label><input style={input} type="email" value={f.email} onChange={set("email")} /></div>
            <div><label style={label}>Payroll / employee ID (Xero or MYOB)</label><input style={input} value={f.payroll_id} onChange={set("payroll_id")} /></div>
            <div><label style={label}>Hourly rate — only if you want a rough weekly wage total</label>
              <input style={input} inputMode="decimal" value={f.hourly_rate} onChange={set("hourly_rate")} placeholder="e.g. 32.50" />
            </div>
          </div>
        </details>
        {error && <p style={{ color: C.danger, fontSize: 13, margin: 0 }}>{error}</p>}
        <button onClick={() => save()} disabled={!f.name.trim()} style={btn("primary")}>Save</button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => save({ roster_token: crypto.randomUUID() })} style={{ ...btn(), fontSize: 13 }}
            title="Use if a phone is lost — the old link stops working">Reset their link</button>
          <button onClick={() => save({ active: !staff.active })} style={{ ...btn(staff.active ? "danger" : "secondary"), fontSize: 13 }}>
            {staff.active ? "Remove from team" : "Bring back"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RolesEditor({ roles, onSave }: { roles: string[]; onSave: (r: string[]) => Promise<void> }) {
  const [list, setList] = useState(roles);
  const [next, setNext] = useState("");
  const dirty = list.join("|") !== roles.join("|");
  return (
    <div style={{ marginTop: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: C.dark, margin: "0 0 4px" }}>Shift roles</h2>
      <p style={{ fontSize: 13, color: C.muted, margin: "0 0 10px" }}>The jobs people can be rostered on.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {list.map((r) => (
          <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: C.white, border: `1px solid ${C.border}`, fontSize: 13 }}>
            {r}
            <button onClick={() => setList(list.filter((x) => x !== r))} aria-label={`Remove ${r}`}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 0 }}>✕</button>
          </span>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const v = next.trim(); if (v && !list.includes(v)) setList([...list, v]); setNext(""); }}
        style={{ display: "flex", gap: 8, maxWidth: 360 }}>
        <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Add a role" style={input} />
        <button type="submit" style={btn()}>Add</button>
      </form>
      {dirty && <button onClick={() => onSave(list)} style={{ ...btn("primary"), marginTop: 10 }}>Save roles</button>}
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><TeamPage /></Suspense>;
}
