"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Coffee,
  House,
  Laptop,
  MapPin,
  Search,
  Shirt,
  ShoppingBag,
  Sofa,
  Sparkles,
  Tag,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useDeferredValue, useState, type FormEvent } from "react";
import { ListingCard } from "@/components/marketplace/listing-card";
import { CATEGORIES, type Category, type Listing } from "@/lib/marketplace";

type CampusFeedProps = {
  listings: Listing[];
  sellerPhones: Record<string, string>;
  sellerAreas: Record<string, string>;
  connectionUnavailable: boolean;
};

const categoryIcons: Record<Category, LucideIcon> = {
  Electronics: Laptop,
  Fashion: Shirt,
  "Hostel Gear": House,
  Textbooks: BookOpen,
  "Food and Drinks": Coffee,
  "Beauty and Personal Care": Sparkles,
  Accessories: ShoppingBag,
  Furniture: Sofa,
  Services: Wrench,
  Accommodation: House,
  Other: Tag,
};

function createdAt(listing: Listing) {
  const timestamp = new Date(listing.created_at).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function CampusFeed({
  listings,
  sellerPhones,
  sellerAreas,
  connectionUnavailable,
}: CampusFeedProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "All">("All");
  const [campusArea, setCampusArea] = useState("All campuses");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const campusAreas = [...new Set(Object.values(sellerAreas).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));

  const visibleListings = listings
    .filter((listing) => {
      const listingText = `${listing.title} ${listing.category} ${listing.description} ${sellerAreas[listing.seller_id] ?? ""}`.toLowerCase();
      const price = Number(listing.price);
      return (
        (!deferredSearch || listingText.includes(deferredSearch))
        && (category === "All" || listing.category === category)
        && (campusArea === "All campuses" || sellerAreas[listing.seller_id] === campusArea)
        && (!minimumPrice || price >= Number(minimumPrice))
        && (!maximumPrice || price <= Number(maximumPrice))
      );
    })
    .sort((first, second) => {
      if (sortOrder === "price-low") return first.price - second.price;
      if (sortOrder === "price-high") return second.price - first.price;
      return createdAt(second) - createdAt(first);
    });

  const categoryCount = (value: Category | "All") =>
    value === "All"
      ? listings.length
      : listings.filter((listing) => listing.category === value).length;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.getElementById("browse-listings")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="storefront mx-auto w-full max-w-[1480px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
      <section className="store-hero" aria-labelledby="marketplace-title">
        <div className="store-hero-copy">
          <p className="store-eyebrow"><MapPin aria-hidden="true" size={14} /> ATU &amp; every campus</p>
          <h1 id="marketplace-title">Good finds.<br /><span>Good for student life.</span></h1>
          <p className="store-hero-description">
            Buy, sell and pass things on with students around Accra Technical University and beyond.
          </p>
          <form className="store-search" role="search" onSubmit={handleSearch}>
            <Search aria-hidden="true" size={18} />
            <label className="sr-only" htmlFor="marketplace-search">Search campus listings</label>
            <input
              id="marketplace-search"
              type="search"
              placeholder="Search books, gadgets, fashion..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <button type="submit" aria-label="Search listings"><Search aria-hidden="true" size={17} /></button>
          </form>
          <div className="store-hero-links">
            <a href="#browse-listings">Explore listings <ArrowRight aria-hidden="true" size={14} /></a>
            <Link href="/listings/new">List something <ArrowRight aria-hidden="true" size={14} /></Link>
          </div>
        </div>
        <div className="store-hero-art" aria-hidden="true">
          <div className="store-hero-emblem">
            <ShoppingBag size={54} strokeWidth={1.2} />
            <span>Campus finds, close by</span>
          </div>
          <div className="hero-float absolute left-[9%] top-[15%] grid h-14 w-14 place-items-center rounded-lg border border-white/15 bg-white/10 text-[#f5dfaa] shadow-lg backdrop-blur-sm">
            <BookOpen size={25} strokeWidth={1.5} />
          </div>
          <div className="hero-float hero-float-bottom absolute right-[13%] top-[14%] grid h-12 w-12 place-items-center rounded-full border border-white/15 bg-white/10 text-[#f5dfaa] shadow-lg backdrop-blur-sm">
            <Laptop size={22} strokeWidth={1.5} />
          </div>
          <div className="store-hero-stamp"><span>Made for</span><strong>student<br />budgets</strong></div>
        </div>
      </section>

      {connectionUnavailable && (
        <p role="alert" className="store-status mt-4">
          <span className="store-status-dot" />
          Listings are temporarily unavailable. Please try again in a little while.
        </p>
      )}

      <section className="mt-8" aria-labelledby="categories-title">
        <div className="store-section-heading">
          <div>
            <p className="store-kicker">Find your thing</p>
            <h2 id="categories-title">Shop by category</h2>
          </div>
          <span>{listings.length} campus {listings.length === 1 ? "listing" : "listings"}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12">
          <button
            type="button"
            className="store-category border border-[#e1ded4] transition"
            aria-pressed={category === "All"}
            onClick={() => setCategory("All")}
          >
            <span className="store-category-icon"><ShoppingBag aria-hidden="true" size={19} /></span>
            <span>All items</span>
            <small>{categoryCount("All")}</small>
          </button>
          {CATEGORIES.filter((item) => item !== "Accommodation").map((item) => {
            const Icon = categoryIcons[item];
            return (
              <button
                key={item}
                type="button"
                className="store-category border border-[#e1ded4] transition"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                <span className="store-category-icon"><Icon aria-hidden="true" size={19} /></span>
                <span>{item}</span>
                <small>{categoryCount(item)}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section id="browse-listings" className="mt-9 scroll-mt-32" aria-labelledby="listings-title">
        <div className="store-section-heading">
          <div>
            <p className="store-kicker">From your campus community</p>
            <h2 id="listings-title">Browse student finds</h2>
            <p className="store-subtitle">Connect with sellers and arrange a safe campus handoff.</p>
          </div>
          <Link href="/listings/new" className="store-sell-link"><Tag aria-hidden="true" size={14} /> Sell an item</Link>
        </div>

        <div className="store-filter-bar" aria-label="Filter listings">
          <label className="store-filter-label" htmlFor="campus-area-filter"><MapPin aria-hidden="true" size={14} /> Filter your finds</label>
          <select
            id="campus-area-filter"
            className="form-control"
            value={campusArea}
            onChange={(event) => setCampusArea(event.target.value)}
          >
            <option>All campuses</option>
            {campusAreas.map((area) => <option key={area}>{area}</option>)}
          </select>
          <label className="sr-only" htmlFor="minimum-price-filter">Minimum price in Ghana cedis</label>
          <input
            id="minimum-price-filter"
            className="form-control"
            type="number"
            min="0"
            placeholder="Min price (GH₵)"
            value={minimumPrice}
            onChange={(event) => setMinimumPrice(event.target.value)}
          />
          <label className="sr-only" htmlFor="maximum-price-filter">Maximum price in Ghana cedis</label>
          <input
            id="maximum-price-filter"
            className="form-control"
            type="number"
            min="0"
            placeholder="Max price (GH₵)"
            value={maximumPrice}
            onChange={(event) => setMaximumPrice(event.target.value)}
          />
          <label className="sr-only" htmlFor="listing-sort">Sort listings</label>
          <select
            id="listing-sort"
            className="form-control"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          >
            <option value="newest">Recently listed</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>

        <div className="store-section-heading mt-5">
          <h2 className="!mt-0 !font-sans !text-base !font-bold">
            {category === "All" ? "All campus listings" : category}
          </h2>
          <span>{visibleListings.length} {visibleListings.length === 1 ? "item" : "items"}</span>
        </div>

        {visibleListings.length ? (
          <div className="store-listing-grid">
            {visibleListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                sellerPhone={sellerPhones[listing.seller_id]}
                sellerArea={sellerAreas[listing.seller_id]}
              />
            ))}
          </div>
        ) : (
          <div className="store-empty-state">
            <ShoppingBag aria-hidden="true" size={30} />
            <h3>{listings.length ? "No listings match your search" : "Your campus marketplace starts here"}</h3>
            <p>
              {listings.length
                ? "Try another search or clear a filter to see more student finds."
                : "Be among the first to share something useful with students at ATU and other campuses."}
            </p>
            {listings.length ? (
              <button
                type="button"
                className="mt-3 text-xs font-bold text-[#15452e] underline underline-offset-2"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setCampusArea("All campuses");
                  setMinimumPrice("");
                  setMaximumPrice("");
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link href="/listings/new">Create the first listing <ArrowRight aria-hidden="true" size={14} /></Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
