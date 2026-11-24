"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ACCOUNT_TYPES } from "@/lib/marketplace";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const applicantRoles = ["hostel_owner", "landlord", "property_manager", "authorised_agent"] as const;
const accommodationTypes = ["hostel", "apartment", "self_contained", "single_room", "shared_room", "other"] as const;

async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

function getRequiredText(formData: FormData, key: string, minLength: number, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  if (value.length < minLength || value.length > maxLength) throw new Error(`Check the ${key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`)} field.`);
  return value;
}

function getAccommodationFields(formData: FormData) {
  const propertyName = getRequiredText(formData, "propertyName", 2, 80);
  const accommodationType = String(formData.get("accommodationType") ?? "");
  const town = getRequiredText(formData, "town", 2, 100);
  const propertyAddress = getRequiredText(formData, "propertyAddress", 4, 300);
  const rent = Number(formData.get("rent"));
  const advancePaymentMonths = Number(formData.get("advancePaymentMonths"));
  const roomsRaw = String(formData.get("availableRooms") ?? "").trim();
  const availableRooms = roomsRaw ? Number(roomsRaw) : null;
  const amenities = String(formData.get("amenities") ?? "").split("\n").map((amenity) => amenity.trim()).filter(Boolean).slice(0, 30);
  const description = getRequiredText(formData, "description", 10, 1200);
  const contactPhone = getRequiredText(formData, "contactPhone", 7, 30);

  if (!(accommodationTypes as readonly string[]).includes(accommodationType)) throw new Error("Choose a property type.");
  if (!Number.isFinite(rent) || rent <= 0) throw new Error("Enter a rent greater than zero.");
  if (!Number.isInteger(advancePaymentMonths) || advancePaymentMonths < 0 || advancePaymentMonths > 36) throw new Error("Enter an advance-payment requirement from 0 to 36 months.");
  if (availableRooms !== null && (!Number.isInteger(availableRooms) || availableRooms < 0)) throw new Error("Available rooms must be zero or more.");

  return {
    title: propertyName,
    category: "Accommodation" as const,
    accommodation_type: accommodationType as typeof accommodationTypes[number],
    town,
    property_address: propertyAddress,
    price: rent,
    advance_payment_months: advancePaymentMonths,
    available_rooms: availableRooms,
    amenities,
    description,
    accommodation_contact_phone: contactPhone,
    condition: "New",
  };
}

function getImageFiles(formData: FormData) {
  return formData.getAll("photos").filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

async function uploadAccommodationPhotos(supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>, userId: string, files: File[]) {
  if (files.length > 3) throw new Error("Choose no more than 3 photos.");
  const paths: string[] = [];
  const urls: string[] = [];

  for (const file of files) {
    if (![["image/jpeg", "image/png", "image/webp"].includes(file.type), file.size <= 8 * 1024 * 1024].every(Boolean)) {
      throw new Error("Photos must be JPG, PNG, or WEBP and under 8 MB each.");
    }
    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("listing-images").upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    paths.push(path);
    urls.push(supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
  }

  return { paths, urls };
}

async function requireApprovedAdvertiser(supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>, userId: string) {
  const { data: application, error } = await supabase
    .from("accommodation_advertiser_applications")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || application?.status !== "approved") redirect("/accommodation/manage?error=approval-required");
  return application;
}

async function requireAccommodationSubscription(supabase: NonNullable<Awaited<ReturnType<typeof getSupabaseServerClient>>>, userId: string) {
  const now = new Date().toISOString();
  const { data: subscription, error } = await supabase
    .from("plan_subscriptions")
    .select("id, plan_key, listing_limit, price_ghs, status, starts_at, expires_at")
    .eq("user_id", userId)
    .eq("plan_key", "accommodation_advertiser")
    .eq("status", "active")
    .lte("starts_at", now)
    .gt("expires_at", now)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) redirect("/accommodation/manage?error=subscription-check-failed");
  return subscription;
}

export async function submitAccommodationApplicationAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/accommodation/manage?error=sign-in-required");

  const applicantName = getRequiredText(formData, "applicantName", 2, 100);
  const applicantRole = String(formData.get("applicantRole") ?? "");
  const phoneNumber = getRequiredText(formData, "phoneNumber", 7, 30);
  const whatsappNumber = getRequiredText(formData, "whatsappNumber", 7, 30);
  const businessName = getRequiredText(formData, "businessName", 2, 120);
  const town = getRequiredText(formData, "town", 2, 100);
  const propertyAddress = getRequiredText(formData, "propertyAddress", 4, 300);
  const description = getRequiredText(formData, "description", 10, 1500);
  const authorizationConfirmed = formData.get("authorizationConfirmed") === "on";

  if (!(applicantRoles as readonly string[]).includes(applicantRole) || !authorizationConfirmed) {
    redirect("/accommodation/manage?error=application-invalid");
  }

  const { data: existing, error: existingError } = await current.supabase
    .from("accommodation_advertiser_applications")
    .select("id, status")
    .eq("user_id", current.user.id)
    .maybeSingle();
  if (existingError) redirect("/accommodation/manage?error=application-save-failed");
  if (existing && !["pending", "rejected"].includes(existing.status)) {
    redirect("/accommodation/manage?error=application-already-reviewed");
  }

  const payload = {
    applicant_name: applicantName,
    applicant_role: applicantRole as typeof applicantRoles[number],
    phone_number: phoneNumber,
    whatsapp_number: whatsappNumber,
    business_name: businessName,
    town,
    property_address: propertyAddress,
    description,
    authorization_confirmed: true,
    status: "pending" as const,
  };
  const { error } = existing
    ? await current.supabase.from("accommodation_advertiser_applications").update({ ...payload, updated_at: new Date().toISOString() }).eq("user_id", current.user.id)
    : await current.supabase.from("accommodation_advertiser_applications").insert({ ...payload, user_id: current.user.id });
  if (error) redirect("/accommodation/manage?error=application-save-failed");

  revalidatePath("/accommodation/manage");
  revalidatePath("/admin");
  redirect("/accommodation/manage?application=pending");
}

export async function activateFreeAccommodationPlanAction() {
  const current = await getCurrentUser();
  if (!current) redirect("/accommodation/manage?error=sign-in-required");

  const { error } = await current.supabase.rpc("activate_free_accommodation_plan");
  if (error) redirect("/accommodation/manage?error=free-plan-activation-failed");

  revalidatePath("/accommodation/manage");
  revalidatePath("/pricing");
  redirect("/accommodation/manage?plan=active");
}

export async function createAccommodationListingAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/accommodation/manage?error=sign-in-required");
  await requireApprovedAdvertiser(current.supabase, current.user.id);

  let subscription = await requireAccommodationSubscription(current.supabase, current.user.id);
  if (!subscription) {
    const { data: plan, error: planError } = await current.supabase
      .from("marketplace_plan_settings")
      .select("price_ghs")
      .eq("plan_key", "accommodation_advertiser")
      .maybeSingle();
    if (!planError && Number(plan?.price_ghs) === 0) {
      const { error: activateError } = await current.supabase.rpc("activate_free_accommodation_plan");
      if (!activateError) subscription = await requireAccommodationSubscription(current.supabase, current.user.id);
    }
  }
  if (!subscription) redirect("/pricing?error=plan-unavailable#plan-accommodation_advertiser");

  const fields = getAccommodationFields(formData);
  const files = getImageFiles(formData);
  let uploadedPaths: string[] = [];
  try {
    const uploads = await uploadAccommodationPhotos(current.supabase, current.user.id, files);
    uploadedPaths = uploads.paths;
    const { error } = await current.supabase.from("listings").insert({
      ...fields,
      seller_id: current.user.id,
      image_urls: uploads.urls,
      status: "active",
      is_available: true,
      accommodation_status: "available",
    });
    if (error) throw error;
  } catch {
    if (uploadedPaths.length) await current.supabase.storage.from("listing-images").remove(uploadedPaths);
    redirect("/accommodation/manage?error=listing-save-failed");
  }

  revalidatePath("/accommodation");
  revalidatePath("/accommodation/manage");
  revalidatePath("/");
  redirect("/accommodation/manage?listing=created");
}

export async function updateAccommodationListingAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/accommodation/manage?error=sign-in-required");
  await requireApprovedAdvertiser(current.supabase, current.user.id);

  const listingId = String(formData.get("listingId") ?? "").trim();
  if (!listingId) redirect("/accommodation/manage?error=listing-not-found");
  const fields = getAccommodationFields(formData);
  const { error } = await current.supabase
    .from("listings")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("seller_id", current.user.id)
    .eq("category", "Accommodation");
  if (error) redirect("/accommodation/manage?error=listing-update-failed");

  revalidatePath("/accommodation");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/accommodation/manage");
  redirect("/accommodation/manage?listing=updated");
}

export async function setAccommodationListingStatusAction(formData: FormData) {
  const current = await getCurrentUser();
  if (!current) redirect("/accommodation/manage?error=sign-in-required");

  const listingId = String(formData.get("listingId") ?? "").trim();
  const status = String(formData.get("accommodationStatus") ?? "");
  if (!listingId || !["available", "paused", "unavailable", "rented"].includes(status)) {
    redirect("/accommodation/manage?error=listing-status-invalid");
  }

  const isAvailable = status === "available";
  const { error } = await current.supabase
    .from("listings")
    .update({
      accommodation_status: status as "available" | "paused" | "unavailable" | "rented",
      status: status === "rented" ? "sold" : "active",
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("seller_id", current.user.id)
    .eq("category", "Accommodation");
  if (error) redirect("/accommodation/manage?error=listing-status-update-failed");

  revalidatePath("/accommodation");
  revalidatePath(`/listings/${listingId}`);
  revalidatePath("/accommodation/manage");
  redirect("/accommodation/manage?listing=status-updated");
}