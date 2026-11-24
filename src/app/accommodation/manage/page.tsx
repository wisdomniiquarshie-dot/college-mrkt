import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice, type AccommodationAdvertiserApplication, type Listing, type PlanSubscription } from "@/lib/marketplace";
import { getAvailablePlanDefinitions } from "@/lib/marketplace-server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  activateFreeAccommodationPlanAction,
  createAccommodationListingAction,
  setAccommodationListingStatusAction,
  submitAccommodationApplicationAction,
  updateAccommodationListingAction,
} from "./actions";

const inputClass = "form-control mt-1";

function PropertyFields({ listing }: { listing?: Listing }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold text-[#2d3931]">Property name
        <input className={inputClass} name="propertyName" required minLength={2} maxLength={80} defaultValue={listing?.title ?? ""} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Property type
        <select className={inputClass} name="accommodationType" required defaultValue={listing?.accommodation_type ?? "hostel"}>
          <option value="hostel">Hostel</option>
          <option value="apartment">Apartment</option>
          <option value="self_contained">Self-contained</option>
          <option value="single_room">Single room</option>
          <option value="shared_room">Shared room</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Town
        <input className={inputClass} name="town" required maxLength={100} defaultValue={listing?.town ?? ""} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Address or landmark
        <input className={inputClass} name="propertyAddress" required maxLength={300} defaultValue={listing?.property_address ?? ""} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Rent per month (GH₵)
        <input className={inputClass} name="rent" type="number" min="1" step="0.01" required defaultValue={listing?.price ?? ""} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Advance payment (months)
        <input className={inputClass} name="advancePaymentMonths" type="number" min="0" max="36" step="1" required defaultValue={listing?.advance_payment_months ?? 0} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Available rooms
        <input className={inputClass} name="availableRooms" type="number" min="0" step="1" placeholder="Leave blank if unknown" defaultValue={listing?.available_rooms ?? ""} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931]">Contact phone / WhatsApp
        <input className={inputClass} name="contactPhone" type="tel" required minLength={7} maxLength={30} defaultValue={listing?.accommodation_contact_phone ?? ""} />
      </label>
      <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2">Amenities, one per line
        <textarea className={`${inputClass} py-3`} name="amenities" rows={3} maxLength={1000} defaultValue={listing?.amenities?.join("\n") ?? ""} placeholder="Water, security, Wi-Fi" />
      </label>
      <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2">Description
        <textarea className={`${inputClass} py-3`} name="description" required minLength={10} maxLength={1200} rows={4} defaultValue={listing?.description ?? ""} />
      </label>
    </div>
  );
}

