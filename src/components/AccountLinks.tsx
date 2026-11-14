"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { C } from "@/lib/theme";

const primary = { background: C.dark, color: C.white, padding: "9px 16px", borderRadius: C.r1, textDecoration: "none", fontSize: 14, fontWeight: 600 } as const;

/** Header links on public pages: "Log in / Get started", or "Go to my roster" when already logged in. */
export default function AccountLinks() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase().auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setSignedIn(true);
    });
    return () => { cancelled = true; };
  }, []);

  if (signedIn) return <Link href="/week/" style={primary}>Go to my roster</Link>;
  return (
    <>
      <Link href="/auth/login/" style={{ color: C.secondary, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>Log in</Link>
      <Link href="/auth/login/?signup" style={primary}>Get started</Link>
    </>
  );
}
