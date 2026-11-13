"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import type { Business } from "./types";

/**
 * Guards manager pages. Sends signed-out visitors to /auth/login and
 * signed-in managers without a business to /welcome.
 */
export function useManager() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sb = supabase();
      const { data: { session } } = await sb.auth.getSession();
      if (!session) { router.replace("/auth/login"); return; }
      const { data } = await sb.from("businesses").select("*").maybeSingle();
      if (cancelled) return;
      if (!data) { router.replace("/welcome"); return; }
      setEmail(session.user.email ?? "");
      setBusiness(data);
    })();
    return () => { cancelled = true; };
  }, [router]);

  return { business, setBusiness, email };
}

export async function signOut() {
  await supabase().auth.signOut();
  window.location.href = "/auth/login";
}
