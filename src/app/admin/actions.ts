"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMarketplaceAdminSession } from "@/lib/marketplace-admin";

async function getAdminSession() {
  const admin = await getMarketplaceAdminSession();
  return admin ? { supabase: admin.supabase, userId: admin.user.id } : null;
}

export async function hideListingAction(formData: FormData) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect("/admin?error=access-denied");
  }

  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!listingId) {
    redirect("/admin?error=missing-listing");
  }

  const { error } = await adminSession.supabase
    .from("listings")
    .update({ status: "hidden", is_available: false, updated_at: new Date().toISOString() })
    .eq("id", listingId);

  if (error) {
    redirect("/admin?error=hide-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function resolveReportAction(formData: FormData) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    redirect("/admin?error=access-denied");
  }

  const reportId = String(formData.get("reportId") ?? "").trim();
  if (!reportId) {
    redirect("/admin?error=missing-report");
  }

  const { error } = await adminSession.supabase.from("listing_reports").delete().eq("id", reportId);
  if (error) {
    redirect("/admin?error=resolve-failed");
  }

  revalidatePath("/admin");
  redirect("/admin");
}
