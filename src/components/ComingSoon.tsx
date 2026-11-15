import Link from "next/link";
import { C } from "@/lib/theme";

const wrap = { maxWidth: 1080, margin: "0 auto", padding: "0 20px" } as const;

/** Homepage stand-in shown to visitors while SMEasy is still in testing. */
export default function ComingSoon() {
  return (
    <section style={{ ...wrap, padding: "120px 20px 140px", textAlign: "center" }}>
      <div style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: C.shiftText, background: C.shiftBg, border: `1px solid ${C.shiftBorder}`, borderRadius: 999, padding: "4px 12px", marginBottom: 20 }}>
        Coming soon
      </div>
      <h1 style={{ fontSize: "clamp(32px, 6vw, 52px)", lineHeight: 1.1, fontWeight: 700, margin: "0 auto 18px", maxWidth: 760, letterSpacing: "-0.02em" }}>
        Simple staff rostering, coming soon.
      </h1>
      <p style={{ fontSize: "clamp(16px, 2.2vw, 19px)", color: C.secondary, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.55 }}>
        SMEasy is being built for small Australian businesses. We&apos;re still testing, so we&apos;re not taking sign-ups yet.
      </p>
      <Link href="/contact/" style={{ background: C.dark, color: C.white, padding: "14px 26px", borderRadius: C.r1, textDecoration: "none", fontSize: 16, fontWeight: 600 }}>Get in touch</Link>
      <p style={{ fontSize: 14, color: C.muted, marginTop: 18 }}>Read the <Link href="/guides/" style={{ color: C.secondary }}>rostering guides</Link> in the meantime.</p>
    </section>
  );
}
