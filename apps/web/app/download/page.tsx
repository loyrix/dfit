import type { Metadata } from "next";
import { DownloadBadges } from "@/components/download-badges";

export const metadata: Metadata = {
  title: "Download LogMyPlate",
  description:
    "Download LogMyPlate on iPhone or Android. Snap a photo of any meal and get instant calorie and macro estimates — no barcodes, no database searching.",
  alternates: { canonical: "/download" },
};

const features = [
  "Photo-based meal analysis — no barcodes",
  "Works for Indian, Asian, Mediterranean, and global cuisines",
  "AI-estimated calories, protein, carbs, and fat",
  "Review and correct items before saving",
  "Daily journal with weekly summaries",
  "Health targets: calorie and macro goals",
  "Free scans daily; watch an ad to unlock more",
];

export default function DownloadPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-5">
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#f5a623" }}
          >
            Available now
          </p>
          <h1
            className="font-display text-5xl sm:text-6xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Download
            <br />
            <span className="gradient-text">LogMyPlate</span>
          </h1>
          <p
            className="text-[17px] leading-relaxed max-w-md"
            style={{ color: "var(--text-secondary)" }}
          >
            Free on iPhone and Android. Start tracking meals from a photo in under a minute.
          </p>
        </div>

        <DownloadBadges size="lg" />

        <div
          className="w-full rounded-2xl p-8 text-left flex flex-col gap-3"
          style={{
            background: "var(--surface-50)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="font-semibold text-[13px] uppercase tracking-widest mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            What&apos;s included
          </p>
          {features.map((f) => (
            <div key={f} className="flex items-start gap-3">
              <span
                className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}
              >
                ✓
              </span>
              <span className="text-[14px] leading-snug" style={{ color: "var(--text-secondary)" }}>
                {f}
              </span>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-center" style={{ color: "var(--text-muted)" }}>
          AI calorie estimates are approximations and are not medical advice.
        </p>
      </div>
    </div>
  );
}
