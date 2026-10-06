import type { Listing, SellerProfile } from "@/lib/marketplace";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ListingInsert = Omit<Listing, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
};

type SellerProfileInsert = Omit<SellerProfile, "id"> & { id: string };

type Report = {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      listings: Table<Listing, ListingInsert, Partial<ListingInsert>>;
      seller_profiles: Table<SellerProfile, SellerProfileInsert, Partial<SellerProfileInsert>>;
      listing_reports: Table<Report, Omit<Report, "id" | "created_at">, never>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
