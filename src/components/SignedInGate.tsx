"use client";

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Shows `children` only to a signed-in visitor (the test account), and
 * `fallback` to everyone else. Renders `fallback` until the session check
 * finishes, so the static HTML always contains the fallback.
 */
export default function SignedInGate({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase().auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) setSignedIn(true);
    });
    return () => { cancelled = true; };
  }, []);

  return <>{signedIn ? children : fallback}</>;
}
