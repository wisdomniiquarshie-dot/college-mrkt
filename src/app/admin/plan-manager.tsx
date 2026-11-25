import type { MarketplacePlan } from "@/lib/marketplace";
import { savePlanAction } from "./plan-actions";

function dateInputValue(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function fieldClassName() {
  return "form-control mt-1";
}

export function PlanManager({ plans }: { plans: MarketplacePlan[] }) {
  return (
    <section className="mt-12 border-t border-[#d9d9ce] pt-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c35335]">Plan settings</p>
        <h2 className="mt-2 font-serif text-3xl text-[#213329]">Plans and pricing</h2>
        <p className="mt-3 text-sm leading-6 text-[#616b62]">
          Student Seller, Student Business and Business Plus are free for now. Saving plan settings affects new purchases only; existing subscriptions keep their saved terms until an administrator explicitly changes them.
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {plans.map((plan) => (
          <form key={plan.id} action={savePlanAction} className="border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
            <input type="hidden" name="planId" value={plan.id} />
            <input type="hidden" name="planKey" value={plan.plan_key} />
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl text-[#24342a]">{plan.plan_name}</h3>
                <p className="mt-1 text-sm text-[#687168]">Current price: GH₵0 / {plan.billing_period}</p>
              </div>
              <button type="submit" className="inline-flex min-h-10 items-center justify-center bg-[#0f564a] px-4 text-sm font-bold text-[#f6f0e4] hover:bg-[#0b433b]">
                Save plan
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="text-sm font-semibold text-[#2d3931]">Plan name
                <input className={fieldClassName()} name="planName" defaultValue={plan.plan_name} required maxLength={100} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Billing period
                <input className={fieldClassName()} name="billingPeriod" defaultValue={plan.billing_period} required maxLength={40} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2 lg:col-span-3">Description
                <textarea className={fieldClassName()} name="description" defaultValue={plan.description ?? ""} required rows={2} maxLength={500} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Minimum proposed price (GH₵)
                <input className={fieldClassName()} name="minProposedPrice" type="number" min="0" step="0.01" defaultValue={plan.min_proposed_price ?? ""} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Maximum proposed price (GH₵)
                <input className={fieldClassName()} name="maxProposedPrice" type="number" min="0" step="0.01" defaultValue={plan.max_proposed_price ?? ""} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Active listing allowance
                <input className={fieldClassName()} name="listingLimit" type="number" min="1" step="1" defaultValue={plan.listing_limit} required />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Promotion duration (days)
                <input className={fieldClassName()} name="promotionDurationDays" type="number" min="0" step="1" defaultValue={plan.promotion_duration_days} required />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">AI generations per period
                <input className={fieldClassName()} name="aiGenerationLimit" type="number" min="0" step="1" defaultValue={plan.ai_generation_limit} required />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Start date
                <input className={fieldClassName()} name="effectiveStart" type="date" defaultValue={dateInputValue(plan.effective_start)} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Expiry date
                <input className={fieldClassName()} name="effectiveEnd" type="date" defaultValue={dateInputValue(plan.effective_end)} />
              </label>
              <label className="text-sm font-semibold text-[#2d3931]">Subscription status
                <select className={fieldClassName()} name="subscriptionStatus" defaultValue={plan.subscription_status}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2 lg:col-span-3">Package benefits, one per line
                <textarea className={fieldClassName()} name="benefits" defaultValue={plan.benefits.join("\n")} rows={4} />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#e6e4da] pt-4">
              <label className="inline-flex items-center gap-2 text-sm text-[#31463a]"><input type="checkbox" name="isActive" defaultChecked={plan.is_active} /> Active</label>
              <label className="inline-flex items-center gap-2 text-sm text-[#31463a]"><input type="checkbox" name="promotionAvailable" defaultChecked={plan.promotion_available} /> Promotion available</label>
              <label className="inline-flex items-center gap-2 text-sm text-[#31463a]"><input type="checkbox" name="availableForPurchase" defaultChecked={plan.available_for_purchase} /> Available for new purchases</label>
            </div>
          </form>
        ))}
      </div>
    </section>
  );
}