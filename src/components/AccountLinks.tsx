"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { C, button } from "@/lib/mkt";
import { SIGNUP_HREF, SIGNUP_CTA_SHORT } from "@/lib/site";

// Ink, not lime: the page's own hero or closing button is the one lime action.
const primary = button("primary", "md");

/** Header links on public pages: "Log in / Get started", or "Open SMEasy" when already logged in. */
export default function AccountLinks() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase().auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setSignedIn(true);
    });
    return () => { cancelled = true; };
  }, []);

  if (signedIn) return <Link href="/week/" className="app-press" style={primary}>Open SMEasy</Link>;
  return (
    <>
      <Link href="/auth/login/" className="mkt-navlink" style={{ color: C.secondary }}>Log in</Link>
      <Link href={SIGNUP_HREF} className="app-press" style={primary}>{SIGNUP_CTA_SHORT}</Link>
    </>
  );
}
