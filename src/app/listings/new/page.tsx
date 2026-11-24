import { CreateListingForm } from "@/components/marketplace/create-listing-form";
import { getAvailablePlanDefinitions, getMarketplacePaymentSettings } from "@/lib/marketplace-server";

export default async function NewListingPage() {
  const [plans, paymentSettings] = await Promise.all([
    getAvailablePlanDefinitions(),
    getMarketplacePaymentSettings(),
  ]);
  return <CreateListingForm plans={plans} paymentSettings={paymentSettings} />;
}
