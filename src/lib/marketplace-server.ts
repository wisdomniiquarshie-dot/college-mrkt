import "server-only";

import { PLAN_DEFINITIONS, toPlanDefinition, type MarketplacePaymentSettings, type PlanDefinition } from "@/lib/marketplace";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getAvailablePlanDefinitions(): Promise<PlanDefinition[] | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return PLAN_DEFINITIONS;

  const { data, error } = await supabase
    .from("marketplace_plan_settings")
    .select("*")
    .order("price_ghs", { ascending: true });

  if (error || !data) return PLAN_DEFINITIONS;

  const now = Date.now();
  return data
    .map((plan) => ({ ...toPlanDefinition(plan), price: 0 }))
    .filter((plan) => (
      plan.isActive
      && plan.availableForPurchase
      && (!plan.effectiveStart || new Date(plan.effectiveStart).getTime() <= now)
      && (!plan.effectiveEnd || new Date(plan.effectiveEnd).getTime() > now)
    ));
}

export async function getMarketplacePaymentSettings(): Promise<MarketplacePaymentSettings | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("marketplace_payment_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();

  return error ? null : data;
}