import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AuthControl } from "@/components/marketplace/auth-control";

function BrandBadge() {
  return (
    <span className="relative grid h-20 w-20 place-items-center rounded-full border-[4px] border-[#d9b36b] bg-[#0f564a] shadow-[0_0_0_3px_rgba(15,86,74,0.12)] sm:h-28 sm:w-28">
      <span className="flex flex-col items-center leading-[0.74]">
        <span className="text-[0.9rem] font-black tracking-[-0.16em] text-[#d9b36b] [font-family:Georgia,serif] sm:text-[2.15rem]">COLLEGE</span>
        <span className="mt-[-0.1rem] text-[0.9rem] font-black tracking-[-0.16em] text-[#d9b36b] [font-family:Georgia,serif] sm:text-[2.15rem]">MRKT</span>
      </span>
      <span className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 text-[#d9b36b]">
        <svg viewBox="0 0 32 18" className="h-4 w-8 text-[#d9b36b]" aria-hidden="true">
          <path d="M4 16c1.7-5.4 5.1-8.1 9.5-8.1V3.1C7.8 3.1 4.5 6 4 16Zm12.5 0c1.7-5.4 5.1-8.1 9.5-8.1V3.1c-5.7 0-9 2.9-9.5 12.9Z" fill="currentColor" opacity="0.85"/>
          <path d="M9 18c1.6-3.2 4.2-4.8 7.4-4.8V9.3c-4.6 0-7.3 2.2-7.4 8.7Z" fill="currentColor" opacity="0.7"/>
          <path d="M20.5 18c1.6-3.2 4.2-4.8 7.4-4.8v-3.9c-4.6 0-7.3 2.2-7.4 8.7Z" fill="currentColor" opacity="0.7"/>
        </svg>
        <span className="text-xs leading-none sm:text-sm">★</span>
        <svg viewBox="0 0 32 18" className="h-4 w-8 text-[#d9b36b]" aria-hidden="true" style={{ transform: "scaleX(-1)" }}>
          <path d="M4 16c1.7-5.4 5.1-8.1 9.5-8.1V3.1C7.8 3.1 4.5 6 4 16Zm12.5 0c1.7-5.4 5.1-8.1 9.5-8.1V3.1c-5.7 0-9 2.9-9.5 12.9Z" fill="currentColor" opacity="0.85"/>
          <path d="M9 18c1.6-3.2 4.2-4.8 7.4-4.8V9.3c-4.6 0-7.3 2.2-7.4 8.7Z" fill="currentColor" opacity="0.7"/>
          <path d="M20.5 18c1.6-3.2 4.2-4.8 7.4-4.8v-3.9c-4.6 0-7.3 2.2-7.4 8.7Z" fill="currentColor" opacity="0.7"/>
        </svg>
      </span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#d4c8ab] bg-[#f4efe7]/95 backdrop-blur">
      <div className="mx-auto flex h-[66px] w-full max-w-[1440px] items-center justify-between px-4 sm:h-[78px] sm:px-7 lg:px-10">
        <Link href="/" aria-label="College MRKT home" className="flex items-center gap-2.5">
          <BrandBadge />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-7">
          <Link href="/" className="hidden text-sm font-semibold text-[#1d2e29] hover:text-[#0f564a] sm:block">Marketplace</Link>
          <AuthControl />
          <Link href="/listings/new" className="inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap bg-[#0f564a] px-2.5 text-xs font-bold text-[#f6f0e4] transition-colors hover:bg-[#0b433b] sm:gap-2 sm:px-4 sm:text-sm">
            <span className="sm:hidden">Sell</span><span className="hidden sm:inline">Sell an item</span><ArrowUpRight aria-hidden="true" className="hidden h-4 w-4 sm:block" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
