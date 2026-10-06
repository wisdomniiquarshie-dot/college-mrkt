import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/marketplace/listing-detail";
import { DEMO_LISTINGS, DEMO_SELLER, type ListingWithSeller } from "@/lib/marketplace";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ListingPageProps = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  if (!supabase && id.startsWith("demo-")) {
    const listing = DEMO_LISTINGS.find((item) => item.id === id);
    if (!listing) notFound();
    return <ListingDetail listing={{ ...listing, seller: DEMO_SELLER }} />;
  }

  if (!supabase) notFound();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !listing) notFound();

  const { data: seller } = await supabase
    .from("seller_profiles")
    .select("*")
    .eq("id", listing.seller_id)
    .maybeSingle();

  const listingWithSeller: ListingWithSeller = { ...listing, seller };
  return <ListingDetail listing={listingWithSeller} />;
}
