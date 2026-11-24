import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { AuthControl } from "@/components/marketplace/auth-control";
import { getMarketplaceAdminSession } from "@/lib/marketplace-admin";

function BrandBadge() {
  return (
    <span className="grid h-[52px] w-[52px] place-items-center rounded-full border-2 border-[#d1b07a] bg-[#15452e] text-sm font-black tracking-[-0.08em] text-[#fff8e8] shadow-[0_0_0_3px_rgba(209,176,122,0.2)] sm:h-16 sm:w-16 sm:text-base">
      CM
    </span>
  );
}

export async function SiteHeader() {
  const admin = await getMarketplaceAdminSession();

  return (
    <header className="site-header sticky top-0 z-30">
      <div className="site-utility">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <span><MapPin aria-hidden="true" size={13} /> ATU, Accra · open to every campus</span>
        </div>
      </div>
      <div className="site-header-main mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="College MRKT home" className="site-brand">
          <BrandBadge />
          <span><strong>COLLEGE MRKT</strong><small>GOOD FINDS, CLOSE BY</small></span>
        </Link>
        <nav aria-label="Main navigation" className="site-nav">
          <Link href="/" className="hidden text-sm font-semibold sm:block">Marketplace</Link>
          {admin && <Link href="/admin" className="hidden text-sm font-semibold sm:block">Admin</Link>}
          <AuthControl />
          <Link href="/listings/new" className="site-sell-button"><span className="sm:hidden">Sell</span><span className="hidden sm:inline">Start selling</span><ArrowUpRight aria-hidden="true" size={16} /></Link>
        </nav>
      </div>
    </header>
  );
}
