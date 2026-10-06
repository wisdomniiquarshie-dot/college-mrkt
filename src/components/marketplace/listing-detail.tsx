"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  MapPin,
  MessageCircle,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import {
  formatPrice,
  getWhatsAppUrl,
  type ListingWithSeller,
} from "@/lib/marketplace";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type ListingDetailProps = { listing: ListingWithSeller };

export function ListingDetail({ listing }: ListingDetailProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const photos = listing.image_urls;
  const whatsappUrl = listing.seller
    ? getWhatsAppUrl(
        listing.seller.whatsapp_number,
        `Hi ${listing.seller.full_name}, I'm interested in your ${listing.title} listed for ${formatPrice(listing.price)}. Is it still available?`,
      )
    : null;
  const postedDate = new Intl.DateTimeFormat("en-GH", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(listing.created_at));

  function movePhoto(direction: -1 | 1) {
    setPhotoIndex((index) => (index + direction + photos.length) % photos.length);
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReportError("");
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setReportError("Supabase is not configured for reports.");
      return;
    }
    setIsReporting(true);
    const formData = new FormData(event.currentTarget);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Sign in before reporting a listing.");
      const { error } = await supabase.from("listing_reports").insert({
        listing_id: listing.id,
        reporter_id: authData.user.id,
        reason: String(formData.get("reason")),
        details: String(formData.get("details") ?? "").trim() || null,
      });
      if (error) throw error;
      setReportMessage("Thanks. Your report has been sent for review.");
      setReportOpen(false);
    } catch (submissionError) {
      setReportError(submissionError instanceof Error ? submissionError.message : "Your report could not be sent.");
    } finally {
      setIsReporting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 pb-28 pt-6 sm:px-7 sm:pb-14 sm:pt-9 lg:px-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#546257] hover:text-[#1f3829]">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to listings
      </Link>

      <div className="mt-6 grid gap-8 md:mt-9 md:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] md:gap-12 lg:gap-16">
        <section aria-label="Listing photos">
          <div className="relative aspect-[4/3] overflow-hidden bg-[#e8e9e2] sm:aspect-[5/4]">
            {photos.length ? (
              <Image src={photos[photoIndex]} alt={`${listing.title}, photo ${photoIndex + 1}`} fill priority unoptimized sizes="(max-width: 768px) 100vw, 55vw" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[#777b71]">No photos for this listing</div>
            )}
            {photos.length > 1 && (
              <>
                <button onClick={() => movePhoto(-1)} type="button" aria-label="Previous photo" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center bg-white/95 text-[#25362c] shadow-sm hover:bg-white"><ChevronLeft aria-hidden="true" className="h-5 w-5" /></button>
                <button onClick={() => movePhoto(1)} type="button" aria-label="Next photo" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center bg-white/95 text-[#25362c] shadow-sm hover:bg-white"><ChevronRight aria-hidden="true" className="h-5 w-5" /></button>
                <span className="absolute bottom-3 right-3 bg-[#1f2e25]/85 px-2.5 py-1 text-xs font-semibold text-white">{photoIndex + 1} / {photos.length}</span>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {photos.map((photo, index) => (
                <button type="button" key={photo} aria-label={`Show photo ${index + 1}`} aria-pressed={photoIndex === index} onClick={() => setPhotoIndex(index)} className={`relative aspect-square overflow-hidden bg-[#e8e9e2] ${photoIndex === index ? "ring-2 ring-[#42664c] ring-offset-2" : "opacity-70 hover:opacity-100"}`}>
                  <Image src={photo} alt="" fill unoptimized sizes="20vw" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-[#e8eddf] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.09em] text-[#426148]">{listing.category}</span>
            <span className="border border-[#d5d7cf] px-2.5 py-1 text-[11px] font-semibold text-[#606a61]">{listing.condition}</span>
          </div>
          <h1 className="mt-4 font-serif text-3xl leading-tight text-[#203127] sm:text-4xl">{listing.title}</h1>
          <p className="mt-3 text-2xl font-bold text-[#c35335] sm:text-[28px]">{formatPrice(listing.price)}</p>
          <div className="mt-5 flex items-center gap-2 border-y border-[#d9d9ce] py-3 text-xs text-[#747b72]">
            <span>Posted {postedDate}</span>
            <span aria-hidden="true" className="text-[#b8bcb2]">/</span>
            <span>Accra Technical University</span>
          </div>

          <div className="mt-7">
            <h2 className="text-sm font-bold text-[#2d3931]">About this item</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[#616b62]">{listing.description}</p>
          </div>

          <div className="mt-8 border-y border-[#d9d9ce] py-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#777e74]">Seller</h2>
            {listing.seller ? (
              <div className="mt-3 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[#27372d]">{listing.seller.full_name}</p>
                  {listing.seller.campus_area && <p className="mt-1 flex items-center gap-1.5 text-sm text-[#727970]"><MapPin aria-hidden="true" className="h-3.5 w-3.5" />{listing.seller.campus_area}</p>}
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#54725a]"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Campus seller</span>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#727970]">Seller profile not available.</p>
            )}
          </div>

          {reportMessage && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-[#426148]"><Check aria-hidden="true" className="h-4 w-4" />{reportMessage}</p>}
          <button type="button" onClick={() => { setReportOpen(true); setReportError(""); }} className="mt-5 inline-flex min-h-10 w-fit items-center gap-2 text-xs font-semibold text-[#70776e] underline decoration-[#b8bcb2] underline-offset-4 hover:text-[#9c4531]">
            <Flag aria-hidden="true" className="h-4 w-4" />Report listing
          </button>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#d8d9d1] bg-[#fffdf7]/95 p-3 backdrop-blur sm:hidden">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 bg-[#26392e] px-4 text-sm font-bold text-white hover:bg-[#345341]"><MessageCircle aria-hidden="true" className="h-5 w-5" />Contact seller via WhatsApp</a>
        ) : (
          <span className="flex min-h-12 items-center justify-center gap-2 bg-[#e5e6df] px-4 text-sm font-semibold text-[#697168]"><MessageCircle aria-hidden="true" className="h-5 w-5" />Seller contact unavailable</span>
        )}
      </div>
      <div className="mt-8 hidden sm:block">
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#26392e] px-6 text-sm font-bold text-white hover:bg-[#345341]"><MessageCircle aria-hidden="true" className="h-5 w-5" />Contact seller via WhatsApp</a>
        ) : (
          <span className="inline-flex min-h-12 items-center gap-2 bg-[#e5e6df] px-6 text-sm font-semibold text-[#697168]"><MessageCircle aria-hidden="true" className="h-5 w-5" />Seller contact unavailable</span>
        )}
      </div>

      {reportOpen && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportOpen(false); }} className="fixed inset-0 z-40 flex items-end justify-center bg-[#17231b]/55 p-0 sm:items-center sm:p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="report-heading" className="w-full max-w-lg bg-[#fffdf7] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#c35335]">Marketplace safety</p><h2 id="report-heading" className="mt-2 font-serif text-2xl text-[#24342a]">Report this listing</h2></div>
              <button type="button" onClick={() => setReportOpen(false)} aria-label="Close report dialog" className="grid h-9 w-9 place-items-center text-[#626a60] hover:bg-[#efefe8]"><X aria-hidden="true" className="h-5 w-5" /></button>
            </div>
            {reportError && <p role="alert" className="mt-4 flex items-center gap-2 text-sm text-[#9a412f]"><XCircle aria-hidden="true" className="h-4 w-4" />{reportError}</p>}
            <form onSubmit={submitReport} className="mt-5 space-y-4">
              <div><label htmlFor="report-reason" className="mb-2 block text-sm font-semibold text-[#2d3931]">Reason</label><select id="report-reason" name="reason" required className="form-control"><option value="">Select a reason</option><option>Misleading or inaccurate</option><option>Prohibited item</option><option>Suspicious or scam</option><option>Other</option></select></div>
              <div><label htmlFor="report-details" className="mb-2 block text-sm font-semibold text-[#2d3931]">Details <span className="font-normal text-[#7d837b]">(optional)</span></label><textarea id="report-details" name="details" maxLength={800} rows={3} className="form-control resize-y py-3" placeholder="Tell us what we should review." /></div>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setReportOpen(false)} className="min-h-11 border border-[#d2d4c9] px-5 text-sm font-semibold text-[#4d584f] hover:bg-[#f4f4ee]">Cancel</button>
                <button type="submit" disabled={isReporting} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#c35335] px-5 text-sm font-bold text-white disabled:opacity-60">{isReporting ? <ArrowLeftRight aria-hidden="true" className="h-4 w-4 animate-pulse" /> : <Flag aria-hidden="true" className="h-4 w-4" />}{isReporting ? "Sending report" : "Send report"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
