import Link from "next/link";
import { APP_CONFIG } from "@/config/app";

interface DownloadBadgesProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DownloadBadges({ size = "md", className = "" }: DownloadBadgesProps) {
  const heights: Record<string, string> = {
    sm: "h-10",
    md: "h-12",
    lg: "h-14",
  };
  const h = heights[size];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* App Store */}
      <a
        href={APP_CONFIG.appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="badge-app-store"
        aria-label="Download LogMyPlate on the App Store"
        className={`inline-flex items-center ${h} px-4 rounded-xl font-semibold text-[13px] transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 gap-2.5 select-none`}
        style={{
          background: "#111",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {/* Apple logo SVG */}
        <svg width="18" height="22" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.3-155.5-127.4C46.7 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49.6 191.5-49.6zM549.5 97c22.1-26.1 37.8-62.2 37.8-98.4 0-5.2-.4-10.4-1.3-14.4-36.1 1.3-79 24.3-105.7 53.5-20.1 22.1-39 58.3-39 94.5 0 5.8 1 11.6 1.3 13.4 2.2.4 5.2.7 8.2.7 32.7 0 72.1-22.1 98.7-49.3z" />
        </svg>
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[10px] opacity-75 font-normal">Download on the</span>
          <span className="text-[14px] font-semibold tracking-tight">App Store</span>
        </div>
      </a>

      {/* Google Play */}
      <a
        href={APP_CONFIG.playStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="badge-google-play"
        aria-label="Get LogMyPlate on Google Play"
        className={`inline-flex items-center ${h} px-4 rounded-xl font-semibold text-[13px] transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 gap-2.5 select-none`}
        style={{
          background: "#111",
          color: "#fff",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
        }}
      >
        {/* Google Play logo SVG */}
        <svg width="18" height="20" viewBox="0 0 512 512" aria-hidden="true">
          <path
            d="M42.4 14.4L297.1 256 42.4 497.6C38.5 494.3 36 489.4 36 483.9V28.1C36 22.6 38.5 17.7 42.4 14.4Z"
            fill="#00D2FF"
          />
          <path d="M376 176.3L93.3 14.4l-.9-.5 216.3 242.1L376 176.3Z" fill="#00F076" />
          <path d="M376 335.7l-67.3-70L93.3 497.6l.6-.3L376 335.7Z" fill="#FF3D00" />
          <path
            d="M376 335.7L441.5 296c14.7-8.5 23.5-24.2 23.5-41.1 0-16.9-8.8-32.6-23.5-41.1L376 176.3l-67.3 79.7L376 335.7Z"
            fill="#FFD400"
          />
        </svg>
        <div className="flex flex-col items-start leading-none gap-0.5">
          <span className="text-[10px] opacity-75 font-normal">Get it on</span>
          <span className="text-[14px] font-semibold tracking-tight">Google Play</span>
        </div>
      </a>
    </div>
  );
}
