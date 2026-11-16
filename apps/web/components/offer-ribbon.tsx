import Link from "next/link";
import type { OfferRibbonDict } from "@/lib/i18n/types";

/**
 * Slim, site-wide launch-offer ribbon. Fixed at the very top, above the Nav.
 * Non-dismissible by design (time-bound launch promo). Height is 36px (h-9);
 * the Nav is offset by `top-9` and `<main>` is padded by `pt-9` in layout.tsx
 * to make room for it.
 */
export function OfferRibbon({ dict }: { dict?: OfferRibbonDict }) {
  const ariaLabel = dict?.ariaLabel ?? "Launch offer: 30 days of Premium free";
  const badge = dict?.badge ?? "🎉";
  const highlight = dict?.highlight ?? "30 days of Premium, free at launch";
  const suffix = dict?.suffix ?? " — AI nutritionist & daily meal scans included";

  return (
    <Link
      href="/#premium"
      aria-label={ariaLabel}
      className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center overflow-hidden px-4 text-center transition-opacity hover:opacity-95"
      style={{
        background: "linear-gradient(90deg, #efbd44 0%, #f5a623 100%)",
        color: "#1a1206",
      }}
    >
      <span className="truncate text-[11px] font-semibold tracking-tight sm:text-[12.5px]">
        {badge} {highlight}
        <span className="hidden sm:inline">{suffix}</span>
      </span>
    </Link>
  );
}
