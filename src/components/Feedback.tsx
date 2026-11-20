"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, MessageSquare, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { installDiagnostics, recentProblems } from "@/lib/diagnostics";
import { C, Modal, btn, input, label } from "@/components/ui";

// Beta feedback: a quiet header button that opens a short form. Who sent it (email, business)
// comes from their login on the server, so the form only asks what happened.

type Kind = "bug" | "idea";

/** Shrink a pasted or chosen image to at most 1600px wide, as JPEG, to keep uploads small. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = fail; i.src = url; });
    const scale = Math.min(1, 1600 / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

export function FeedbackButton({ email }: { email?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { installDiagnostics(); }, []);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Send feedback or report a bug" title="Feedback or a bug" className="app-press" style={{
        display: "inline-flex", alignItems: "center", gap: 6, height: 40, minWidth: 40, justifyContent: "center", padding: "0 10px", borderRadius: 999, flex: "none",
        border: "none", cursor: "pointer", background: "transparent", color: C.secondary, fontFamily: "inherit", fontSize: 14, fontWeight: 600,
      }}>
        <MessageSquare size={19} strokeWidth={2} /><span className="app-topnav">Feedback</span>
      </button>
      {open && <FeedbackForm email={email} onClose={() => setOpen(false)} />}
    </>
  );
}

function FeedbackForm({ email, onClose }: { email?: string; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>("bug");
  const [message, setMessage] = useState("");
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { const t = setTimeout(() => textRef.current?.focus(), 80); return () => clearTimeout(t); }, []);
  useEffect(() => { if (!sent) return; const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [sent, onClose]);

  async function addImage(file: File | null | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    try { setShot(await shrink(file)); setError(null); } catch { setError("Couldn't read that image. Try another one."); }
  }

  function onPaste(e: React.ClipboardEvent) {
    const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
    if (!item) return;
    e.preventDefault();
    void addImage(item.getAsFile());
  }

  async function send() {
    if (!message.trim()) { setError("Tell us what happened first."); textRef.current?.focus(); return; }
    setBusy(true); setError(null);
    const { data, error: err } = await supabase().functions.invoke("feedback", {
      body: {
        kind, message: message.trim(),
        page_url: window.location.href, user_agent: navigator.userAgent,
        viewport: `${window.innerWidth}×${window.innerHeight}`,
        diagnostics: recentProblems(), screenshot: shot,
      },
    });
    setBusy(false);
    if (err || !data?.ok) {
      let msg = "Couldn't send that. Please try again.";
      try { const body = await (err as { context?: Response })?.context?.json(); if (body?.error) msg = body.error; } catch { /* keep default */ }
      setError(msg);
      return;
    }
    setSent(true);
  }

  return (
    <Modal title="Feedback" onClose={onClose}>
      {sent ? (
        <p role="status" style={{ fontSize: 16, color: C.dark, margin: "6px 0 10px", lineHeight: 1.5 }}>
          Got it — sent straight to the founder. I&apos;ll reply to {email ?? "your email"} shortly.
        </p>
      ) : (
        <div onPaste={onPaste} style={{ display: "grid", gap: 14 }}>
          <div role="radiogroup" aria-label="Type of feedback" style={{ display: "inline-flex", padding: 3, borderRadius: 999, background: "#eef0f3", gap: 2, justifySelf: "start" }}>
            {([["bug", "Bug / something broken"], ["idea", "Idea / confusing"]] as [Kind, string][]).map(([k, t]) => (
              <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className="app-press" style={{
                border: "none", borderRadius: 999, padding: "7px 14px", minHeight: 36, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                background: kind === k ? C.dark : "transparent", color: kind === k ? C.white : C.secondary,
              }}>{t}</button>
            ))}
          </div>

          <div>
            <label htmlFor="feedback-text" style={label}>What happened, or what felt clunky?</label>
            <textarea id="feedback-text" ref={textRef} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={5000}
              style={{ ...input, minHeight: 120, resize: "vertical", lineHeight: 1.5, fontFamily: "inherit" }} />
            <p style={{ fontSize: 12, color: C.muted, margin: "6px 0 0" }}>We&apos;ll see which page you were on, so you don&apos;t need to say.</p>
          </div>

          <div>
            {shot ? (
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a local data URL preview */}
                <img src={shot} alt="Your screenshot" style={{ display: "block", maxWidth: 180, maxHeight: 120, borderRadius: 10, border: `1px solid ${C.border}` }} />
                <button type="button" onClick={() => setShot(null)} aria-label="Remove screenshot" style={{
                  position: "absolute", top: -8, right: -8, width: 26, height: 26, borderRadius: 999, border: "none", background: C.dark, color: C.white, display: "grid", placeItems: "center", cursor: "pointer",
                }}><X size={14} /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="app-press" style={{ ...btn("ghost"), padding: "4px 0", minHeight: 32, color: C.secondary }}>
                <ImagePlus size={17} /> Add a screenshot <span style={{ fontWeight: 500, color: C.muted }}>(or paste one)</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void addImage(e.target.files?.[0]); e.target.value = ""; }} />
          </div>

          {error && <p role="alert" style={{ fontSize: 14, color: C.danger, margin: 0 }}>{error}</p>}
          <button type="button" onClick={send} disabled={busy} className="app-press" style={{ ...btn("primary"), width: "100%", minHeight: 48, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Sending…" : "Send to the founder"}
          </button>
        </div>
      )}
    </Modal>
  );
}
