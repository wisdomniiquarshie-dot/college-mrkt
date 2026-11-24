import { formatPrice, type PaymentRequest } from "@/lib/marketplace";
import { getMarketplaceAdminSession } from "@/lib/marketplace-admin";
import { PlanManager } from "./plan-manager";
import { PaymentManager } from "./payment-manager";
import { AccommodationManager } from "./accommodation-manager";
import { hideListingAction, resolveReportAction } from "./actions";
import type { MarketplacePaymentSettings } from "@/lib/marketplace";
import { redirect } from "next/navigation";

async function getAdminDashboard() {
  const admin = await getMarketplaceAdminSession();
  if (!admin) return { status: "access-denied" as const };

  const { data: profile, error: profileError } = await admin.supabase
    .from("seller_profiles")
    .select("role")
    .eq("id", admin.user.id)
    .maybeSingle();

  if (profileError) return { status: "profile-query-failed" as const };
  if (!profile) return { status: "profile-missing" as const, userId: admin.user.id };

  const allowedRoles = new Set(["admin", "moderator"]);
  if (!allowedRoles.has((profile.role ?? "") as string)) {
    return { status: "role-required" as const, userId: admin.user.id, role: profile.role };
  }

  const [
    { data: listings },
    { data: reports },
    { data: plans, error: plansError },
    { data: paymentSettings, error: paymentSettingsError },
    { data: paymentRequests, error: paymentRequestsError },
    { data: accommodationApplications, error: accommodationApplicationsError },
    { data: accommodationListings, error: accommodationListingsError },
  ] = await Promise.all([
    admin.supabase.from("listings").select("*").order("created_at", { ascending: false }).limit(20),
    admin.supabase.from("listing_reports").select("*").order("created_at", { ascending: false }).limit(20),
    admin.supabase.from("marketplace_plan_settings").select("*").order("price_ghs", { ascending: true }),
    admin.supabase.from("marketplace_payment_settings").select("*").eq("id", true).maybeSingle(),
    admin.supabase.from("payment_requests").select("*").eq("verification_status", "pending").order("created_at", { ascending: true }),
    admin.supabase.from("accommodation_advertiser_applications").select("*").order("created_at", { ascending: false }).limit(100),
    admin.supabase.from("listings").select("*").eq("category", "Accommodation").order("created_at", { ascending: false }).limit(100),
  ]);

  type DashboardListing = {
    id: string;
    title: string;
    price: number | string;
    status?: string;
  };

  type DashboardReport = {
    id: string;
    listing_id: string;
    reason: string;
    details: string | null;
  };

  return {
    status: "ready" as const,
    listings: ((listings ?? []) as DashboardListing[]),
    reports: ((reports ?? []) as DashboardReport[]),
    plans: plans ?? [],
    planSchemaReady: !plansError,
    paymentSchemaReady: !paymentSettingsError && !paymentRequestsError,
    paymentSettings: (paymentSettings ?? null) as MarketplacePaymentSettings | null,
    paymentRequests: (paymentRequests ?? []) as PaymentRequest[],
    accommodationApplications: accommodationApplications ?? [],
    accommodationListings: accommodationListings ?? [],
    accommodationSchemaReady: !accommodationApplicationsError && !accommodationListingsError,
  };
}

