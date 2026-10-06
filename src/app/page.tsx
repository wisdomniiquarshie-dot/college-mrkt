'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Plus, Search, MessageSquare, Loader2 } from 'lucide-react';
import { createClient } from '@/supabase';

interface Listing {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  description: string;
  image_urls: string[];
  seller_id: string;
  created_at: string;
}

const CATEGORY_OPTIONS = ['All', 'Electronics', 'Fashion', 'Hostel Gear', 'Textbooks', 'Services'];

function formatWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('233')) return digits;
  if (digits.startsWith('0')) return `233${digits.replace(/^0+/, '')}`;
  if (digits.length === 9) return `233${digits}`;
  return null;
}

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [sellerPhones, setSellerPhones] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) {
        setListings([]);
        setSellerPhones({});
        setLoading(false);
        return;
      }

      const sellerIds = [...new Set(data.map((item) => item.seller_id))];
      const phoneMap: Record<string, string> = {};

      if (sellerIds.length) {
        const { data: profiles, error: profilesError } = await supabase
          .from('seller_profiles')
          .select('id, whatsapp_number')
          .in('id', sellerIds);

        if (!profilesError) {
          (profiles ?? []).forEach((profile: { id: string; whatsapp_number: string | null }) => {
            phoneMap[profile.id] = profile.whatsapp_number ?? '';
          });
        }
      }

      setListings(data);
      setSellerPhones(phoneMap);
      setLoading(false);
    }

    fetchListings();
  }, []);

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [listings, search, selectedCategory]);

  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-10 bg-emerald-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">COLLEGE MRKT</h1>
          </div>
          <span className="rounded-full bg-emerald-700 px-2.5 py-1 text-xs font-medium">
            ATU Campus
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-md space-y-3 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search textbooks, electronics, gadgets..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {CATEGORY_OPTIONS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-lg border px-3 py-1.5 transition-colors ${
                selectedCategory === cat
                  ? 'border-emerald-600 bg-emerald-600 font-medium text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-xs text-slate-500">Loading ATU listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="my-4 space-y-2 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-700">No listings found</p>
            <p className="text-xs text-slate-500">Be the first ATU student to post an item in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredListings.map((item) => {
              const phone = sellerPhones[item.seller_id] ?? '';
              const formattedNumber = formatWhatsAppNumber(phone);
              const whatsappHref = formattedNumber
                ? `https://wa.me/${formattedNumber}?text=${encodeURIComponent(
                    `Hi! I saw your listing for "${item.title}" on COLLEGE MRKT and I am interested in buying it.`
                  )}`
                : null;

              return (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  {item.image_urls?.[0] ? (
                    <img src={item.image_urls[0]} alt={item.title} className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-500">
                      Photo coming soon
                    </div>
                  )}

                  <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-1 font-semibold text-slate-800">{item.title}</h2>
                        <span className="text-lg font-bold text-emerald-600">GH₵ {item.price}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.condition} • {item.category}
                      </p>
                    </div>

                    {whatsappHref ? (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                      >
                        <MessageSquare className="h-4 w-4" />
                        Chat on WhatsApp
                      </a>
                    ) : (
                      <span className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-500">
                        <MessageSquare className="h-4 w-4" />
                        Seller contact unavailable
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pointer-events-none fixed bottom-6 left-0 right-0 px-4">
        <div className="mx-auto flex max-w-md justify-end">
          <Link
            href="/listings/new"
            className="pointer-events-auto flex items-center justify-center rounded-full bg-slate-900 p-4 text-white shadow-lg transition-transform hover:bg-slate-800 active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </main>
  );
}
