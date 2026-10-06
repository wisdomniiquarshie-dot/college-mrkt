export const CATEGORIES = [
  "Electronics",
  "Fashion",
  "Hostel Gear",
  "Textbooks",
  "Services",
] as const;

export const CONDITIONS = ["New", "Like New", "Fair", "Refurbished"] as const;

export type Category = (typeof CATEGORIES)[number];
export type ItemCondition = (typeof CONDITIONS)[number];

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
};

export type SellerProfile = {
  id: string;
  full_name: string;
  campus_area: string | null;
  whatsapp_number: string;
};

export type ListingWithSeller = Listing & { seller: SellerProfile | null };

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    maximumFractionDigits: 0,
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

export const DEMO_LISTINGS: Listing[] = [
  {
    id: "demo-calculator",
    seller_id: "demo-seller",
    title: "Casio scientific calculator",
    category: "Electronics",
    price: 180,
    condition: "Like New",
    description: "FX-991ES Plus. All functions work perfectly. Great for engineering and maths courses.",
    image_urls: ["https://images.unsplash.com/photo-1587145820266-a5951ee6f620?auto=format&fit=crop&w=1000&q=85"],
    created_at: "2026-10-02T10:00:00.000Z",
  },
  {
    id: "demo-textbooks",
    seller_id: "demo-seller",
    title: "Engineering mathematics set",
    category: "Textbooks",
    price: 240,
    condition: "Fair",
    description: "Three useful engineering mathematics books. Some highlighting, no missing pages.",
    image_urls: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=1000&q=85"],
    created_at: "2026-10-01T15:30:00.000Z",
  },
  {
    id: "demo-backpack",
    seller_id: "demo-seller",
    title: "Everyday canvas backpack",
    category: "Fashion",
    price: 320,
    condition: "New",
    description: "Roomy canvas backpack with a padded laptop pocket and comfortable straps.",
    image_urls: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85"],
    created_at: "2026-09-30T08:45:00.000Z",
  },
  {
    id: "demo-lamp",
    seller_id: "demo-seller",
    title: "Desk lamp with warm light",
    category: "Hostel Gear",
    price: 150,
    condition: "Like New",
    description: "Compact adjustable desk lamp, ideal for late-night study sessions.",
    image_urls: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1000&q=85"],
    created_at: "2026-09-29T12:15:00.000Z",
  },
];

export const DEMO_SELLER: SellerProfile = {
  id: "demo-seller",
  full_name: "Ama Mensah",
  campus_area: "Accra Technical University",
  whatsapp_number: "0241234567",
};
