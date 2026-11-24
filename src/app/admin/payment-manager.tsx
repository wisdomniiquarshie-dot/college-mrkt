import { formatPrice, type MarketplacePaymentSettings, type PaymentRequest } from "@/lib/marketplace";
import { rejectPaymentRequestAction, savePaymentSettingsAction, verifyPaymentRequestAction } from "@/app/pricing/payment-actions";

const inputClassName = "form-control mt-1";

export function PaymentManager({
  settings,
  requests,
  schemaReady,
}: {
  settings: MarketplacePaymentSettings | null;
  requests: PaymentRequest[];
  schemaReady: boolean;
}) {
  if (!schemaReady) {
    return (
      <section className="mt-12 border-t border-[#d9d9ce] pt-8">
        <h2 className="font-serif text-3xl text-[#213329]">Payments</h2>
        <p role="alert" className="mt-4 border border-[#e7b7aa] bg-[#fff0eb] p-4 text-sm leading-6 text-[#873e2d]">
          Payment tables are missing from this Supabase project. A project owner must run the payment and plan sections of <code>supabase/schema.sql</code> in the Supabase SQL Editor.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-[#d9d9ce] pt-8">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#c35335]">Manual Mobile Money</p>
        <h2 className="mt-2 font-serif text-3xl text-[#213329]">Payment instructions</h2>
        <p className="mt-3 text-sm leading-6 text-[#616b62]">Customers transfer the exact displayed plan price outside the app, then submit their reference for administrator verification. No payment is activated before verification.</p>
      </div>

      <form action={savePaymentSettingsAction} className="mt-5 border border-[#d9d9ce] bg-[#fffdf9] p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-[#2d3931]">Mobile Money method
            <select className={inputClassName} name="network" defaultValue={settings?.network ?? "MTN MoMo"} required>
              <option>Mobile Money</option>
              <option>MTN MoMo</option>
              <option>Telecel Cash</option>
              <option>AT Money</option>
              <option>Other</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-[#2d3931]">Recipient name
            <input className={inputClassName} name="recipientName" defaultValue={settings?.recipient_name ?? ""} maxLength={100} />
          </label>
          <label className="text-sm font-semibold text-[#2d3931]">Recipient number
            <input className={inputClassName} name="recipientNumber" type="tel" defaultValue={settings?.recipient_number ?? ""} required maxLength={30} />
          </label>
          <label className="text-sm font-semibold text-[#2d3931] sm:col-span-2">Transfer instructions
            <textarea className={inputClassName} name="instructions" defaultValue={settings?.instructions ?? ""} rows={3} maxLength={1000} placeholder="Add a payment reference format or other transfer instructions." />
          </label>
        </div>
        <button type="submit" className="mt-5 inline-flex min-h-10 items-center justify-center bg-[#0f564a] px-4 text-sm font-bold text-[#f6f0e4] hover:bg-[#0b433b]">Save payment details</button>
      </form>

      <div className="mt-8">
        <h3 className="font-serif text-2xl text-[#22362a]">Pending payments <span className="font-sans text-sm font-semibold text-[#687168]">({requests.length})</span></h3>
        {requests.length === 0 ? (
          <p className="mt-4 text-sm text-[#677368]">No payment requests are waiting for review.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <article key={request.id} className="border border-[#d9d9ce] bg-[#fffdf9] p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#213329]">{request.plan_name} · {formatPrice(Number(request.amount_ghs))}</h4>
                    <p className="mt-1 text-xs leading-5 text-[#687168]">{request.payment_method} · Reference {request.payment_reference} · Paid {request.payment_date}</p>
                    <p className="mt-1 break-all text-xs text-[#687168]">Account {request.user_id}</p>
                    <p className="mt-2 text-xs text-[#687168]">Submitted {new Date(request.created_at).toLocaleString("en-GH")}</p>
                  </div>
                  <form action={verifyPaymentRequestAction}>
                    <input type="hidden" name="requestId" value={request.id} />
                    <button type="submit" className="inline-flex min-h-10 items-center justify-center bg-[#0f564a] px-4 text-sm font-bold text-[#f6f0e4] hover:bg-[#0b433b]">Verify and activate</button>
                  </form>
                </div>
                <form action={rejectPaymentRequestAction} className="mt-4 flex flex-col gap-3 border-t border-[#e6e4da] pt-4 sm:flex-row sm:items-end">
                  <input type="hidden" name="requestId" value={request.id} />
                  <label className="flex-1 text-xs font-semibold text-[#2d3931]">Rejection reason
                    <input className={inputClassName} name="reason" required maxLength={500} />
                  </label>
                  <button type="submit" className="inline-flex min-h-10 items-center justify-center border border-[#d2d4c9] px-4 text-sm font-bold text-[#873e2d] hover:bg-[#fff0eb]">Reject</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}