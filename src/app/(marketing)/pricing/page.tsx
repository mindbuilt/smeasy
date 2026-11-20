import type { Metadata } from "next";
import Link from "next/link";
import { C, pageTitle, lead, link } from "@/lib/mkt";
import { BETA_PAID_FROM, FREE_STAFF_LIMIT, OPEN_BETA, PRICES } from "@/lib/site";
import PricingPlans from "./PricingPlans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    OPEN_BETA
      ? `Flat-rate rostering for Australian small businesses. Every feature is free during the open beta; paid plans won't start before ${BETA_PAID_FROM}.`
      : `Flat-rate rostering for Australian small businesses. Free for up to ${FREE_STAFF_LIMIT} staff. Plus is $${PRICES.core.month} a month plus GST for unlimited staff.`,
  alternates: { canonical: "/pricing/" },
};

export default function PricingPage() {
  return (
    <section style={{ maxWidth: 1040, margin: "0 auto", padding: "64px 20px 0" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h1 style={{ ...pageTitle, margin: "0 0 12px" }}>
          Flat-rate pricing. Unlimited staff. No per-user fees.
        </h1>
        <p style={lead}>
          {OPEN_BETA
            ? <>SMEasy is in open beta, so <strong style={{ color: C.dark }}>every plan is free for now</strong>. Here&apos;s what we plan to charge, so there are no surprises later.</>
            : <>One price per business, not per person. Free for teams of up to {FREE_STAFF_LIMIT}.</>}
        </p>
        {OPEN_BETA && (
          <p style={{ fontSize: 15, color: C.secondary, margin: "10px auto 0", maxWidth: 600, lineHeight: 1.55 }}>
            Paid plans won&apos;t start before {BETA_PAID_FROM}. Beta businesses get at least 30 days&apos; notice before any billing starts, plus a founder discount.
          </p>
        )}
      </div>

      <PricingPlans />

      <div style={{ textAlign: "center", marginTop: 40, fontSize: 15, color: C.secondary, lineHeight: 1.6, maxWidth: 640, marginLeft: "auto", marginRight: "auto" }}>
        <p style={{ margin: "0 0 8px" }}>{OPEN_BETA ? "Planned prices are in Australian dollars, plus GST. One price per business, not per person." : "Prices are in Australian dollars, plus GST. One price per business, cancel any time."}</p>
        <p style={{ margin: 0 }}>
          Questions? Read the <Link href="/faq/" style={link}>FAQ</Link> or <a href="mailto:hello@smeasy.au" style={link}>get in touch</a>.
        </p>
      </div>
    </section>
  );
}
