import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export const MARKETPLACE_ADMIN_EMAIL = "wisdomniiquarshie@gmail.com";

export async function getMarketplaceAdminSession() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || user?.email?.toLowerCase() !== MARKETPLACE_ADMIN_EMAIL) return null;

    return { supabase, user };
  } catch {
    return null;
  }
}
