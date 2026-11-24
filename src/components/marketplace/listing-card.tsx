"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { formatPrice, getWhatsAppUrl, type Listing } from "@/lib/marketplace";

type ListingCardProps = {
  listing: Listing;
  sellerPhone?: string;
  sellerArea?: string;
  loading?: "eager" | "lazy";
};

export function ListingCard({ listing, sellerPhone, sellerArea, loading = "lazy" }: ListingCardProps) {
  const whatsappUrl = sellerPhone
    ? getWhatsAppUrl(
        sellerPhone,
        `Hi, is the ${listing.title} listed for ${formatPrice(listing.price)} still available?`,
      )
    : null;

  const product = (
    <>
      <div className="listing-photo relative aspect-square overflow-hidden bg-[#e8e9e2]">
        {listing.image_urls[0] ? (
          <Image src={listing.image_urls[0]} alt={listing.title} fill loading={loading} unoptimized sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[#777b71]">Photo coming soon</div>
        )}
        <span className="absolute left-2 top-2 rounded-sm bg-[#fffefa]/95 px-2 py-1 text-[9px] font-bold uppercase text-[#29372d]">{listing.condition}</span>
      </div>
      <div className="listing-card-content">
        <div className="flex items-start justify-between gap-2">
          <h2 className="line-clamp-2 min-h-10 text-[13px] font-medium leading-5 text-[#202a24] sm:text-sm">{listing.title}</h2>
          <ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#718076] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <p className="mt-1 text-base font-extrabold text-[#15452e] sm:text-lg">{formatPrice(listing.price)}</p>
        <p className="mt-1 truncate text-[10px] text-[#72786f]">
          {listing.category}{sellerArea ? ` · ${sellerArea}` : ""}
        </p>
      </div>
    </>
  );

  return (
    <article className="listing-card group min-w-0">
      <Link href={`/listings/${listing.id}`} className="block">{product}</Link>
      {whatsappUrl ? (
        <a className="listing-card-action" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" className="h-4 w-4" />Chat on WhatsApp</a>
      ) : (
        <span className="listing-card-action is-unavailable"><MessageCircle aria-hidden="true" className="h-4 w-4" />Seller contact unavailable</span>
      )}
    </article>
  );
}
