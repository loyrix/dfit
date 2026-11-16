import { DownloadBadges } from "@/components/download-badges";
import { APP_CONFIG } from "@/config/app";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

interface DownloadViewProps {
  locale: Locale;
  dict: Dictionary;
}

export function DownloadView({ dict }: DownloadViewProps) {
  const t = dict.download;

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 sm:px-6">
      <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-5">
          <p
            className="text-[12px] font-semibold uppercase tracking-widest"
            style={{ color: "#f5a623" }}
          >
            {t.badge}
          </p>
          <h1
            className="font-display text-5xl sm:text-6xl font-bold leading-tight tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {t.headlinePrefix}
            <br />
            <span className="gradient-text">{t.headlineBrand}</span>
            <span className="block text-2xl sm:text-3xl mt-2">{t.headlineSubtitle}</span>
          </h1>
          <p
            className="text-[17px] leading-relaxed max-w-md"
            style={{ color: "var(--text-secondary)" }}
          >
            {t.description}
          </p>
        </div>

        <DownloadBadges
          size="lg"
          placement="download_page"
          ariaLabels={{
            appStore: dict.downloadBadges.appStoreAria,
            googlePlay: dict.downloadBadges.playStoreAria,
          }}
        />

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
            {t.featuresHeading}
          </p>
          {t.features.map((f) => (
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
          {dict.common.notMedicalAdviceNotice}
        </p>
      </div>
    </div>
  );
}
