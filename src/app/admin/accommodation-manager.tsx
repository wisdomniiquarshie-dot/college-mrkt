import { formatPrice, type AccommodationAdvertiserApplication, type Listing } from "@/lib/marketplace";
import { moderateAccommodationListingAction, reviewAccommodationApplicationAction } from "./accommodation-actions";

export function AccommodationManager({
  applications,
  listings,
  schemaReady,
}: {
  applications: AccommodationAdvertiserApplication[];
  listings: Listing[];
  schemaReady: boolean;
}) {
  if (!schemaReady) {
    return (
      <section className="mt-12 border-t border-[#d9d9ce] pt-8">
        <h2 className="font-serif text-3xl text-[#213329]">Accommodation review</h2>
        <p role="alert" className="mt-4 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm leading-6 text-[#873e2d]">Accommodation tables are missing. Run the accommodation migration in supabase/schema.sql.</p>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-[#d9d9ce] pt-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase text-[#c35335]">Accommodation Advertiser</p>
        <h2 className="mt-2 font-serif text-3xl text-[#213329]">Applications and listings</h2>
        <p className="mt-2 text-sm leading-6 text-[#687168]">Approve only after checking the advertiser has authority to represent the property. Suspending an advertiser hides their current accommodation listings.</p>
      </div>

      <div className="mt-6">
        <h3 className="font-serif text-2xl text-[#22362a]">Applications <span className="font-sans text-sm font-semibold text-[#687168]">({applications.length})</span></h3>
        {applications.length === 0 ? (
          <p className="mt-3 text-sm text-[#687168]">No advertiser applications yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {applications.map((application) => (
              <article key={application.id} className="border border-[#d9d9ce] bg-[#fffdf9] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-[#213329]">{application.business_name}</h4>
                    <p className="mt-1 text-sm text-[#687168]">{application.applicant_name} · {application.applicant_role.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-sm text-[#687168]">{application.phone_number} · WhatsApp {application.whatsapp_number}</p>
                    <p className="mt-1 text-sm text-[#687168]">{application.town} · {application.property_address}</p>
                    <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-[#46564b]">{application.description}</p>
                    <p className="mt-2 text-xs font-semibold text-[#426148]">Property authority confirmed</p>
                    {application.admin_notes && <p className="mt-2 text-sm text-[#873e2d]">Review note: {application.admin_notes}</p>}
                    <p className="mt-2 text-xs text-[#687168]">Status: {application.status}</p>
                  </div>
                  <p className="text-xs text-[#687168]">Account {application.user_id}</p>
                </div>
                <form action={reviewAccommodationApplicationAction} className="mt-5 grid gap-3 border-t border-[#e6e4da] pt-4 sm:grid-cols-[1fr_190px_auto] sm:items-end">
                  <input type="hidden" name="applicationId" value={application.id} />
                  <label className="text-xs font-semibold text-[#2d3931]">Review note
                    <input className="form-control mt-1" name="adminNotes" maxLength={1000} defaultValue={application.admin_notes ?? ""} />
                  </label>
                  <label className="text-xs font-semibold text-[#2d3931]">Decision
                    <select className="form-control mt-1" name="status" defaultValue={application.status === "approved" ? "suspended" : "approved"}>
                      <option value="approved">Approve</option>
                      <option value="rejected">Reject</option>
                      <option value="suspended">Suspend</option>
                    </select>
                  </label>
                  <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#0f564a] px-4 text-sm font-bold text-white hover:bg-[#0b433b]">Save review</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="mt-9">
        <h3 className="font-serif text-2xl text-[#22362a]">Accommodation listings <span className="font-sans text-sm font-semibold text-[#687168]">({listings.length})</span></h3>
        {listings.length === 0 ? (
          <p className="mt-3 text-sm text-[#687168]">No accommodation listings to moderate.</p>
        ) : (
          <div className="mt-4 divide-y divide-[#e6e4da] border-y border-[#d9d9ce]">
            {listings.map((listing) => (
              <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-semibold text-[#213329]">{listing.title} · {formatPrice(listing.price)} / month</p>
                  <p className="mt-1 text-xs text-[#687168]">{listing.town} · {listing.accommodation_status} · {listing.status}</p>
                </div>
                {listing.status !== "hidden" && (
                  <form action={moderateAccommodationListingAction}>
                    <input type="hidden" name="listingId" value={listing.id} />
                    <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d7b6aa] px-3 text-xs font-bold text-[#873e2d] hover:bg-[#fff0eb]">Hide listing</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}