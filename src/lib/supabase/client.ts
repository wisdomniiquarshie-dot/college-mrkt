import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (
    !url ||
    !key ||
    /your_supabase|paste_your|your_project|your_key/i.test(url) ||
    /your_supabase|paste_your|your_project|your_key/i.test(key)
  ) {
    return null;
  }

  browserClient ??= createBrowserClient<Database>(url, key);
  return browserClient;
}
