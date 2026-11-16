"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Globe, Check, ChevronDown } from "lucide-react";
import {
  LOCALES,
  LOCALE_MAP,
  type Locale,
  resolveMatchingPath,
} from "@/lib/i18n";

interface LanguageSwitcherProps {
  currentLocale?: Locale;
  variant?: "header" | "footer" | "mobile";
}

export function LanguageSwitcher({
  currentLocale = "en",
  variant = "header",
}: LanguageSwitcherProps) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  const handleSelectLocale = (targetLocale: Locale) => {
    try {
      window.localStorage.setItem("lmp_locale", targetLocale);
    } catch {
      // Ignore if localStorage is disabled
    }
    setOpen(false);
  };

  const currentInfo = LOCALE_MAP[currentLocale] || LOCALE_MAP.en;

  if (variant === "footer") {
    return (
      <div className="relative inline-block text-left" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Select language"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors hover:opacity-100 opacity-75"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-100)",
            color: "var(--text-secondary)",
          }}
        >
          <Globe size={13} className="opacity-80" />
          <span>{currentInfo.nativeName}</span>
          <ChevronDown size={11} className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div
            className="absolute bottom-full left-0 mb-2 w-48 rounded-2xl border shadow-xl py-1 z-50 backdrop-blur-md"
            style={{
              borderColor: "var(--border)",
              background: "var(--surface-50)",
            }}
            role="listbox"
          >
            {LOCALES.map((loc) => {
              const info = LOCALE_MAP[loc];
              const targetUrl = resolveMatchingPath(pathname, loc);
              const isSelected = loc === currentLocale;

              return (
                <Link
                  key={loc}
                  href={targetUrl}
                  onClick={() => handleSelectLocale(loc)}
                  role="option"
                  aria-selected={isSelected}
                  className="flex items-center justify-between px-3.5 py-2 text-[13px] transition-colors hover:bg-[var(--surface-200)]"
                  style={{
                    color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[14px]">{info.flag}</span>
                    <span>{info.nativeName}</span>
                  </span>
                  {isSelected && <Check size={14} className="text-[var(--app-amber)]" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Header / desktop variant
  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
        className="h-9 px-2.5 flex items-center gap-1.5 rounded-full text-[13px] font-medium border transition-all hover:scale-105 active:scale-95"
        style={{
          borderColor: "var(--border)",
          background: "var(--surface-100)",
          color: "var(--text-secondary)",
        }}
      >
        <Globe size={14} className="opacity-80" />
        <span className="hidden sm:inline">{currentInfo.nativeName}</span>
        <span className="sm:hidden uppercase text-[11px] font-bold">{currentLocale}</span>
        <ChevronDown size={12} className={`opacity-60 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-2xl border shadow-xl py-1 z-50 backdrop-blur-md"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-50)",
          }}
          role="listbox"
        >
          {LOCALES.map((loc) => {
            const info = LOCALE_MAP[loc];
            const targetUrl = resolveMatchingPath(pathname, loc);
            const isSelected = loc === currentLocale;

            return (
              <Link
                key={loc}
                href={targetUrl}
                onClick={() => handleSelectLocale(loc)}
                role="option"
                aria-selected={isSelected}
                className="flex items-center justify-between px-3.5 py-2 text-[13px] transition-colors hover:bg-[var(--surface-200)]"
                style={{
                  color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                  fontWeight: isSelected ? 600 : 400,
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-[14px]">{info.flag}</span>
                  <span>{info.nativeName}</span>
                </span>
                {isSelected && <Check size={14} className="text-[var(--app-amber)]" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