function ApplicationForm({ application }: { application: AccommodationAdvertiserApplication | null }) {
  return (
    <form action={submitAccommodationApplicationAction} className="mt-6 border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#2d3931]">Your name
          <input className={inputClass} name="applicantName" required minLength={2} maxLength={100} defaultValue={application?.applicant_name ?? ""} />
        </label>
        <label className="text-sm font-semibold text-[#2d3931]">I am a
          <select className={inputClass} name="applicantRole" required defaultValue={application?.applicant_role ?? "hostel_owner"}>
            <option value="hostel_owner">Hostel owner</option>
            <option value="landlord">Landlord</option>
            <option value="property_manager">Property manager</option>
            <option value="authorised_agent">Authorised agent</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-[#2d3931]">Phone number
          <input className={inputClass} name="phoneNumber" type="tel" required minLength={7} maxLength={30} defaultValue={application?.phone_number ?? ""} />
        </label>
        <label className="text-sm font-semibold text-[#2d3931]">WhatsApp number
          <input className={inputClass} name="whatsappNumber" type="tel" required minLength={7} maxLength={30} defaultValue={application?.whatsapp_number ?? ""} />
        </label>
        <label className="text-sm font-semibold text-[#2d3931]">Business or property name
          <input className={inputClass} name="businessName" required minLength={2} maxLength={120} defaultValue={application?.business_name ?? ""} />
        </label>
        <label className="text-sm font-semibold text-[#2d3931]">Town
          <input className={inputClass} name="town" required minLength={2} maxLength={100} defaultValue={application?.town ?? ""} />
        </label>
        <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2">Property address or landmark
          <input className={inputClass} name="propertyAddress" required minLength={4} maxLength={300} defaultValue={application?.property_address ?? ""} />
        </label>
        <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2">About the property or business
          <textarea className={`${inputClass} py-3`} name="description" required minLength={10} maxLength={1500} rows={4} defaultValue={application?.description ?? ""} />
        </label>
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#39483e]">
        <input className="mt-1 h-4 w-4 shrink-0 accent-[#0f564a]" type="checkbox" name="authorizationConfirmed" required defaultChecked={application?.authorization_confirmed ?? false} />
        <span>I own this property or have permission from the owner to advertise it.</span>
      </label>
      <button type="submit" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0f564a] px-5 text-sm font-bold text-white hover:bg-[#0b433b]">
        {application?.status === "rejected" ? "Resubmit application" : "Submit for review"}
      </button>
    </form>
  );
}

export default async function AccommodationManagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; application?: string; plan?: string; listing?: string }>;
}) {
  const query = await searchParams;
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return <main className="mx-auto max-w-4xl px-4 py-16"><p className="text-sm text-[#873e2d]">The marketplace connection is unavailable.</p></main>;
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-7">
        <h1 className="font-serif text-3xl text-[#213329]">Accommodation Advertiser</h1>
        <p className="mt-3 text-sm text-[#687168]">Sign in to apply and manage accommodation listings.</p>
        <Link href="/pricing" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#0f564a] px-5 text-sm font-bold text-white">View plan</Link>
      </main>
    );
  }

  const [applicationResult, planDefinitions] = await Promise.all([
    supabase.from("accommodation_advertiser_applications").select("*").eq("user_id", user.id).maybeSingle(),
    getAvailablePlanDefinitions(),
  ]);
  const application = applicationResult.data as AccommodationAdvertiserApplication | null;
  const accommodationPlan = planDefinitions?.find((plan) => plan.key === "accommodation_advertiser") ?? null;
  const now = new Date().toISOString();
  const { data: subscription } = await supabase
    .from("plan_subscriptions")
    .select("id, plan_key, plan_name, price_ghs, billing_period, listing_limit, promotion_duration_days, benefits, ai_generation_limit, promotion_available, starts_at, expires_at, status, change_reason, payment_request_id, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("plan_key", "accommodation_advertiser")
    .eq("status", "active")
    .lte("starts_at", now)
    .gt("expires_at", now)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const currentSubscription = subscription as PlanSubscription | null;
  const { data: listings } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user.id)
    .eq("category", "Accommodation")
    .order("created_at", { ascending: false });
  const accommodationListings = (listings ?? []) as Listing[];
  const activeListings = accommodationListings.filter((listing) => (listing.status === undefined || listing.status === "active") && listing.is_available !== false && (listing.accommodation_status === undefined || listing.accommodation_status === "available"));
  const hasRoomCounts = activeListings.some((listing) => listing.available_rooms !== null && listing.available_rooms !== undefined);
  const availableRooms = activeListings.reduce((total, listing) => total + (listing.available_rooms ?? 0), 0);
  const canManageListings = application?.status === "approved" && Boolean(currentSubscription);
  const errorText: Record<string, string> = {
    "application-invalid": "Complete every field and confirm that you have permission to advertise the property.",
    "application-save-failed": "Your application could not be saved. Please try again.",
    "application-already-reviewed": "This application has already been reviewed. Contact an administrator if details need to change.",
    "free-plan-activation-failed": "The free plan could not be activated. Check availability or contact an administrator.",
    "approval-required": "An approved advertiser application is required before adding properties.",
    "subscription-check-failed": "Your plan status could not be checked. Please try again.",
    "listing-not-found": "That accommodation listing could not be found.",
    "listing-save-failed": "The property could not be saved. Check its details, plan limit and photos, then try again.",
    "listing-update-failed": "The property could not be updated. Check your plan and listing details.",
    "listing-status-invalid": "Choose a valid availability status.",
    "listing-status-update-failed": "The availability status could not be updated. Check that your plan is active before making a property available.",
    "plan-unavailable": "There is no active Accommodation Advertiser plan. Contact an administrator for payment details.",
    "listing-limit-reached": "Your active accommodation listing allowance has been reached. Pause or mark a property rented before adding another.",
  };
  const successText: Record<string, string> = {
    pending: "Your application was submitted and is awaiting administrator review.",
    active: "Your free Accommodation Advertiser plan is active.",
    created: "Accommodation listing added.",
    updated: "Accommodation details saved.",
    "status-updated": "Accommodation availability updated.",
  };

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 pb-20 pt-8 sm:px-7 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase text-[#c35335]">Advertiser workspace</p>
          <h1 className="mt-2 font-serif text-4xl text-[#213329]">Accommodation Advertiser</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#687168]">Apply to advertise a property near campus, then manage availability and enquiries here.</p>
        </div>
        <Link href="/accommodation" className="inline-flex min-h-10 items-center rounded-lg border border-[#d9d9ce] px-4 text-sm font-bold text-[#315643] hover:bg-white">View public listings</Link>
      </div>

      {query.error && (
        <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">
          {errorText[query.error] ?? "The request could not be completed. Please check your details and try again."}
        </p>
      )}
      {(query.application || query.plan || query.listing) && (
        <p role="status" className="mt-6 border border-[#a8c3a8] bg-[#edf5eb] p-4 text-sm text-[#294d34]">
          {successText[query.application ?? query.plan ?? query.listing ?? ""] ?? "Accommodation account updated."}
        </p>
      )}

      {applicationResult.error && <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">The application record is unavailable. Run the accommodation schema update and try again.</p>}
      {application?.status === "pending" && <p role="status" className="mt-6 border border-[#e7d5a6] bg-[#fff9e9] p-4 text-sm text-[#695622]">Your application is awaiting administrator review. You can manage listings after approval.</p>}
      {application?.status === "rejected" && <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">Your application was not approved. Update your details and resubmit for review.{application.admin_notes ? ` Review note: ${application.admin_notes}` : ""}</p>}
      {application?.status === "suspended" && <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">Your advertiser access is suspended. Contact an administrator for assistance.</p>}
      {application?.status === "approved" && <p role="status" className="mt-6 border border-[#a8c3a8] bg-[#edf5eb] p-4 text-sm text-[#294d34]">Advertiser application approved.</p>}

      {!application || application.status === "rejected" ? (
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-[#213329]">Advertiser application</h2>
          <p className="mt-2 text-sm leading-6 text-[#687168]">We review property authority before listings go live. Your phone and WhatsApp details are used for property enquiries.</p>
          <ApplicationForm application={application} />
        </section>
      ) : null}

      {application?.status === "approved" && (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-[#d9d9ce] bg-[#fffdf9] p-4"><p className="text-xs font-semibold uppercase text-[#72786f]">Total listings</p><p className="mt-2 text-2xl font-bold text-[#1d2e29]">{accommodationListings.length}</p></div>
            <div className="border border-[#d9d9ce] bg-[#fffdf9] p-4"><p className="text-xs font-semibold uppercase text-[#72786f]">Active listings</p><p className="mt-2 text-2xl font-bold text-[#1d2e29]">{activeListings.length}{accommodationPlan ? <span className="ml-1 text-sm font-semibold text-[#72786f]">/ {currentSubscription?.listing_limit ?? accommodationPlan.listingLimit}</span> : null}</p></div>
            <div className="border border-[#d9d9ce] bg-[#fffdf9] p-4"><p className="text-xs font-semibold uppercase text-[#72786f]">Available rooms</p><p className="mt-2 text-2xl font-bold text-[#1d2e29]">{hasRoomCounts ? availableRooms : "—"}</p></div>
            <div className="border border-[#d9d9ce] bg-[#fffdf9] p-4"><p className="text-xs font-semibold uppercase text-[#72786f]">Plan status</p><p className="mt-2 text-lg font-bold text-[#1d2e29]">{currentSubscription ? `Active until ${new Date(currentSubscription.expires_at).toLocaleDateString("en-GH")}` : "Not active"}</p></div>
          </section>

          {!currentSubscription && accommodationPlan && (
            <section className="mt-6 border border-[#e7d5a6] bg-[#fff9e9] p-5">
              <h2 className="font-bold text-[#4e452e]">Activate your Accommodation Advertiser plan</h2>
              {accommodationPlan.price === 0 ? (
                <form action={activateFreeAccommodationPlanAction} className="mt-3">
                  <p className="text-sm text-[#695622]">This plan is currently free. Activate it to unlock {accommodationPlan.listingLimit} active accommodation listings.</p>
                  <button type="submit" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0f564a] px-4 text-sm font-bold text-white">Activate free plan</button>
                </form>
              ) : (
                <p className="mt-2 text-sm leading-6 text-[#695622]">This plan costs {formatPrice(accommodationPlan.price)} / {accommodationPlan.billingPeriod}. <Link className="font-bold underline" href="/pricing#plan-accommodation_advertiser">Pay and submit your reference</Link>; an admin will activate your subscription after verification.</p>
              )}
            </section>
          )}

          {canManageListings && (
            <>
              <section className="mt-8 border-t border-[#d9d9ce] pt-8">
                <h2 className="font-serif text-2xl text-[#213329]">Add accommodation</h2>
                <form action={createAccommodationListingAction} className="mt-5 border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
                  <PropertyFields />
                  <label className="mt-4 block text-sm font-semibold text-[#2d3931]">Property photos (up to 3)
                    <input className="form-control mt-1 py-3" type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple />
                  </label>
                  <button type="submit" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0f564a] px-5 text-sm font-bold text-white hover:bg-[#0b433b]">Add accommodation</button>
                </form>
              </section>

              <section className="mt-10 border-t border-[#d9d9ce] pt-8">
                <h2 className="font-serif text-2xl text-[#213329]">Manage listings</h2>
                {accommodationListings.length === 0 ? (
                  <p className="mt-4 text-sm text-[#687168]">You have not added any accommodation yet.</p>
                ) : (
                  <div className="mt-5 space-y-5">
                    {accommodationListings.map((listing) => (
                      <article key={listing.id} className="border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
                        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-xl text-[#213329]">{listing.title}</h3>
                            <p className="mt-1 text-sm text-[#687168]">{listing.town} · {formatPrice(listing.price)} / month · {listing.accommodation_status}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {listing.image_urls.slice(0, 3).map((url) => <img key={url} src={url} alt="Property" className="h-14 w-20 rounded object-cover" />)}
                          </div>
                        </div>
                        <details>
                          <summary className="cursor-pointer text-sm font-bold text-[#315643]">Edit property details</summary>
                          <form action={updateAccommodationListingAction} className="mt-4">
                            <input type="hidden" name="listingId" value={listing.id} />
                            <PropertyFields listing={listing} />
                            <button type="submit" className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d2d4c9] px-4 text-sm font-bold text-[#315643] hover:bg-white">Save details</button>
                          </form>
                        </details>
                        <form action={setAccommodationListingStatusAction} className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#e6e4da] pt-4">
                          <input type="hidden" name="listingId" value={listing.id} />
                          <label className="text-sm font-semibold text-[#2d3931]">Availability
                            <select className={inputClass} name="accommodationStatus" defaultValue={listing.accommodation_status ?? "available"}>
                              <option value="available">Available</option>
                              <option value="paused">Paused</option>
                              <option value="unavailable">Unavailable</option>
                              <option value="rented">Rented</option>
                            </select>
                          </label>
                          <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[#d2d4c9] px-4 text-sm font-bold text-[#315643] hover:bg-white">Update status</button>
                        </form>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </main>
  );
}