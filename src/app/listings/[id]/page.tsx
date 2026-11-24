import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/marketplace/listing-detail";
import type { ListingWithSeller } from "@/lib/marketplace";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ListingPageProps = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) notFound();

  let listingResult = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();
  let { data: listing, error } = listingResult;
  if (error && String(error.message ?? "").includes("listings.status")) {
    listingResult = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    listing = listingResult.data;
    error = listingResult.error;
  }
  if (error || !listing) notFound();

  const { data: seller } = await supabase
    .from("public_seller_profiles")
    .select("id, full_name, campus_area, whatsapp_number")
    .eq("id", listing.seller_id)
    .maybeSingle();

  const listingWithSeller: ListingWithSeller = { ...listing, seller };
  return <ListingDetail listing={listingWithSeller} />;
}
