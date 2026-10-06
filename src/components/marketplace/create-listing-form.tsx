"use client";

import imageCompression from "browser-image-compression";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  Tag,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { CATEGORIES, CONDITIONS } from "@/lib/marketplace";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Photo = { file: File; preview: string };

export function CreateListingForm() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const activePreviewUrls = useRef(new Set<string>());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    const currentUrls = new Set(photos.map(({ preview }) => preview));
    for (const preview of activePreviewUrls.current) {
      if (!currentUrls.has(preview)) {
        URL.revokeObjectURL(preview);
        activePreviewUrls.current.delete(preview);
      }
    }
    currentUrls.forEach((preview) => activePreviewUrls.current.add(preview));
  }, [photos]);

  useEffect(() => () => {
    activePreviewUrls.current.forEach((preview) => URL.revokeObjectURL(preview));
    activePreviewUrls.current.clear();
  }, []);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setError("");
    const available = Math.max(0, 3 - photos.length);
    const selected = Array.from(files).slice(0, available);
    if (files.length > available) {
      setError("You can add up to 3 images per listing.");
    }
    const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
    const unsupported = selected.find((file) => !supportedTypes.includes(file.type));
    if (unsupported) {
      setError("Choose JPG, PNG or WEBP image files.");
      return;
    }
    setPhotos((current) => [
      ...current,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, photoIndex) => photoIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const formElement = event.currentTarget;
    setError("");
    setCreatedId(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase is not configured. Add your project URL and anon key to .env.local.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "");
    const price = Number(formData.get("price"));
    const condition = String(formData.get("condition") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const uploadedPaths: string[] = [];

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("Sign in before posting a listing.");
      }

      const imageUrls: string[] = [];
      for (const [index, photo] of photos.entries()) {
        setStatus(`Compressing photo ${index + 1} of ${photos.length}`);
        const compressed = await imageCompression(photo.file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: "image/jpeg",
        });
        const path = `${userData.user.id}/${crypto.randomUUID()}.jpg`;
        setStatus(`Uploading photo ${index + 1} of ${photos.length}`);
        const { error: uploadError } = await supabase.storage
          .from("listing-images")
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push(path);
        imageUrls.push(supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl);
      }

      setStatus("Saving your listing");
      const { data, error: insertError } = await supabase
        .from("listings")
        .insert({
          seller_id: userData.user.id,
          title,
          category,
          price,
          condition,
          description,
          image_urls: imageUrls,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      setCreatedId(data.id);
      setStatus("");
      setPhotos([]);
      formElement.reset();
    } catch (submissionError) {
      if (uploadedPaths.length) {
        await supabase.storage.from("listing-images").remove(uploadedPaths);
      }
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn’t publish this listing. Please try again.",
      );
      setStatus("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1080px] px-4 pb-16 sm:px-7 lg:px-10">
      <div className="pt-6 sm:pt-9">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#546257] hover:text-[#1f3829]">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to the marketplace
        </Link>
      </div>

      <div className="grid gap-9 pt-8 md:grid-cols-[minmax(0,1fr)_300px] md:gap-14 md:pt-12">
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c35335]">Pass it on</p>
          <h1 className="mt-2 font-serif text-4xl leading-tight text-[#213329] sm:text-5xl">Create a listing</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#687168]">Give a good item a second life with someone on campus.</p>

          {createdId && (
            <div role="status" className="mt-7 flex items-start gap-3 border border-[#a8c3a8] bg-[#edf5eb] p-4 text-sm text-[#294d34]">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">Your listing is live. <Link className="font-bold underline underline-offset-2" href={`/listings/${createdId}`}>View your listing</Link></p>
            </div>
          )}
          {error && (
            <div role="alert" className="mt-7 flex items-start gap-3 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">
              <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="leading-6">{error}</p>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-semibold text-[#2d3931]">What are you selling?</label>
              <div className="relative">
                <Tag aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8278]" />
                <input id="title" name="title" required maxLength={80} placeholder="e.g. Casio scientific calculator" className="form-control pl-10" />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-2 block text-sm font-semibold text-[#2d3931]">Category</label>
                <select id="category" name="category" required defaultValue="" className="form-control">
                  <option value="" disabled>Choose a category</option>
                  {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="condition" className="mb-2 block text-sm font-semibold text-[#2d3931]">Condition</label>
                <select id="condition" name="condition" required defaultValue="" className="form-control">
                  <option value="" disabled>Choose condition</option>
                  {CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="price" className="mb-2 block text-sm font-semibold text-[#2d3931]">Price</label>
              <div className="flex h-12 border border-[#d2d4c9] bg-white focus-within:border-[#42664c] focus-within:ring-2 focus-within:ring-[#42664c]/15">
                <span className="flex items-center border-r border-[#e1e2db] px-3.5 text-sm font-bold text-[#59665b]">GH₵</span>
                <input id="price" name="price" type="number" min="1" step="0.01" required placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-[#26342b] outline-none" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="description" className="text-sm font-semibold text-[#2d3931]">Description</label>
                <span className="text-xs text-[#82877f]">Keep it clear and honest</span>
              </div>
              <textarea id="description" name="description" required maxLength={1200} rows={5} placeholder="Share details someone on campus would want to know..." className="form-control resize-y py-3" />
            </div>

            <div>
              <div className="mb-2 flex items-end justify-between gap-3">
                <label className="text-sm font-semibold text-[#2d3931]" htmlFor="listing-photos">Photos</label>
                <span className="text-xs text-[#82877f]">Up to 3 images</span>
              </div>
              <label htmlFor="listing-photos" className="flex min-h-28 cursor-pointer flex-col items-center justify-center border border-dashed border-[#aeb5a9] bg-[#f8f8f3] px-4 py-5 text-center transition-colors hover:border-[#54745b] hover:bg-[#f2f4eb]">
                <UploadCloud aria-hidden="true" className="h-6 w-6 text-[#4e6d53]" />
                <span className="mt-2 text-sm font-semibold text-[#35443a]">Add photos</span>
                <span className="mt-1 text-xs text-[#81867e]">JPG, PNG or WEBP</span>
              </label>
              <input id="listing-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={photos.length >= 3} onChange={(event) => { addPhotos(event.target.files); event.target.value = ""; }} className="sr-only" />
              {photos.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div key={photo.preview} className="relative aspect-square overflow-hidden bg-[#e8e9e2]">
                      <Image src={photo.preview} alt={`Selected listing photo ${index + 1}`} fill unoptimized sizes="33vw" className="object-cover" />
                      <button type="button" onClick={() => removePhoto(index)} aria-label={`Remove photo ${index + 1}`} className="absolute right-2 top-2 grid h-8 w-8 place-items-center bg-white text-[#303d33] shadow-sm hover:bg-[#fff0eb] hover:text-[#873e2d]">
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && <div className="flex aspect-square items-center justify-center border border-dashed border-[#c6c9bf] text-[#7d857b]"><ImagePlus aria-hidden="true" className="h-5 w-5" /></div>}
                </div>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#c35335] px-5 text-sm font-bold text-white transition-colors hover:bg-[#a9452c] disabled:cursor-not-allowed disabled:opacity-65 sm:w-auto sm:min-w-52">
              {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? (status || "Publishing") : "Publish listing"}
            </button>
          </form>
        </section>

        <aside className="hidden border-l border-[#d9d9ce] pl-7 pt-[72px] md:block">
          <div className="sticky top-28">
            <div className="flex h-12 w-12 items-center justify-center bg-[#e8eddf] text-[#49624a]"><ImagePlus aria-hidden="true" className="h-5 w-5" /></div>
            <h2 className="mt-5 font-serif text-2xl text-[#28382d]">A good listing travels.</h2>
            <p className="mt-3 text-sm leading-6 text-[#697168]">Bright, well-lit photos and a clear description help another student make a confident choice.</p>
            <div className="mt-6 border-t border-[#d9d9ce] pt-5 text-xs leading-5 text-[#7a8077]">Your photos are compressed on your device before they are uploaded.</div>
          </div>
        </aside>
      </div>
    </main>
  );
}
