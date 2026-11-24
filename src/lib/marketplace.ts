export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Hostel Gear",
  "Textbooks",
  "Food and Drinks",
  "Beauty and Personal Care",
  "Accessories",
  "Furniture",
  "Services",
  "Accommodation",
  "Other",
] as const;

export const CONDITIONS = ["New", "Like New", "Fair", "Refurbished"] as const;

export type Category = (typeof CATEGORIES)[number];
export type ItemCondition = (typeof CONDITIONS)[number];

export const ACCOUNT_TYPES = [
  { value: "student_seller", label: "Average student" },
  { value: "student_business", label: "Student business owner" },
  { value: "campus_business", label: "Business around campus" },
  { value: "accommodation_advertiser", label: "Accommodation advertiser" },
  { value: "regular_advertiser", label: "Regular advertiser" },
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number]["value"];

export const ADMIN_ROLES = ["admin", "moderator"] as const;
export type SellerRole = (typeof ADMIN_ROLES)[number] | "student";

export type PlanDefinition = {
  key: AccountType;
  name: string;
  price: number;
  listingLimit: number;
  description: string;
  details: string[];
  minProposedPrice: number | null;
  maxProposedPrice: number | null;
  billingPeriod: string;
  promotionDurationDays: number;
  aiGenerationLimit: number;
  effectiveStart: string | null;
  effectiveEnd: string | null;
  isActive: boolean;
  promotionAvailable: boolean;
  availableForPurchase: boolean;
};

export type PaymentVerificationStatus = "pending" | "verified" | "rejected";

