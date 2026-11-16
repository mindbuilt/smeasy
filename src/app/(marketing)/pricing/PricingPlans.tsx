"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { C, card, inkCard, button, pill, onInk } from "@/lib/mkt";
import { FREE_STAFF_LIMIT, PRICES, PRO_AVAILABLE, SIGNUP_HREF, SIGNUP_CTA_SHORT, type Interval } from "@/lib/site";

type Feature = { text: string; soon?: boolean };

const free: Feature[] = [
  { text: `Up to ${FREE_STAFF_LIMIT} staff` },
  { text: "Weekly roster builder with copy last week" },
  { text: "Day view that shows gaps in cover" },
  { text: "Role colours, shift notes and day notes" },
  { text: "Public holidays for your state" },
  { text: "Publish to a team link or printable PDF" },
  { text: "Personal links and calendar sync for staff" },
  { text: "Staff time-off requests" },
  { text: "Hours export (CSV) for payroll" },
  { text: "Staff get their shifts by email when you publish" },
];

const core: Feature[] = [
  { text: "Unlimited staff" },
  { text: "Timesheets: confirm the hours actually worked" },
  { text: "See when someone's rostered above their usual hours" },
  { text: "Priority email support" },
];

const pro: Feature[] = [
  { text: "Xero Payroll sync: send approved hours in one click" },
  { text: "MYOB sync", soon: true },
];

const price = { fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 } as const;
const tierName = { fontSize: 24, fontWeight: 800, letterSpacing: "-0.015em", margin: "0 0 2px" } as const;

function List({ items, lead, ink }: { items: Feature[]; lead?: string; ink?: boolean }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 11 }}>
      {lead && <li style={{ fontSize: 15, color: ink ? onInk : C.secondary }}>{lead}</li>}
      {items.map((f) => (
        <li key={f.text} style={{ fontSize: 15, color: ink ? "rgba(255,255,255,0.92)" : C.secondary, display: "flex", gap: 10, lineHeight: 1.4 }}>
          <Check size={18} strokeWidth={2.4} color={ink ? C.accent : "#65a30d"} style={{ flex: "none", marginTop: 1 }} aria-hidden />
          <span>
            {f.text}
            {f.soon && <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 999, whiteSpace: "nowrap",
              background: ink ? "rgba(255,255,255,0.12)" : "#eef0f3", color: ink ? onInk : C.secondary }}>Coming soon</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPlans() {
  const [interval, setBillingInterval] = useState<Interval>("month");
  const per = interval === "month" ? "/month" : "/year";
  const amount = (p: "core" | "pro") => `$${PRICES[p][interval]}`;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
        <div role="radiogroup" aria-label="Billing period" style={{ display: "inline-flex", padding: 4, borderRadius: 999, background: "#e9ecf0", gap: 2 }}>
          {(["month", "year"] as Interval[]).map((i) => (
            <button key={i} type="button" role="radio" aria-checked={interval === i} onClick={() => setBillingInterval(i)} className="app-press" style={{
              border: "none", borderRadius: 999, padding: "9px 18px", minHeight: 40, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
              background: interval === i ? C.dark : "transparent", color: interval === i ? C.white : C.secondary, transition: "background-color 180ms ease, color 180ms ease",
            }}>
              {i === "month" ? "Monthly" : <>Annual <span style={{ fontWeight: 600, opacity: 0.8 }}>· 2 months free</span></>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, alignItems: "start" }}>
        {/* Free */}
        <div style={{ ...card, padding: "28px 26px" }}>
          <span style={{ ...pill("lime"), marginBottom: 16 }}>No card needed</span>
          <h2 style={tierName}>Free</h2>
          <div style={{ fontSize: 15, color: C.secondary, marginBottom: 20 }}>For small teams</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
            <span style={price}>$0</span>
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 22, lineHeight: 1.45 }}>Free for good. No card needed.</div>
          <Link href={SIGNUP_HREF} className="app-press" style={{ ...button("secondary"), display: "flex", marginBottom: 22 }}>{SIGNUP_CTA_SHORT}</Link>
          <List items={free} />
        </div>

        {/* Plus: the page's one dark surface */}
        <div style={{ ...inkCard, padding: "28px 26px" }}>
          <span style={{ ...pill("lime"), marginBottom: 16 }}>Most popular</span>
          <h2 style={tierName}>Plus</h2>
          <div style={{ fontSize: 15, color: onInk, marginBottom: 20 }}>For growing teams</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
            <span style={price}>{amount("core")}</span>
            <span style={{ fontSize: 15, color: onInk }}>{per}</span>
          </div>
          <div style={{ fontSize: 14, color: onInk, marginBottom: 22, lineHeight: 1.45 }}>
            Plus GST. One flat price for unlimited staff.{interval === "year" && ` That's $${PRICES.core.month * 12 - PRICES.core.year} less than paying monthly.`}
          </div>
          <Link href={SIGNUP_HREF} className="app-press" style={{ ...button("onInk"), display: "flex", marginBottom: 22 }}>{SIGNUP_CTA_SHORT}</Link>
          <List items={core} lead="Everything in Free, plus:" ink />
        </div>

        {/* Pro */}
        <div style={{ ...card, padding: "28px 26px" }}>
          <span style={{ ...pill(PRO_AVAILABLE ? "lime" : "quiet"), marginBottom: 16 }}>{PRO_AVAILABLE ? "Payroll in one click" : "Coming soon"}</span>
          <h2 style={tierName}>Pro</h2>
          <div style={{ fontSize: 15, color: C.secondary, marginBottom: 20 }}>For payroll without the paperwork</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
            <span style={price}>{amount("pro")}</span>
            <span style={{ fontSize: 15, color: C.muted }}>{per}</span>
          </div>
          <div style={{ fontSize: 14, color: C.muted, marginBottom: 22, lineHeight: 1.45 }}>Plus GST. Unlimited staff.</div>
          <Link href={PRO_AVAILABLE ? SIGNUP_HREF : "/contact/?topic=pro"} className="app-press" style={{ ...button("secondary"), display: "flex", marginBottom: 22 }}>
            {PRO_AVAILABLE ? SIGNUP_CTA_SHORT : "Join the waitlist"}
          </Link>
          <List items={pro} lead="Everything in Plus, plus:" />
        </div>
      </div>
    </>
  );
}
