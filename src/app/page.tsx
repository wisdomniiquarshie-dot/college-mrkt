import { connection } from "next/server";
import { CampusFeed } from "@/components/marketplace/campus-feed";
import type { Listing } from "@/lib/marketplace";
import { getSupabaseServerClient } from "@/lib/supabase/server";

async function loadLiveMarketplace(): Promise<{
  listings: Listing[];
  sellerPhones: Record<string, string>;
  sellerAreas: Record<string, string>;
} | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  try {
    const activeListings = await supabase
      .from("listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    let { data, error } = activeListings;
    if (error && String(error.message ?? "").includes("listings.status")) {
      const legacyResult = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      data = legacyResult.data;
      error = legacyResult.error;
    }
    if (error) throw error;

    const listings = data ?? [];
    const sellerIds = [...new Set(listings.map((listing) => listing.seller_id))];
    const sellerPhones: Record<string, string> = {};
    const sellerAreas: Record<string, string> = {};

    if (sellerIds.length) {
      const { data: profiles, error: profilesError } = await supabase
        .from("public_seller_profiles")
        .select("id, whatsapp_number, campus_area")
        .in("id", sellerIds);

      if (!profilesError) {
        profiles?.forEach((profile) => {
          sellerPhones[profile.id] = profile.whatsapp_number ?? "";
          sellerAreas[profile.id] = profile.campus_area ?? "";
        });
      }
    }

    return { listings, sellerPhones, sellerAreas };
  } catch {
    return null;
  }
}

export default async function HomePage() {
  await connection();
  const marketplace = await loadLiveMarketplace();
  if (!marketplace) {
    return <CampusFeed listings={[]} sellerPhones={{}} sellerAreas={{}} connectionUnavailable />;
  }
  return <CampusFeed {...marketplace} connectionUnavailable={false} />;
}
