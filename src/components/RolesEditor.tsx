"use client";

import { useState } from "react";
import { roleSwatch } from "@/lib/roleColors";
import { C, btn, input } from "@/components/ui";

/** Shift roles (Team page): the jobs people are rostered on. Each gets a colour on the roster, in this order. */
export default function RolesEditor({ roles, onSave }: { roles: string[]; onSave: (r: string[]) => Promise<void> }) {
  const [list, setList] = useState(roles);
  const [next, setNext] = useState("");
  const dirty = list.join("|") !== roles.join("|");
  return (
    <>
      <h2 style={{ fontSize: 18, fontWeight: 750, color: C.dark, margin: "0 0 4px" }}>Shift roles</h2>
      <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 12px", lineHeight: 1.5 }}>Each role has its own colour on the roster.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {list.map((r) => {
          const sw = roleSwatch(r, list);
          return (
            <span key={r} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: sw.bg, border: `1px solid ${sw.border}`, color: sw.text, fontSize: 13, fontWeight: 600 }}>
              {r}
              <button onClick={() => setList(list.filter((x) => x !== r))} aria-label={`Remove ${r}`}
                style={{ background: "none", border: "none", cursor: "pointer", color: sw.text, padding: 0 }}>✕</button>
            </span>
          );
        })}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); const v = next.trim(); if (v && !list.includes(v)) setList([...list, v]); setNext(""); }}
        style={{ display: "flex", gap: 8, maxWidth: 360 }}>
        <input value={next} onChange={(e) => setNext(e.target.value)} placeholder="Add a role, e.g. Delivery" style={input} aria-label="New role" />
        <button type="submit" style={btn()}>Add</button>
      </form>
      {dirty && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button onClick={() => onSave(list)} style={btn("primary")}>Save roles</button>
          <button onClick={() => setList(roles)} style={btn("ghost")}>Undo</button>
        </div>
      )}
    </>
  );
}
