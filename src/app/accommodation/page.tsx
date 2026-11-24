import { AccommodationFeed } from "@/components/marketplace/accommodation-feed";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/marketplace";

export default async function AccommodationPage() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return <AccommodationFeed listings={[]} connectionUnavailable />;

  let listingResult = await supabase
    .from("listings")
    .select("*")
    .eq("category", "Accommodation")
    .neq("status", "hidden")
    .order("created_at", { ascending: false });
  let { data, error } = listingResult;
  if (error && String(error.message ?? "").includes("listings.status")) {
    listingResult = await supabase
      .from("listings")
      .select("*")
      .eq("category", "Accommodation")
      .order("created_at", { ascending: false });
    data = listingResult.data;
    error = listingResult.error;
  }

  return <AccommodationFeed listings={(error ? [] : data ?? []) as Listing[]} connectionUnavailable={Boolean(error)} />;
}