import type { AccommodationAdvertiserApplication, Listing, MarketplacePaymentSettings, MarketplacePlan, PlanSubscription, PublicSellerProfile, SellerProfile } from "@/lib/marketplace";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type ListingInsert = Omit<Listing, "id" | "created_at"> & {
  id?: string;
  created_at?: string;
  status?: string;
  is_available?: boolean;
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

type PaymentRequest = {
  id: string;
  user_id: string;
  plan_key: string;
  plan_name: string;
  amount_ghs: number;
  payment_method: string;
  payment_reference: string | null;
  payment_date: string | null;
  plan_snapshot: Record<string, unknown>;
  verification_status: "pending" | "verified" | "rejected";
  verified_by: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      listings: Table<Listing, ListingInsert, Partial<ListingInsert>>;
      accommodation_advertiser_applications: Table<
        AccommodationAdvertiserApplication,
        Omit<AccommodationAdvertiserApplication, "id" | "created_at" | "updated_at" | "reviewed_by" | "reviewed_at" | "admin_notes"> & { id?: string; status?: "pending" },
        Partial<Pick<AccommodationAdvertiserApplication, "applicant_name" | "applicant_role" | "phone_number" | "whatsapp_number" | "business_name" | "town" | "property_address" | "description" | "authorization_confirmed" | "status" | "admin_notes" | "reviewed_by" | "reviewed_at" | "updated_at">>
      >;
      seller_profiles: Table<SellerProfile, SellerProfileInsert, Partial<SellerProfileInsert>>;
      listing_reports: Table<Report, Omit<Report, "id" | "created_at">, never>;
      marketplace_plan_settings: Table<MarketplacePlan, Omit<MarketplacePlan, "id" | "created_at" | "updated_at">, Partial<Omit<MarketplacePlan, "id" | "created_at">>>;
      marketplace_payment_settings: Table<
        MarketplacePaymentSettings,
        Omit<MarketplacePaymentSettings, "updated_at"> & { updated_at?: string },
        Partial<MarketplacePaymentSettings>
      >;
      plan_subscriptions: Table<
        PlanSubscription,
        Omit<PlanSubscription, "id" | "created_at" | "updated_at" | "payment_request_id"> & { payment_request_id?: string | null },
        Partial<Omit<PlanSubscription, "id" | "created_at" | "payment_request_id">>
      >;
      subscription_plan_changes: Table<
        { id: string; subscription_id: string; changed_by: string; reason: string; before_snapshot: Record<string, unknown>; after_snapshot: Record<string, unknown>; created_at: string },
        Omit<{ id: string; subscription_id: string; changed_by: string; reason: string; before_snapshot: Record<string, unknown>; after_snapshot: Record<string, unknown>; created_at: string }, "id" | "created_at">,
        never
      >;
      payment_requests: Table<
        PaymentRequest,
        Omit<PaymentRequest, "id" | "created_at" | "updated_at">,
        Partial<Omit<PaymentRequest, "id" | "created_at">>
      >;
      admin_audit_log: Table<AuditLog, Omit<AuditLog, "id" | "created_at">, Partial<Omit<AuditLog, "id" | "created_at">>>;
    };
    Views: {
      public_seller_profiles: {
        Row: PublicSellerProfile;
        Relationships: [];
      };
    };
    Functions: {
      activate_free_accommodation_plan: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
