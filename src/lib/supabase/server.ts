import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function getSupabaseServerClient(): Promise<SupabaseClient<Database> | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    const cookieStore = await cookies();
    return createServerClient<Database>(config.url, config.key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });
  } catch {
    return null;
  }
}
