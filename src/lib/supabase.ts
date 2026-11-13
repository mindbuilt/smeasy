import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

// Lazy so a missing env var fails at runtime with a clear message,
// not during static prerendering.
export function supabase(): SupabaseClient<Database> {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not set");
  client = createClient<Database>(url, key, {
    auth: {
      // Implicit flow so a magic link requested on a laptop still works
      // when it's opened on a phone (PKCE needs the same browser).
      flowType: "implicit",
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}
