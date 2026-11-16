"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { btn, input, label, C } from "@/components/ui";
import { SIGNUPS_OPEN } from "@/lib/site";

const ENDPOINT = "https://formspree.io/f/xwlovdea";

const EARLY_ACCESS = "Early access: tell me when SMEasy opens";
const PRO_WAITLIST = "Pro waitlist: tell me when Xero and MYOB sync is ready";
const TOPICS = [
  ...(SIGNUPS_OPEN ? [] : [EARLY_ACCESS]),
  PRO_WAITLIST,
  "A question before signing up", "Help with my account", "A feature idea", "Delete my account", "Something else",
];

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string };

const noSubscribe = () => () => {};

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  // "Get early access" and "Join the waitlist" buttons link here with ?topic=early-access or
  // ?topic=pro ("" while prerendering).
  const linkTopic = useSyncExternalStore(
    noSubscribe,
    () => new URLSearchParams(window.location.search).get("topic") ?? "",
    () => "",
  );
  const [picked, setTopic] = useState<string | null>(null);
  const topic = picked ?? (linkTopic === "pro" ? PRO_WAITLIST : !SIGNUPS_OPEN && linkTopic === "early-access" ? EARLY_ACCESS : TOPICS[0]);
  const pro = topic === PRO_WAITLIST;
  // Joining a list: the message is optional and the button says what you're signing up for.
  const earlyAccess = topic === EARLY_ACCESS || pro;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        form.reset();
        setStatus({ kind: "sent" });
        return;
      }
      const data = await res.json().catch(() => null);
      const message = data?.errors?.map((x: { message: string }) => x.message).join(" ") || "Your message didn't send. Please try again.";
      setStatus({ kind: "error", message });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" style={{ background: C.shiftBg, color: C.shiftText, borderRadius: C.r2, padding: "20px 22px", fontSize: 16, lineHeight: 1.55 }}>
        {earlyAccess
          ? <><strong>Thanks, you&apos;re on the list.</strong> We&apos;ll email you as soon as {pro ? "Pro is ready" : "SMEasy opens"}.</>
          : <><strong>Thanks, your message is on its way.</strong> We&apos;ll reply to the email address you gave, usually within one business day.</>}
      </div>
    );
  }

  const field = { display: "grid", gap: 6 } as const;
  const lbl = { ...label, fontSize: 14, marginBottom: 0 };
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16, background: C.white, borderRadius: C.r2, boxShadow: C.shadow, padding: "24px 22px" }}>
      <div style={field}>
        <label htmlFor="c-name" style={lbl}>Your name</label>
        <input id="c-name" name="name" required autoComplete="name" maxLength={100} style={input} />
      </div>
      <div style={field}>
        <label htmlFor="c-email" style={lbl}>Email</label>
        <input id="c-email" name="email" type="email" required autoComplete="email" maxLength={200} style={input} />
      </div>
      <div style={field}>
        <label htmlFor="c-business" style={lbl}>Business name <span style={{ color: C.muted, fontWeight: 400 }}>(optional)</span></label>
        <input id="c-business" name="business" autoComplete="organization" maxLength={120} style={input} />
      </div>
      <div style={field}>
        <label htmlFor="c-topic" style={lbl}>What&apos;s it about?</label>
        <select id="c-topic" name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} style={input}>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div style={field}>
        <label htmlFor="c-message" style={lbl}>
          Message{earlyAccess && <span style={{ color: C.muted, fontWeight: 400 }}> (optional: what kind of business, how many staff{pro ? ", which payroll you use" : ""})</span>}
        </label>
        <textarea id="c-message" name="message" required={!earlyAccess} rows={earlyAccess ? 3 : 6} maxLength={5000} style={{ ...input, resize: "vertical", fontFamily: "inherit" }} />
      </div>
      {/* Spam trap: hidden from people, bots fill it in and Formspree discards the submission. */}
      <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: "none" }} />
      <input type="hidden" name="_subject" value={pro ? "SMEasy Pro waitlist" : earlyAccess ? "SMEasy early access request" : "SMEasy contact form"} />
      {status.kind === "error" && (
        <p role="alert" style={{ margin: 0, color: C.danger, fontSize: 15 }}>{status.message}</p>
      )}
      <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
        Please don&apos;t include passwords or staff details you don&apos;t need to. Your message is delivered to us by Formspree.
      </p>
      <button type="submit" disabled={status.kind === "sending"} className="app-press" style={{ ...btn("accent"), justifySelf: "start", padding: "12px 24px", fontSize: 16, minHeight: 48, fontWeight: 700 }}>
        {status.kind === "sending" ? "Sending…" : pro ? "Join the waitlist" : earlyAccess ? "Get early access" : "Send message"}
      </button>
    </form>
  );
}
