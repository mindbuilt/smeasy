"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/pricing/", label: "Pricing" },
  { href: "/guides/", label: "Guides" },
  { href: "/faq/", label: "FAQ" },
];

/** Top nav on public pages: the app's top-nav treatment, active item on a divider fill. */
export default function MarketingNav() {
  const path = usePathname() ?? "/";
  return (
    <nav className="mkt-nav" aria-label="Main" style={{ display: "flex", gap: 2 }}>
      {ITEMS.map((i) => {
        const on = path === i.href.slice(0, -1) || path.startsWith(i.href); // "/guides", "/guides/", "/guides/x/"
        return <Link key={i.href} href={i.href} className="mkt-navlink" aria-current={on ? "page" : undefined}>{i.label}</Link>;
      })}
    </nav>
  );
}
