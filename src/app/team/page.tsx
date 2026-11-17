"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useManager } from "@/lib/useManager";
import type { Staff } from "@/lib/types";
import { AppShell, Avatar, C, Loading, Modal, btn, haptic, input, label } from "@/components/ui";
import { roleSwatch } from "@/lib/roleColors";
import Link from "next/link";
import { atStaffLimit, hasPro, usePlan } from "@/lib/usePlan";
import { DEFAULT_WEEKLY_HOURS, FREE_STAFF_LIMIT, STAFF_LIMIT_ENFORCED } from "@/lib/site";
import { Check, Copy, Mail, MessageSquare, Pencil, Send } from "lucide-react";
import AddFromXero from "@/components/AddFromXero";
import RolesEditor from "@/components/RolesEditor";
import { EMPLOYMENT } from "@/lib/worked";

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
  const [sending, setSending] = useState<Staff | null>(null);
  const [showFormer, setShowFormer] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [xeroConnected, setXeroConnected] = useState(false);
  const [fromXero, setFromXero] = useState(false);
  const plan = usePlan(business?.id);

  useEffect(() => {
    if (!business) return;
    let cancelled = false;
    supabase().from("staff").select("*").order("name").then(({ data }) => { if (!cancelled) setStaff(data ?? []); });
    supabase().from("xero_connections").select("business_id").maybeSingle().then(({ data }) => { if (!cancelled) setXeroConnected(!!data); });
    return () => { cancelled = true; };
  }, [business]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !newName.trim()) return;
    const { data, error } = await supabase().from("staff")
      .insert({ business_id: business.id, name: newName.trim(), default_role: business.roles[0] ?? null })
      .select().single();
    if (error?.code === "P0001") { setLimitHit(true); return; } // the database's Free plan check
    setNewName("");
    if (data) setStaff((s) => [...(s ?? []), data].sort((a, b) => a.name.localeCompare(b.name)));
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
          {limitHit || atStaffLimit(plan, active.length) ? (
            <div role="status" style={{ background: C.shiftBg, color: C.shiftText, borderRadius: 12, padding: "12px 14px", fontSize: 15, lineHeight: 1.5, marginBottom: 10 }}>
              The Free plan is for up to {FREE_STAFF_LIMIT} staff. <Link href="/plan/" style={{ color: C.dark, fontWeight: 700 }}>Upgrade to Plus</Link> for unlimited staff at one flat price.
            </div>
          ) : (
            <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name, e.g. Sam"
                style={input} aria-label="New team member name" autoFocus={isNew} />
              <button type="submit" disabled={!newName.trim()} className="app-press" style={{ ...btn("primary"), whiteSpace: "nowrap", opacity: newName.trim() ? 1 : 0.5 }}>Add</button>
            </form>
          )}
          {xeroConnected && hasPro(plan) && !(limitHit || atStaffLimit(plan, active.length)) && (
            <button type="button" onClick={() => setFromXero(true)} className="app-press" style={{ ...btn("ghost"), padding: "2px 0", minHeight: 30, marginBottom: 10, color: C.dark, fontWeight: 650 }}>
              Add from Xero
            </button>
          )}

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
                    {[s.default_role, EMPLOYMENT[s.employment_basis ?? ""], s.mobile].filter(Boolean).join(" · ") || "No role or mobile yet"}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.email ? <>{s.email}{!s.email_roster && " · roster emails off"}</> : <button onClick={() => setEditing(s)} style={{ background: "none", border: "none", padding: 0, font: "inherit", color: C.shiftText, fontWeight: 650, cursor: "pointer" }}>Add email for roster emails</button>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => setEditing(s)} className="app-press" style={small}><Pencil size={15} /> Edit</button>
                  <button onClick={() => setSending(s)} className="app-press" title="Their personal link: their shifts, time-off requests and calendar" style={small}><Send size={15} /> Send link</button>
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

        <section style={{ background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: 16, marginBottom: 14 }}>
          <RolesEditor key={business.roles.join("|")} roles={business.roles} onSave={async (roles) => {
            const { data } = await supabase().from("businesses").update({ roles }).eq("id", business.id).select().single();
            if (data) setBusiness(data);
          }} />
        </section>

        <TeamLinkCard token={business.team_token} onReset={async () => {
          const { data } = await supabase().from("businesses").update({ team_token: crypto.randomUUID() }).eq("id", business.id).select().single();
          if (data) setBusiness(data);
        }} />
      </div>

      {sending && <SendLink staff={sending} business={business.name} onClose={() => setSending(null)} />}
      {fromXero && (
        <AddFromXero businessId={business.id} defaultRole={business.roles[0] ?? null} staff={staff}
          slots={STAFF_LIMIT_ENFORCED && plan === "free" ? Math.max(0, FREE_STAFF_LIMIT - active.length) : null}
          onClose={() => setFromXero(false)}
          onAdded={(added) => { setStaff((all) => [...(all ?? []), ...added].sort((a, b) => a.name.localeCompare(b.name))); setFromXero(false); }} />
      )}
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

