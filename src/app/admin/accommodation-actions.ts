"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMarketplaceAdminSession } from "@/lib/marketplace-admin";

async function getAdminSession() {
  const admin = await getMarketplaceAdminSession();
  return admin ? { supabase: admin.supabase, userId: admin.user.id } : null;
}

export async function reviewAccommodationApplicationAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const status = String(formData.get("status") ?? "");
  const adminNotes = String(formData.get("adminNotes") ?? "").trim();
  if (!applicationId || !["approved", "rejected", "suspended"].includes(status)) {
    redirect("/admin?error=accommodation-review-invalid");
  }

  const { data, error } = await admin.supabase
    .from("accommodation_advertiser_applications")
    .update({
      status: status as "approved" | "rejected" | "suspended",
      admin_notes: adminNotes || null,
      reviewed_by: admin.userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select("id, user_id, status")
    .maybeSingle();

  if (error || !data) redirect("/admin?error=accommodation-review-failed");
  if (data.status === "suspended") {
    const { error: hideError } = await admin.supabase
      .from("listings")
      .update({ status: "hidden", is_available: false, accommodation_status: "unavailable", updated_at: new Date().toISOString() })
      .eq("seller_id", data.user_id)
      .eq("category", "Accommodation");
    if (hideError) redirect("/admin?error=accommodation-suspend-listings-failed");
  }

  revalidatePath("/admin");
  revalidatePath("/accommodation");
  revalidatePath("/accommodation/manage");
  redirect("/admin?success=accommodation-reviewed");
}

export async function moderateAccommodationListingAction(formData: FormData) {
  const admin = await getAdminSession();
  if (!admin) redirect("/admin?error=access-denied");

  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!listingId) redirect("/admin?error=accommodation-listing-id-required");

  const { error } = await admin.supabase
    .from("listings")
    .update({ status: "hidden", is_available: false, accommodation_status: "unavailable", updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("category", "Accommodation");
  if (error) redirect("/admin?error=accommodation-moderation-failed");

  revalidatePath("/admin");
  revalidatePath("/accommodation");
  revalidatePath(`/listings/${listingId}`);
  redirect("/admin?success=accommodation-listing-hidden");
}