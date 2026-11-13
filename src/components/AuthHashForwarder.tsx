"use client";

import { useEffect } from "react";

// Backstop: if Supabase falls back to the Site URL, a login link lands on the
// home page with the session (or an error) in the hash. Hand it to the callback.
export default function AuthHashForwarder() {
  useEffect(() => {
    const h = window.location.hash;
    if (/[#&](access_token|error)=/.test(h)) window.location.replace(`/auth/callback/${h}`);
  }, []);
  return null;
}
