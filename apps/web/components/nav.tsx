"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "AI Coach", href: "/#ai-nutritionist" },
  { label: "Guides", href: "/guides" },
  { label: "Support", href: "/support" },
];

export function Nav({ offsetForOffer = false }: { offsetForOffer?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${offsetForOffer ? "top-9" : "top-0"}`}
      style={{
        background: scrolled ? "rgba(var(--background-rgb), 0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="LogMyPlate home">
          <Image
            src="/icon.png"
            alt="LogMyPlate icon"
            width={32}
            height={32}
            className="rounded-lg transition-transform duration-200 group-hover:scale-105"
          />
          <span
            className="font-display font-semibold text-[15px] tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            LogMyPlate
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium transition-colors duration-150 hover:opacity-100 opacity-70"
              style={{ color: "var(--text-primary)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/download"
            id="nav-download-cta"
            className="text-[13px] font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: "var(--color-brand-amber, #f5a623)",
              color: "#111",
            }}
          >
            Download
          </Link>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all"
            style={{
              background: "var(--surface-200)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden border-t px-5 pt-4 pb-5 flex flex-col gap-4"
          style={{
            background: "var(--background)",
            borderColor: "var(--border)",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: "var(--text-primary)" }}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/download"
            onClick={() => setMenuOpen(false)}
            className="mt-1 text-[14px] font-semibold text-center px-4 py-2.5 rounded-full"
            style={{ background: "#f5a623", color: "#111" }}
          >
            Download
          </Link>
        </div>
      )}
    </header>
  );
}
