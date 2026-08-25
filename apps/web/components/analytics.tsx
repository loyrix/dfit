"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { GA_MEASUREMENT_ID, shouldLoadAnalytics, trackPageView } from "@/lib/analytics";

/**
 * Loads GA4 and reports client-side route changes.
 *
 * Whether to load is a hostname decision, which only exists in the browser —
 * hence the mount-gated state rather than a render-time check. On the server
 * and on any non-production host this renders nothing at all.
 *
 * This is the same GA4 property the mobile app reports to via Firebase, which
 * is what lets a website visit and an Android install line up in one funnel.
 */
export function Analytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  // The tag's own `config` call sends the first page_view; skip it here so the
  // landing page is not counted twice.
  const countedFirstView = useRef(false);

  useEffect(() => {
    setEnabled(shouldLoadAnalytics());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (!countedFirstView.current) {
      countedFirstView.current = true;
      return;
    }
    trackPageView(pathname);
  }, [enabled, pathname]);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
