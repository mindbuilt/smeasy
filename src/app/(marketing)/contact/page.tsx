import type { Metadata } from "next";
import Link from "next/link";
import { C, pageTitle, lead, link } from "@/lib/mkt";
import { CONTACT_EMAIL } from "@/lib/site";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about rostering with SMEasy, help with your account, or a feature you'd like to see? Send us a message.",
  alternates: { canonical: "/contact/" },
};

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "56px 20px 0" }}>
      <h1 style={{ ...pageTitle, margin: "0 0 12px" }}>Get in touch</h1>
      <p style={{ ...lead, fontSize: 17, margin: "0 0 28px" }}>
        A question about SMEasy, help with your account, or something you&apos;d like it to do? Send us a message and we&apos;ll reply by email, usually within one business day.
        You might find a quick answer in the <Link href="/faq/" style={link}>FAQ</Link>.
      </p>
      <ContactForm />
      <p style={{ fontSize: 14, color: C.muted, margin: "20px 0 0", lineHeight: 1.55 }}>
        Prefer email? Write to <a href={`mailto:${CONTACT_EMAIL}`} style={{ ...link, color: C.secondary }}>{CONTACT_EMAIL}</a>.
        To delete your account, use either and we&apos;ll do it within 30 days. See our <Link href="/privacy/" style={{ ...link, color: C.secondary }}>privacy policy</Link>.
      </p>
    </div>
  );
}
