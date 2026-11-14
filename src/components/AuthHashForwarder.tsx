"use client";

import { useEffect } from "react";

// Backstop: if Supabase falls back to the Site URL, an email link lands on the
// home page with the session (or an error) in the hash. Hand it to the right page.
export default function AuthHashForwarder() {
  useEffect(() => {
    const h = window.location.hash;
    if (!/[#&](access_token|error)=/.test(h)) return;
    const page = /[#&]type=recovery(&|$)/.test(h) ? "/auth/reset/" : "/auth/callback/";
    window.location.replace(`${page}${h}`);
  }, []);
  return null;
}
