"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import type { Staff } from "@/lib/types";
import { payDetailsOn } from "@/lib/pay";
import { AppShell, Avatar, C, Loading, Modal, btn, haptic, input, label } from "@/components/ui";
import { roleSwatch } from "@/lib/roleColors";
import { Check, Copy, MessageSquare, Pencil } from "lucide-react";

function staffLink(s: Staff) {
  return `${window.location.origin}/s/#${s.roster_token}`;
}

function smsHref(s: Staff, business: string) {
  const body = `Hi ${s.name.split(" ")[0]}, here's your personal ${business} roster link. Bookmark it to see your shifts, request time off, and add your shifts to your phone's calendar: ${staffLink(s)}`;
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
  const small = { ...btn(), padding: "8px 12px", fontSize: 14, minHeight: 38, textDecoration: "none" } as const;

  return (
    <AppShell businessName={business.name} email={email}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.dark, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Team</h1>
        <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 20px", lineHeight: 1.5 }}>
          Everyone you add here gets a row on your roster. Staff don&apos;t need an app or a password.
        </p>

        <section style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: "0 0 10px" }}>
            Staff {active.length > 0 && <span style={{ color: C.muted, fontWeight: 500 }}>({active.length})</span>}
          </h2>
          <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name, e.g. Sam"
              style={input} aria-label="New team member name" autoFocus={isNew} />
            <button type="submit" disabled={!newName.trim()} className="app-press" style={{ ...btn("primary"), whiteSpace: "nowrap", opacity: newName.trim() ? 1 : 0.5 }}>Add</button>
          </form>

          <div style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadow, overflow: "hidden" }}>
            {active.length === 0 && (
              <div style={{ padding: "32px 24px", margin: 0, textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.dark, margin: "0 0 4px" }}>No one here yet</p>
                <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Type a name above to add your first team member. Just a name is enough to start.</p>
              </div>
            )}
            {active.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderTop: i ? `1px solid ${C.divider}` : "none", flexWrap: "wrap" }}>
                <Avatar name={s.name} size={42} tone={s.default_role ? (() => { const sw = roleSwatch(s.default_role, business.roles); return { bg: sw.bg, text: sw.text }; })() : undefined} />
                <div style={{ flex: 1, minWidth: 130 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.dark }}>{s.name}</div>
                  <div style={{ fontSize: 14, color: C.muted }}>
                    {[s.default_role, s.mobile].filter(Boolean).join(" · ") || "No role or mobile yet"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setEditing(s)} className="app-press" style={small}><Pencil size={15} /> Edit</button>
                  <a href={smsHref(s, business.name)} className="app-press" title="Text them their personal link: their shifts, time-off requests and calendar" style={small}><MessageSquare size={15} /> Text link</a>
                  <button onClick={() => { copyLink(s); haptic(8); }} className="app-press" title="Copy their personal link: their shifts, time-off requests and calendar" style={small}>
                    {copied === s.id ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy link</>}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {active.length > 0 && (
            <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
              Each person&apos;s personal link shows their own shifts and lets them request time off and add shifts to their phone calendar.
            </p>
          )}

          {former.length > 0 && (
            <div style={{ marginTop: 12 }}>
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
        </section>

        <TeamLinkCard token={business.team_token} onReset={async () => {
          const { data } = await supabase().from("businesses").update({ team_token: crypto.randomUUID() }).eq("id", business.id).select().single();
          if (data) setBusiness(data);
        }} />
      </div>

      {editing && (
        <StaffEditor staff={editing} roles={business.roles} pay={payDetailsOn(business)} onClose={() => setEditing(null)}
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
    <div style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: 0 }}>Team roster link</h2>
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

function StaffEditor({ staff, roles, pay, onClose, onSaved }: {
  staff: Staff; roles: string[]; pay: boolean; onClose: () => void; onSaved: (s: Staff) => void;
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
      default_role: f.default_role || null,
      // Pay fields are only edited (and so only saved) when Pay details is on.
      ...(pay ? { hourly_rate: rate, payroll_id: f.payroll_id.trim() || null } : {}),
      ...patch,
    }).eq("id", staff.id).select().single();
    if (error) setError(error.code === "23505" ? "Someone else already has that payroll ID." : "Couldn't save. Please try again.");
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
        <div><label style={label}>Email (optional)</label><input style={input} type="email" value={f.email} onChange={set("email")} /></div>
        {pay && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={label}>Hourly rate ($)</label>
              <input style={input} inputMode="decimal" value={f.hourly_rate} onChange={set("hourly_rate")} placeholder="e.g. 32.50" />
            </div>
            <div><label style={label}>Payroll ID</label>
              <input style={input} value={f.payroll_id} onChange={set("payroll_id")} maxLength={40} placeholder="From Xero, MYOB…" />
            </div>
          </div>
        )}
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

export default function Page() {
  return <Suspense fallback={null}><TeamPage /></Suspense>;
}
