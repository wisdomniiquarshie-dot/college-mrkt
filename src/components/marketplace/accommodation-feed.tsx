"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { MapPin, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { formatPrice, getWhatsAppUrl, type Listing } from "@/lib/marketplace";

const TYPE_LABELS: Record<NonNullable<Listing["accommodation_type"]>, string> = {
  hostel: "Hostel",
  apartment: "Apartment",
  self_contained: "Self-contained",
  single_room: "Single room",
  shared_room: "Shared room",
  other: "Other",
};

export function AccommodationFeed({ listings, connectionUnavailable }: {
  listings: Listing[];
  connectionUnavailable: boolean;
}) {
  const [search, setSearch] = useState("");
  const [town, setTown] = useState("All towns");
  const [propertyType, setPropertyType] = useState("All types");
  const [availability, setAvailability] = useState("available");
  const [minimumRent, setMinimumRent] = useState("");
  const [maximumRent, setMaximumRent] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const towns = [...new Set(listings.map((listing) => listing.town).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
  const propertyTypes = [...new Set(listings.map((listing) => listing.accommodation_type).filter((value): value is NonNullable<Listing["accommodation_type"]> => Boolean(value)))];

  const visibleListings = listings.filter((listing) => {
    const listingText = `${listing.title} ${listing.town ?? ""} ${listing.property_address ?? ""} ${listing.description}`.toLowerCase();
    const isAvailable = (listing.status === undefined || listing.status === "active") && (listing.is_available !== false) && (listing.accommodation_status === undefined || listing.accommodation_status === "available");
    return (
      (!deferredSearch || listingText.includes(deferredSearch))
      && (town === "All towns" || listing.town === town)
      && (propertyType === "All types" || listing.accommodation_type === propertyType)
      && (availability === "all" || isAvailable)
      && (!minimumRent || listing.price >= Number(minimumRent))
      && (!maximumRent || listing.price <= Number(maximumRent))
    );
  });

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-7 sm:px-7 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase text-[#c35335]">ATU housing guide</p>
          <h1 className="mt-2 font-serif text-4xl text-[#213329] sm:text-5xl">Accommodation near campus</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#687168]">Compare places, room availability, rent and advance-payment requirements around campus.</p>
        </div>
        <Link href="/accommodation/manage" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d2d4c9] px-4 text-sm font-bold text-[#315643] hover:bg-white">Advertise a property</Link>
      </div>

      <aside className="mt-6 flex items-start gap-3 border border-[#e7d5a6] bg-[#fff9e9] p-4 text-sm leading-6 text-[#695622]">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Verify the property, owner or authorised agent in person before sending rent or an advance payment. COLLEGE MRKT does not hold or protect payments.</p>
      </aside>

      <section aria-label="Search accommodation" className="mt-7 border border-[#d9d9ce] bg-[#fffdf9] p-4 sm:p-5">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#747b72]" />
          <label className="sr-only" htmlFor="accommodation-search">Search by name or address</label>
          <input id="accommodation-search" className="form-control rounded-lg pl-10" type="search" placeholder="Search property, town or landmark" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-semibold text-[#46564b]">Town
            <select className="form-control mt-1 rounded-lg" value={town} onChange={(event) => setTown(event.target.value)}>
              <option>All towns</option>
              {towns.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#46564b]">Property type
            <select className="form-control mt-1 rounded-lg" value={propertyType} onChange={(event) => setPropertyType(event.target.value)}>
              <option>All types</option>
              {propertyTypes.map((item) => <option key={item} value={item}>{TYPE_LABELS[item]}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#46564b]">Availability
            <select className="form-control mt-1 rounded-lg" value={availability} onChange={(event) => setAvailability(event.target.value)}>
              <option value="available">Available now</option>
              <option value="all">All listed</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#46564b]">Minimum rent (GH₵)
            <input className="form-control mt-1 rounded-lg" type="number" min="0" placeholder="Any" value={minimumRent} onChange={(event) => setMinimumRent(event.target.value)} />
          </label>
          <label className="text-xs font-semibold text-[#46564b]">Maximum rent (GH₵)
            <input className="form-control mt-1 rounded-lg" type="number" min="0" placeholder="Any" value={maximumRent} onChange={(event) => setMaximumRent(event.target.value)} />
          </label>
        </div>
      </section>

      {connectionUnavailable && <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">Accommodation listings are temporarily unavailable.</p>}

      <div className="mt-8 flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl text-[#213329]">Places to stay</h2>
        <p className="text-sm text-[#687168]">{visibleListings.length} {visibleListings.length === 1 ? "property" : "properties"}</p>
      </div>

      {visibleListings.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleListings.map((listing) => {
            const available = (listing.status === undefined || listing.status === "active") && (listing.is_available !== false) && (listing.accommodation_status === undefined || listing.accommodation_status === "available");
            const whatsappUrl = available && listing.accommodation_contact_phone
              ? getWhatsAppUrl(listing.accommodation_contact_phone, `Hi, I am interested in ${listing.title} in ${listing.town}. Is it still available?`)
              : null;
            return (
              <article key={listing.id} className="overflow-hidden rounded-lg border border-[#deddd4] bg-[#fffdf9]">
                <Link href={`/listings/${listing.id}`} className="block">
                  <div className="relative aspect-[4/3] bg-[#e8e9e2]">
                    {listing.image_urls[0] ? <Image src={listing.image_urls[0]} alt={listing.title} fill unoptimized sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#747b72]">Property photo coming soon</div>}
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${available ? "bg-[#e8efe2] text-[#28523b]" : "bg-[#fffdf7] text-[#626a60]"}`}>{available ? "Available" : listing.accommodation_status ?? "Unavailable"}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-xl text-[#213329]">{listing.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-[#687168]"><MapPin aria-hidden="true" className="h-4 w-4" />{listing.town}</p>
                      </div>
                      {listing.accommodation_type && <span className="shrink-0 rounded-full border border-[#deddd4] px-2.5 py-1 text-xs font-semibold text-[#536056]">{TYPE_LABELS[listing.accommodation_type]}</span>}
                    </div>
                    <p className="mt-4 text-xl font-bold text-[#0f564a]">{formatPrice(listing.price)}<span className="ml-1 text-xs font-semibold text-[#687168]">/ month</span></p>
                    <p className="mt-2 text-sm text-[#59665b]">{listing.advance_payment_months ?? 0} months advance{listing.available_rooms !== null && listing.available_rooms !== undefined ? ` · ${listing.available_rooms} rooms` : ""}</p>
                  </div>
                </Link>
                <div className="border-t border-[#e7e5dc] p-4">
                  {whatsappUrl ? <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#0f564a] px-4 text-sm font-bold text-white hover:bg-[#0b433b]"><MessageCircle aria-hidden="true" className="h-4 w-4" />WhatsApp advertiser</a> : <p className="text-xs text-[#687168]">Contact is unavailable while this property is not available.</p>}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 border-y border-[#d9d9ce] py-12 text-center">
          <h3 className="font-serif text-xl text-[#213329]">{connectionUnavailable ? "Could not load accommodation." : "No properties match those filters."}</h3>
          <p className="mt-2 text-sm text-[#687168]">Try a different town, property type or rent range.</p>
        </div>
      )}
    </main>
  );
}