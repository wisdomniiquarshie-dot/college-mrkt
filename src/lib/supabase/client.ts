import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  const config = getSupabaseConfig();
  if (!config) return null;

  try {
    browserClient ??= createBrowserClient<Database>(config.url, config.key);
  } catch {
    return null;
  }
  return browserClient;
}

export function getSupabaseErrorMessage(error: unknown, fallback: string) {
  const errorDetails = typeof error === "object" && error !== null
    ? error as Record<string, unknown>
    : null;
  const message = error instanceof Error
    ? error.message
    : typeof errorDetails?.message === "string"
      ? errorDetails.message
      : typeof errorDetails?.error === "string"
        ? errorDetails.error
        : "";
  if (error instanceof TypeError || /failed to fetch|networkerror|fetch failed|load failed/i.test(message)) {
    return "Could not reach Supabase. Check that .env.local has the active Project URL and matching public key, then restart the app.";
  }
  if (/nosuchbucket|bucket not found/i.test(message)) {
    return "Listing photo storage is not set up in Supabase yet. Run supabase/schema.sql in the Supabase SQL Editor, then try again.";
  }
  return message || fallback;
}