export type MarketplacePlan = {
  id: string;
  plan_key: AccountType;
  plan_name: string;
  description: string | null;
  price_ghs: number;
  min_proposed_price: number | null;
  max_proposed_price: number | null;
  billing_period: string;
  listing_limit: number;
  promotion_duration_days: number;
  benefits: string[];
  ai_generation_limit: number;
  effective_start: string | null;
  effective_end: string | null;
  subscription_status: "active" | "inactive";
  promotion_available: boolean;
  available_for_purchase: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PlanSubscription = {
  id: string;
  payment_request_id: string | null;
  user_id: string;
  plan_key: AccountType;
  plan_name: string;
  price_ghs: number;
  billing_period: string;
  listing_limit: number;
  promotion_duration_days: number;
  benefits: string[];
  ai_generation_limit: number;
  promotion_available: boolean;
  starts_at: string;
  expires_at: string;
  status: "pending" | "active" | "expired" | "cancelled";
  change_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentRequest = {
  id: string;
  user_id: string;
  plan_key: string;
  plan_name: string;
  amount_ghs: number;
  payment_method: string;
  payment_reference: string | null;
  payment_date: string | null;
  plan_snapshot: Record<string, unknown>;
  verification_status: PaymentVerificationStatus;
  verified_by: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type MarketplacePaymentSettings = {
  id: boolean;
  network: string;
  recipient_name: string;
  recipient_number: string;
  instructions: string;
  updated_at: string;
};

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    key: "student_seller",
    name: "Student Seller",
    price: 0,
    listingLimit: 5,
    description: "Basic student marketplace access for personal selling.",
    details: ["5 active listings", "Personal seller profile", "WhatsApp and phone contact", "Basic listing management"],
    minProposedPrice: null,
    maxProposedPrice: null,
    billingPeriod: "monthly",
    promotionDurationDays: 0,
    aiGenerationLimit: 0,
    effectiveStart: null,
    effectiveEnd: null,
    isActive: true,
    promotionAvailable: false,
    availableForPurchase: true,
  },
  {
    key: "student_business",
    name: "Student Business",
    price: 20,
    listingLimit: 20,
    description: "For student-run businesses and side hustles near campus.",
    details: ["20 active listings", "Business profile", "WhatsApp + phone contact", "Optional featured promos"],
    minProposedPrice: null,
    maxProposedPrice: null,
    billingPeriod: "monthly",
    promotionDurationDays: 7,
    aiGenerationLimit: 10,
    effectiveStart: null,
    effectiveEnd: null,
    isActive: true,
    promotionAvailable: true,
    availableForPurchase: true,
  },
  {
    key: "campus_business",
    name: "Business Plus",
    price: 50,
    listingLimit: 50,
    description: "For larger campus-area businesses and retail operators.",
    details: ["50 active listings", "Enhanced profile", "Priority promotional options", "Better visibility tools"],
    minProposedPrice: null,
    maxProposedPrice: null,
    billingPeriod: "monthly",
    promotionDurationDays: 14,
    aiGenerationLimit: 30,
    effectiveStart: null,
    effectiveEnd: null,
    isActive: true,
    promotionAvailable: true,
    availableForPurchase: true,
  },
  {
    key: "accommodation_advertiser",
    name: "Accommodation Advertiser",
    price: 0,
    listingLimit: 20,
    description: "For hostel and accommodation listings around ATU.",
    details: ["Accommodation listings", "Location details", "Hostel promotion support", "Basic business exposure"],
    minProposedPrice: null,
    maxProposedPrice: null,
    billingPeriod: "monthly",
    promotionDurationDays: 7,
    aiGenerationLimit: 5,
    effectiveStart: null,
    effectiveEnd: null,
    isActive: true,
    promotionAvailable: true,
    availableForPurchase: true,
  },
  {
    key: "regular_advertiser",
    name: "Regular Advertiser",
    price: 50,
    listingLimit: 10,
    description: "For general campus advertising and promotions.",
    details: ["Advertiser profile", "Promotional visibility", "Custom campaign support", "Managed package options"],
    minProposedPrice: null,
    maxProposedPrice: null,
    billingPeriod: "monthly",
    promotionDurationDays: 30,
    aiGenerationLimit: 20,
    effectiveStart: null,
    effectiveEnd: null,
    isActive: true,
    promotionAvailable: true,
    availableForPurchase: true,
  },
];

export function toPlanDefinition(plan: MarketplacePlan): PlanDefinition {
  return {
    key: plan.plan_key,
    name: plan.plan_name,
    price: Number(plan.price_ghs),
    listingLimit: plan.listing_limit,
    description: plan.description ?? "",
    details: plan.benefits,
    minProposedPrice: plan.min_proposed_price === null ? null : Number(plan.min_proposed_price),
    maxProposedPrice: plan.max_proposed_price === null ? null : Number(plan.max_proposed_price),
    billingPeriod: plan.billing_period,
    promotionDurationDays: plan.promotion_duration_days,
    aiGenerationLimit: plan.ai_generation_limit,
    effectiveStart: plan.effective_start,
    effectiveEnd: plan.effective_end,
    isActive: plan.is_active && plan.subscription_status === "active",
    promotionAvailable: plan.promotion_available,
    availableForPurchase: plan.available_for_purchase,
  };
}

export function getPlanDefinition(
  accountType: string | null | undefined,
  plans: PlanDefinition[] = PLAN_DEFINITIONS,
): PlanDefinition {
  const normalizedAccountType = (accountType ?? "student_seller") as AccountType;
  return plans.find((plan) => plan.key === normalizedAccountType) ?? plans[0] ?? PLAN_DEFINITIONS[0];
}

export function getListingLimit(accountType: string | null | undefined, plans?: PlanDefinition[]) {
  return getPlanDefinition(accountType, plans).listingLimit;
}

export function getListingLimitNotice(
  accountType: string | null | undefined,
  currentCount: number,
  plans?: PlanDefinition[],
) {
  const plan = getPlanDefinition(accountType, plans);
  const remaining = Math.max(plan.listingLimit - currentCount, 0);
  return `You have used ${currentCount} of ${plan.listingLimit} active listings. ${remaining === 0 ? "Mark an item as sold or remove a listing before posting another." : `You can post ${remaining} more active listing${remaining === 1 ? "" : "s"}.`}`;
}

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  category: string;
  price: number;
  condition: string;
  description: string;
  image_urls: string[];
  created_at: string;
  updated_at?: string;
  status?: string;
  is_available?: boolean;
  accommodation_type?: "hostel" | "apartment" | "self_contained" | "single_room" | "shared_room" | "other" | null;
  town?: string | null;
  property_address?: string | null;
  advance_payment_months?: number | null;
  available_rooms?: number | null;
  amenities?: string[];
  accommodation_status?: "available" | "paused" | "unavailable" | "rented";
  accommodation_contact_phone?: string | null;
};

export type AccommodationAdvertiserApplication = {
  id: string;
  user_id: string;
  applicant_name: string;
  applicant_role: "hostel_owner" | "landlord" | "property_manager" | "authorised_agent";
  phone_number: string;
  whatsapp_number: string;
  business_name: string;
  town: string;
  property_address: string;
  description: string;
  authorization_confirmed: boolean;
  status: "pending" | "approved" | "rejected" | "suspended";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SellerProfile = {
  id: string;
  full_name: string;
  campus_area: string | null;
  whatsapp_number: string;
  account_type: AccountType;
  role: SellerRole;
  is_contact_public: boolean;
};

export type PublicSellerProfile = Omit<SellerProfile, "account_type" | "is_contact_public" | "role">;

export type ListingWithSeller = Listing & { seller: PublicSellerProfile | null };

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("233")) return digits;
  if (digits.startsWith("0")) return `233${digits.replace(/^0+/, "")}`;
  if (digits.length === 9) return `233${digits}`;
  return null;
}

export function getWhatsAppUrl(phone: string, message: string) {
  const number = formatWhatsAppNumber(phone);
  return number
    ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
    : null;
}