const feedbackMessages: Record<string, string> = {
  "plan-saved": "Plan settings saved. Existing subscriptions were not changed.",
  "payment-settings-saved": "Mobile Money destination saved.",
  "payment-verified": "Payment verified and the saved subscription terms are now active.",
  "payment-rejected": "Payment request rejected.",
  "accommodation-reviewed": "Accommodation advertiser review saved.",
  "accommodation-listing-hidden": "Accommodation listing hidden from public view.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [dashboard, query] = await Promise.all([getAdminDashboard(), searchParams]);

  if (dashboard.status === "access-denied") redirect("/");

  if (dashboard.status !== "ready") {
    const accessMessage = dashboard.status === "profile-query-failed"
      ? "The seller profile table could not be read. Run supabase/schema.sql in the Supabase SQL Editor."
      : dashboard.status === "profile-missing"
        ? "This account has no seller profile. Run the profile setup from supabase/schema.sql, then sign in again."
        : `This account is signed in with role "${dashboard.role}". The authorized email also needs the admin role. Run the updated supabase/schema.sql to grant it.`;
    return (
      <main className="mx-auto w-full max-w-[900px] px-4 py-16 sm:px-7 lg:px-10">
        <div className="rounded-2xl border border-[#e5d3b8] bg-[#fff7ea] p-8 text-sm leading-6 text-[#5b5246]">
          <h1 className="font-serif text-2xl text-[#3f382e]">Admin setup required</h1>
          <p className="mt-3">{accessMessage}</p>
                {dashboard.status === "role-required" && (
                  <div className="mt-5 border-t border-[#e5d3b8] pt-4">
                    <p>Only wisdomniiquarshie@gmail.com can access this panel. The updated schema assigns the admin role to that account.</p>
                  </div>
                )}
        </div>
      </main>
    );
  }

  const activeListings = dashboard.listings.filter((listing) => listing.status !== "hidden");
  const flaggedListings = dashboard.reports.length;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-8 sm:px-7 lg:px-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c35335]">Admin dashboard</p>
        <h1 className="mt-3 font-serif text-4xl text-[#213329] sm:text-5xl">Marketplace moderation</h1>
        <p className="mt-4 text-sm leading-6 text-[#616b62]">
          Review reports, manage content quality, and keep the student marketplace safe and fair.
        </p>
      </div>

      {query.success && feedbackMessages[query.success] && (
        <p role="status" className="mt-6 border border-[#a8c3a8] bg-[#edf5eb] p-4 text-sm text-[#294d34]">{feedbackMessages[query.success]}</p>
      )}
      {query.error && (
        <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">
          The requested admin action could not be completed ({query.error}). Check that the required Supabase tables and policies from supabase/schema.sql are installed.
        </p>
      )}

      {!dashboard.planSchemaReady && (
        <p role="alert" className="mt-6 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">
          Plan settings are missing from Supabase. A project owner must run supabase/schema.sql in the Supabase SQL Editor.
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#d9d9ce] bg-[#fffdf9] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#758176]">Active listings</p>
          <p className="mt-3 text-3xl font-bold text-[#213329]">{activeListings.length}</p>
        </div>
        <div className="rounded-2xl border border-[#d9d9ce] bg-[#fffdf9] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#758176]">Open reports</p>
          <p className="mt-3 text-3xl font-bold text-[#213329]">{flaggedListings}</p>
        </div>
        <div className="rounded-2xl border border-[#d9d9ce] bg-[#fffdf9] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#758176]">Moderation status</p>
          <p className="mt-3 text-xl font-bold text-[#213329]">Enabled</p>
        </div>
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-2xl border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
          <h2 className="font-serif text-2xl text-[#22362a]">Recent reports</h2>
          {dashboard.reports.length === 0 ? (
            <p className="mt-4 text-sm text-[#677368]">No open reports yet. The marketplace is running cleanly.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {dashboard.reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-[#e3e4db] bg-[#f9f7f2] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#213329]">Listing report</p>
                    <span className="rounded-full border border-[#d9b36b] bg-[#f5efe6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6e5631]">
                      {report.reason}
                    </span>
                  </div>
                  {report.details && <p className="mt-2 text-sm leading-6 text-[#5d645f]">{report.details}</p>}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <form action={hideListingAction}>
                      <input type="hidden" name="listingId" value={report.listing_id} />
                      <button type="submit" className="inline-flex min-h-10 items-center justify-center bg-[#c35335] px-3 text-xs font-bold text-white hover:bg-[#ab472a]">
                        Hide listing
                      </button>
                    </form>
                    <form action={resolveReportAction}>
                      <input type="hidden" name="reportId" value={report.id} />
                      <button type="submit" className="inline-flex min-h-10 items-center justify-center border border-[#d2d4c9] bg-white px-3 text-xs font-bold text-[#31463a] hover:bg-[#f1f2ec]">
                        Resolve report
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
          <h2 className="font-serif text-2xl text-[#22362a]">Live listings</h2>
          <div className="mt-5 space-y-3">
            {dashboard.listings.slice(0, 8).map((listing) => (
              <div key={listing.id} className="rounded-xl border border-[#e3e4db] bg-[#f9f7f2] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#213329]">{listing.title}</p>
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#546057]">{listing.status}</span>
                </div>
                <p className="mt-2 text-sm text-[#58635d]">{formatPrice(Number(listing.price))}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
      <PaymentManager
        settings={dashboard.paymentSettings}
        requests={dashboard.paymentRequests}
        schemaReady={dashboard.paymentSchemaReady}
      />
      <AccommodationManager
        applications={dashboard.accommodationApplications}
        listings={dashboard.accommodationListings}
        schemaReady={dashboard.accommodationSchemaReady}
      />
      {dashboard.planSchemaReady && <PlanManager plans={dashboard.plans} />}
    </main>
  );
}
