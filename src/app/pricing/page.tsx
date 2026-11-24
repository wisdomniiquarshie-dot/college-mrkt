import Link from "next/link";
import { Check } from "lucide-react";
import { formatPrice } from "@/lib/marketplace";
import { getAvailablePlanDefinitions } from "@/lib/marketplace-server";

export default async function PricingPage() {
  const allPlans = await getAvailablePlanDefinitions();
  const plans = allPlans?.filter((plan) => (
    plan.key === "student_seller"
    || plan.key === "student_business"
    || plan.key === "campus_business"
  )) ?? null;
  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-8 sm:px-7 lg:px-10">
      <div className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c35335]">Plans & pricing</p>
        <h1 className="mt-3 font-serif text-4xl text-[#213329] sm:text-5xl">Choose the right plan for your campus business.</h1>
        <p className="mt-4 text-sm leading-6 text-[#616b62]">
          Every marketplace plan is free. Choose the listing allowance that works for you.
        </p>
      </div>

      {plans === null ? (
        <p role="alert" className="mt-10 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm text-[#873e2d]">
          Current plan pricing is unavailable. Please try again later.
        </p>
      ) : plans.length === 0 ? (
        <p className="mt-10 border border-[#d9d9ce] bg-[#fffdf9] p-4 text-sm text-[#687168]">
          There are no plans available for new purchases right now.
        </p>
      ) : (
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div id={`plan-${plan.key}`} key={plan.key} className="rounded-2xl border border-[#d9d9ce] bg-[#fffdf9] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-[#24342a]">{plan.name}</h2>
              <span className="rounded-full border border-[#d9b36b] bg-[#f5efe6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6e5631]">
                {plan.listingLimit} listings
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#1f3829]">{plan.price === 0 ? "GH₵0" : formatPrice(plan.price)}</p>
            <p className="mt-1 text-xs font-semibold uppercase text-[#687168]">Free for everyone</p>
            <p className="mt-3 text-sm leading-6 text-[#687168]">{plan.description}</p>
            {(plan.minProposedPrice !== null || plan.maxProposedPrice !== null) && (
              <p className="mt-3 text-xs leading-5 text-[#687168]">
                Proposed price range: {plan.minProposedPrice === null ? "no minimum" : formatPrice(plan.minProposedPrice)} to {plan.maxProposedPrice === null ? "no maximum" : formatPrice(plan.maxProposedPrice)}. This range is not the amount charged.
              </p>
            )}
            <ul className="mt-5 space-y-3 text-sm text-[#425047]">
              {plan.details.map((detail) => (
                <li key={detail} className="flex items-start gap-2">
                  <Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#3e6d5d]" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      )}

      <div className="mt-10 rounded-2xl border border-[#d1d9cf] bg-[#f5f7f0] p-6">
        <h2 className="font-serif text-2xl text-[#214033]">Free student seller rule</h2>
        <p className="mt-3 text-sm leading-6 text-[#5d645f]">
          Individual student sellers get up to 5 active listings at a time. If you reach the limit, mark a product as sold or remove an active listing before posting another item.
        </p>
        <div className="mt-6">
          <Link href="/listings/new" className="inline-flex min-h-11 items-center justify-center bg-[#0f564a] px-5 text-sm font-bold text-[#f6f0e4] transition-colors hover:bg-[#0b433b]">
            Post an item
          </Link>
        </div>
      </div>
    </main>
  );
}
