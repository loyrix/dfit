"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { DownloadBadges } from "@/components/download-badges";
import { isLaunchOfferActive } from "@/config/app";

// Bump the version suffix to re-show the popup to returning visitors.
const SEEN_KEY = "lmp_launch_offer_seen_v1";

/**
 * First-visit launch-offer popup. Shows once per visitor (localStorage) while
 * the offer is active; auto-disabled after `offerEndDate`. Dismissible via the
 * close button, backdrop click, or Escape.
 */
export function LaunchOfferModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isLaunchOfferActive()) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // localStorage unavailable (private mode) — treat as not seen.
    }
    if (seen) return;
    const timer = window.setTimeout(() => setOpen(true), 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="LogMyPlate launch offer"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close offer"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
        style={{ animation: "lmpFade 200ms ease-out" }}
      />
      <div
        className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-[28px] shadow-2xl"
        style={{ background: "var(--app-card-strong)", border: "1px solid var(--border)" }}
      >
        <button
          type="button"
          aria-label="Close offer"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95"
          style={{ background: "rgba(0,0,0,0.45)", color: "#fff" }}
        >
          <X size={18} />
        </button>

        <div className="overflow-y-auto">
          <Image
            src="/promo/launch-offer-portrait.webp"
            alt="LogMyPlate 30 days free launch offer: 5 AI meal scans a day, extra scans via ads, and premium features"
            width={1080}
            height={1935}
            priority
            sizes="(max-width: 420px) 92vw, 384px"
            className="h-auto w-full"
          />
          <div className="flex flex-col items-center gap-3 p-5">
            <DownloadBadges size="md" />
            <button
              type="button"
              onClick={dismiss}
              className="text-[13px] underline underline-offset-4 opacity-60 transition-opacity hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
