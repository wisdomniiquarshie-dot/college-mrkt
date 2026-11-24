"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/marketplace";
import { getMarketplaceAdminSession } from "@/lib/marketplace-admin";

async function getAdminSession() {
  const admin = await getMarketplaceAdminSession();
  return admin ? { supabase: admin.supabase, userId: admin.user.id } : null;
}

function numberValue(formData: FormData, key: string): number;
function numberValue(formData: FormData, key: string, allowEmpty: true): number | null;
function numberValue(formData: FormData, key: string, allowEmpty = false): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (allowEmpty && !raw) return null;
  if (!raw) redirect("/admin?error=invalid-plan");
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) redirect("/admin?error=invalid-plan");
  return value;
}

function dateValue(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = key === "effectiveEnd" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? `${raw}T23:59:59.999Z`
    : raw;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Enter a valid date for ${key}.`);
  return date.toISOString();
}

export async function savePlanAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const planId = String(formData.get("planId") ?? "").trim();
  const planName = String(formData.get("planName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const billingPeriod = String(formData.get("billingPeriod") ?? "").trim();
  const subscriptionStatus = String(formData.get("subscriptionStatus") ?? "");
  const benefits = String(formData.get("benefits") ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
  const minProposedPrice = numberValue(formData, "minProposedPrice", true);
  const maxProposedPrice = numberValue(formData, "maxProposedPrice", true);
  const listingLimit = numberValue(formData, "listingLimit");
  const promotionDurationDays = numberValue(formData, "promotionDurationDays");
  const aiGenerationLimit = numberValue(formData, "aiGenerationLimit");
  const effectiveStart = dateValue(formData, "effectiveStart");
  const effectiveEnd = dateValue(formData, "effectiveEnd");

  if (!planId || !planName || !description || !billingPeriod || !["active", "inactive"].includes(subscriptionStatus)) {
    redirect("/admin?error=invalid-plan");
  }
  if (listingLimit < 1) redirect("/admin?error=invalid-plan");
  if (minProposedPrice !== null && maxProposedPrice !== null && minProposedPrice > maxProposedPrice) {
    redirect("/admin?error=invalid-plan-range");
  }
  if (effectiveStart && effectiveEnd && new Date(effectiveEnd) <= new Date(effectiveStart)) {
    redirect("/admin?error=invalid-plan-dates");
  }

  const { error } = await admin.supabase
    .from("marketplace_plan_settings")
    .update({
      plan_name: planName,
      description,
      price_ghs: 0,
      min_proposed_price: minProposedPrice,
      max_proposed_price: maxProposedPrice,
      billing_period: billingPeriod,
      listing_limit: listingLimit,
      promotion_duration_days: promotionDurationDays,
      benefits,
      ai_generation_limit: aiGenerationLimit,
      effective_start: effectiveStart,
      effective_end: effectiveEnd,
      subscription_status: subscriptionStatus as "active" | "inactive",
      is_active: formData.get("isActive") === "on",
      promotion_available: formData.get("promotionAvailable") === "on",
      available_for_purchase: formData.get("availableForPurchase") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (error) redirect("/admin?error=plan-save-failed");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  revalidatePath("/listings/new");
  redirect("/admin?success=plan-saved");
}

export async function createSubscriptionAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const userId = String(formData.get("userId") ?? "").trim();
  const planKey = String(formData.get("planKey") ?? "").trim() as AccountType;
  const startsAt = dateValue(formData, "startsAt");
  const expiresAt = dateValue(formData, "expiresAt");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!userId || !ACCOUNT_TYPES.some(({ value }) => value === planKey) || !startsAt || !expiresAt || !reason || !["pending", "active", "expired", "cancelled"].includes(status)) {
    redirect("/admin?error=invalid-subscription");
  }
  if (new Date(expiresAt) <= new Date(startsAt)) redirect("/admin?error=invalid-subscription-dates");

  const { data: plan, error: planError } = await admin.supabase
    .from("marketplace_plan_settings")
    .select("*")
    .eq("plan_key", planKey)
    .maybeSingle();
  if (planError || !plan) redirect("/admin?error=subscription-plan-unavailable");

  const { error } = await admin.supabase.from("plan_subscriptions").insert({
    user_id: userId,
    plan_key: plan.plan_key,
    plan_name: plan.plan_name,
    price_ghs: plan.price_ghs,
    billing_period: plan.billing_period,
    listing_limit: plan.listing_limit,
    promotion_duration_days: plan.promotion_duration_days,
    benefits: plan.benefits,
    ai_generation_limit: plan.ai_generation_limit,
    promotion_available: plan.promotion_available,
    starts_at: startsAt,
    expires_at: expiresAt,
    status: status as "pending" | "active" | "expired" | "cancelled",
    change_reason: reason,
  });
  if (error) redirect("/admin?error=subscription-create-failed");
  revalidatePath("/admin");
  redirect("/admin?success=subscription-created");
}

export async function updateSubscriptionAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const subscriptionId = String(formData.get("subscriptionId") ?? "").trim();
  const startsAt = dateValue(formData, "startsAt");
  const expiresAt = dateValue(formData, "expiresAt");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!subscriptionId || !startsAt || !expiresAt || !reason || !["pending", "active", "expired", "cancelled"].includes(status)) {
    redirect("/admin?error=invalid-subscription");
  }
  if (new Date(expiresAt) <= new Date(startsAt)) redirect("/admin?error=invalid-subscription-dates");

  const { error } = await admin.supabase
    .from("plan_subscriptions")
    .update({
      starts_at: startsAt,
      expires_at: expiresAt,
      status: status as "pending" | "active" | "expired" | "cancelled",
      change_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);
  if (error) redirect("/admin?error=subscription-update-failed");
  revalidatePath("/admin");
  redirect("/admin?success=subscription-updated");
}

export async function changeSubscriptionPlanAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const subscriptionId = String(formData.get("subscriptionId") ?? "").trim();
  const planKey = String(formData.get("planKey") ?? "").trim() as AccountType;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!subscriptionId || !ACCOUNT_TYPES.some(({ value }) => value === planKey) || reason.length < 8) redirect("/admin?error=subscription-change-reason-required");

  const { data: plan, error: planError } = await admin.supabase
    .from("marketplace_plan_settings")
    .select("*")
    .eq("plan_key", planKey)
    .maybeSingle();
  if (planError || !plan) redirect("/admin?error=subscription-plan-unavailable");

  const { error } = await admin.supabase
    .from("plan_subscriptions")
    .update({
      plan_key: plan.plan_key,
      plan_name: plan.plan_name,
      price_ghs: plan.price_ghs,
      billing_period: plan.billing_period,
      listing_limit: plan.listing_limit,
      promotion_duration_days: plan.promotion_duration_days,
      benefits: plan.benefits,
      ai_generation_limit: plan.ai_generation_limit,
      promotion_available: plan.promotion_available,
      change_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);
  if (error) redirect("/admin?error=subscription-plan-change-failed");
  revalidatePath("/admin");
  redirect("/admin?success=subscription-plan-changed");
}