function StaffEditor({ staff, roles, onClose, onSaved }: {
  staff: Staff; roles: string[]; onClose: () => void; onSaved: (s: Staff) => void;
}) {
  const [f, setF] = useState({
    name: staff.name, mobile: staff.mobile ?? "", email: staff.email ?? "",
    default_role: staff.default_role ?? "",
    max_weekly_hours: String(staff.max_weekly_hours ?? DEFAULT_WEEKLY_HOURS),
    employment_basis: staff.employment_basis ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  async function save(patch?: Partial<Staff>) {
    setError(null);
    const weekly = f.max_weekly_hours.trim() === "" ? DEFAULT_WEEKLY_HOURS : Number(f.max_weekly_hours);
    if (Number.isNaN(weekly) || weekly <= 0 || weekly > 100) { setError("Weekly hours should be a number from 1 to 100."); return; }
    const { data, error } = await supabase().from("staff").update({
      name: f.name.trim(), mobile: f.mobile.trim() || null, email: f.email.trim() || null,
      default_role: f.default_role || null,
      max_weekly_hours: Math.round(weekly * 10) / 10,
      employment_basis: f.employment_basis || null,
      ...patch,
    }).eq("id", staff.id).select().single();
    if (error) setError(error.code === "P0001" ? `The Free plan is for up to ${FREE_STAFF_LIMIT} staff. Upgrade to Plus for unlimited staff.` : "Couldn't save. Please try again.");
    else if (data) onSaved(data);
  }

  return (
    <Modal title={staff.name} onClose={onClose}>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={label}>Name</label><input style={input} value={f.name} onChange={set("name")} /></div>
        <div><label style={label}>Mobile</label><input style={input} type="tel" value={f.mobile} onChange={set("mobile")} placeholder="04xx xxx xxx" /></div>
        <div><label style={label} htmlFor="staff-email">Email (for roster emails)</label>
          <input id="staff-email" style={input} type="email" value={f.email} onChange={set("email")} placeholder="name@example.com" />
          <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>They get their shifts by email when you publish. They can also add or change it on their personal link.{!staff.email_roster && " They've turned roster emails off."}</p>
        </div>
        <div><label style={label} htmlFor="employment">Employment type</label>
          <select id="employment" style={input} value={f.employment_basis} onChange={set("employment_basis")}>
            <option value="">Not set</option>
            <option value="casual">Casual</option>
            <option value="part_time">Part-time</option>
            <option value="full_time">Full-time</option>
          </select>
        </div>
        <div><label style={label}>Usual role</label>
          <select style={input} value={f.default_role} onChange={set("default_role")}>
            <option value="">—</option>
            {roles.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
        <div><label style={label} htmlFor="weekly">Usual hours a week</label>
          <input id="weekly" style={{ ...input, maxWidth: 160 }} inputMode="decimal" value={f.max_weekly_hours} onChange={set("max_weekly_hours")} placeholder={String(DEFAULT_WEEKLY_HOURS)} />
          <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>{DEFAULT_WEEKLY_HOURS} is a standard full-time week. Use their agreed hours for part-timers. The roster shows when you give them more.</p>
        </div>
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

/** Resend someone their personal link: by email, by text, or copy it. */
function SendLink({ staff, business, onClose }: { staff: Staff; business: string; onClose: () => void }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "copied">("idle");
  const [error, setError] = useState<string | null>(null);
  async function email() {
    setState("sending"); setError(null);
    const { error: err } = await supabase().functions.invoke("notify-roster", { body: { kind: "link", staff_id: staff.id } });
    if (err) {
      let msg = "Couldn't send the email. Please try again.";
      try { const b = await (err as { context?: Response })?.context?.json(); if (b?.error) msg = b.error; } catch { /* keep default */ }
      setError(msg); setState("idle"); return;
    }
    haptic(10); setState("sent");
  }
  async function copy() {
    await navigator.clipboard.writeText(staffLink(staff));
    haptic(8); setState("copied");
  }
  const row = { display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left", padding: "13px 4px", border: "none", borderBottom: `1px solid ${C.divider}`, background: "none", cursor: "pointer", fontFamily: "inherit", color: C.dark, fontSize: 16, fontWeight: 650, textDecoration: "none" } as const;
  return (
    <Modal title={`Send ${staff.name.split(" ")[0]} their link`} onClose={onClose}>
      <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 6px", lineHeight: 1.5 }}>Their personal link opens on their own shifts. It also comes in every roster email.</p>
      <div style={{ display: "grid" }}>
        {staff.email && (
          <button type="button" onClick={email} disabled={state === "sending" || state === "sent"} className="app-press" style={row}>
            <Mail size={19} color={C.secondary} />
            {state === "sending" ? "Sending…" : state === "sent" ? `Emailed to ${staff.email}` : <span>Email it <span style={{ fontWeight: 500, color: C.muted, fontSize: 14 }}>to {staff.email}</span></span>}
            {state === "sent" && <Check size={18} color={C.shiftText} style={{ marginLeft: "auto" }} />}
          </button>
        )}
        <a href={smsHref(staff, business)} className="app-press" style={row}><MessageSquare size={19} color={C.secondary} /> Text it{staff.mobile && " "}{staff.mobile && <span style={{ fontWeight: 500, color: C.muted, fontSize: 14 }}>to {staff.mobile}</span>}</a>
        <button type="button" onClick={copy} className="app-press" style={row}>
          <Copy size={19} color={C.secondary} /> {state === "copied" ? "Copied" : "Copy link"}
          {state === "copied" && <Check size={18} color={C.shiftText} style={{ marginLeft: "auto" }} />}
        </button>
      </div>
      {error && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: "10px 0 0" }}>{error}</p>}
    </Modal>
  );
}
