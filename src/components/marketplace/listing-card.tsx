"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { formatPrice, getWhatsAppUrl, type Listing } from "@/lib/marketplace";

type ListingCardProps = {
  listing: Listing;
  sellerPhone?: string;
  loading?: "eager" | "lazy";
};

export function ListingCard({ listing, sellerPhone, loading = "lazy" }: ListingCardProps) {
  const whatsappUrl = sellerPhone
    ? getWhatsAppUrl(
        sellerPhone,
        `Hi, is the ${listing.title} listed for ${formatPrice(listing.price)} still available?`,
      )
    : null;

  return (
    <article className="listing-card group min-w-0">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="listing-photo relative aspect-[4/3] overflow-hidden bg-[#e8e9e2]">
          {listing.image_urls[0] ? (
            <Image
              src={listing.image_urls[0]}
              alt={listing.title}
              fill
              loading={loading}
              unoptimized
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#777b71]">
              Photo coming soon
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-sm bg-white/95 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#29372d] sm:left-3 sm:top-3">
            {listing.condition}
          </span>
          <span className="absolute bottom-2 right-2 rounded-sm bg-[#fffdf7] px-2 py-1 text-[10px] font-semibold text-[#4d554d] sm:bottom-3 sm:right-3">
            {listing.category}
          </span>
        </div>
        <div className="pt-3 sm:pt-4">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 min-h-10 text-[14px] font-semibold leading-5 text-[#202a24] sm:text-[15px]">
              {listing.title}
            </h2>
            <ArrowUpRight aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#718076] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="mt-1 text-[15px] font-bold text-[#c35335] sm:text-base">
            {formatPrice(listing.price)}
          </p>
        </div>
      </Link>
      {whatsappUrl ? (
        <a
          className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 bg-[#25392e] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#345341] sm:mt-4 sm:min-h-11 sm:text-sm"
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          Chat on WhatsApp
        </a>
      ) : (
        <span className="mt-3 flex min-h-10 items-center justify-center gap-2 border border-[#d8d9d1] px-3 text-xs font-medium text-[#72786f] sm:mt-4 sm:min-h-11 sm:text-sm">
          <MessageCircle aria-hidden="true" className="h-4 w-4" />
          Seller contact unavailable
        </span>
      )}
    </article>
  );
}
