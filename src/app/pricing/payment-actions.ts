"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMarketplaceAdminSession } from "@/lib/marketplace-admin";

async function getAdminSession() {
  const admin = await getMarketplaceAdminSession();
  return admin ? { supabase: admin.supabase, userId: admin.user.id } : null;
}

export async function savePaymentSettingsAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const network = String(formData.get("network") ?? "").trim();
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const recipientNumber = String(formData.get("recipientNumber") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  if (!network || !recipientNumber) redirect("/admin?error=invalid-payment-settings");

  const { error } = await admin.supabase.from("marketplace_payment_settings").upsert({
    id: true,
    network,
    recipient_name: recipientName,
    recipient_number: recipientNumber,
    instructions,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" });

  if (error) redirect("/admin?error=payment-settings-save-failed");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  redirect("/admin?success=payment-settings-saved");
}

function getServiceDates(billingPeriod: string) {
  const start = new Date();
  const end = new Date(start);
  const period = billingPeriod.toLowerCase();

  if (period.includes("week")) end.setUTCDate(end.getUTCDate() + 7);
  else if (period.includes("quarter")) end.setUTCMonth(end.getUTCMonth() + 3);
  else if (period.includes("year") || period.includes("annual")) end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function verifyPaymentRequestAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const requestId = String(formData.get("requestId") ?? "").trim();
  const { data: request, error: requestError } = await admin.supabase
    .from("payment_requests")
    .select("plan_snapshot")
    .eq("id", requestId)
    .eq("verification_status", "pending")
    .maybeSingle();
  if (!requestId || requestError || !request) redirect("/admin?error=payment-request-not-found");

  const billingPeriod = String(request.plan_snapshot.billing_period ?? "monthly");
  const dates = getServiceDates(billingPeriod);
  const { data, error } = await admin.supabase
    .from("payment_requests")
    .update({
      verification_status: "verified",
      verified_by: admin.userId,
      service_start_date: dates.start,
      service_end_date: dates.end,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("verification_status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/admin?error=payment-verification-failed");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  redirect("/admin?success=payment-verified");
}

export async function rejectPaymentRequestAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const requestId = String(formData.get("requestId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!requestId || !reason) redirect("/admin?error=payment-rejection-reason-required");

  const { data, error } = await admin.supabase
    .from("payment_requests")
    .update({
      verification_status: "rejected",
      verified_by: admin.userId,
      notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("verification_status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) redirect("/admin?error=payment-rejection-failed");
  revalidatePath("/admin");
  revalidatePath("/pricing");
  redirect("/admin?success=payment-rejected");
}