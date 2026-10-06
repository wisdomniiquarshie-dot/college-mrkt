"use client";

import { useDeferredValue, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { CATEGORIES, type Listing } from "@/lib/marketplace";
import { ListingCard } from "@/components/marketplace/listing-card";

type CampusFeedProps = {
  listings: Listing[];
  sellerPhones: Record<string, string>;
  isDemo: boolean;
};

export function CampusFeed({ listings, sellerPhones, isDemo }: CampusFeedProps) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const visibleListings = listings.filter((listing) => {
    const matchesCategory = category === "All" || listing.category === category;
    return matchesCategory && listing.title.toLowerCase().includes(deferredSearch);
  });

  return (
    <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-7 lg:px-10">
      <section className="feed-intro flex flex-col justify-between gap-6 border-b border-[#d9d9ce] py-8 sm:flex-row sm:items-end sm:py-11">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c35335]">
            Accra Technical University
          </p>
          <h1 className="max-w-[700px] font-serif text-4xl font-medium leading-[1.02] text-[#1f2e25] sm:text-5xl">
            Good finds,<br className="hidden sm:block" /> close to home.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#626a60] sm:text-base">
            The campus marketplace for things worth passing on.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium text-[#72776d]">
          <span className="h-px w-9 bg-[#bdc0b4]" />
          <span>{listings.length} listings on campus</span>
        </div>
      </section>

      <section aria-label="Browse listings" className="pt-6 sm:pt-8">
        <div className="sticky top-[66px] z-20 -mx-4 border-b border-[#d8d9d1] bg-[#fbfaf4]/95 px-4 py-3 backdrop-blur sm:top-[72px] sm:mx-0 sm:px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-[360px]">
              <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-[#737a70]" />
              <label className="sr-only" htmlFor="listing-search">Search listings</label>
              <input
                id="listing-search"
                className="h-11 w-full border border-[#d2d4c9] bg-white pl-11 pr-4 text-sm text-[#26342b] outline-none transition focus:border-[#42664c] focus:ring-2 focus:ring-[#42664c]/15"
                placeholder="Search the marketplace"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#81867c] sm:flex">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              <span>Browse by</span>
            </div>
          </div>

          <div className="category-rail -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {["All", ...CATEGORIES].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`shrink-0 border px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                  category === item
                    ? "border-[#26392d] bg-[#26392d] text-white"
                    : "border-[#d2d4c9] bg-transparent text-[#576057] hover:border-[#899388] hover:bg-white"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {isDemo && (
          <p className="mt-5 border-l-2 border-[#d29337] bg-[#f5f0df] px-3 py-2 text-xs leading-5 text-[#62563e]">
            Preview listings are shown. Add your Supabase credentials to load the live campus marketplace.
          </p>
        )}

        <div className="mb-4 mt-7 flex items-center justify-between sm:mt-9">
          <h2 className="font-serif text-2xl text-[#24332a] sm:text-[28px]">Fresh on campus</h2>
          <span className="text-xs text-[#757b72]">{visibleListings.length} results</span>
        </div>

        {visibleListings.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7">
            {visibleListings.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                sellerPhone={sellerPhones[listing.seller_id]}
                loading={index === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
        ) : (
          <div className="border-y border-[#d9d9ce] py-16 text-center">
            <h3 className="font-serif text-2xl text-[#25362c]">Nothing in this corner yet.</h3>
            <p className="mt-2 text-sm text-[#737a70]">Try another search or category.</p>
          </div>
        )}
      </section>
    </main>
  );
}
