"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const KPR_WHATSAPP_URL = "https://wa.me/6281809300406";

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Rekapitulasi Suara", href: "/rekapitulasi" },
  { label: "Verifikasi BAST", href: "/bast/verify" },
  { label: "Bantuan KPR", href: KPR_WHATSAPP_URL, external: true },
];

interface SiteHeaderProps {
  subtitle?: string;
  rightSlot?: React.ReactNode;
  showPrimaryNav?: boolean;
}

export function SiteHeader({
  subtitle = "Telkom University Purwokerto",
  rightSlot,
  showPrimaryNav = true,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Identity */}
        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
            <Image
              src="/assets/img/hmif-logo.png"
              alt="Logo HMIF Telkom University Purwokerto"
              width={36}
              height={36}
              priority
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-bold text-on-surface tracking-tight block leading-tight truncate">
              Pemira HMIF 2026/2027
            </span>
            <span className="text-[11px] sm:text-xs text-on-surface-variant font-medium block leading-tight truncate">
              {subtitle}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {showPrimaryNav && (
          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-1"
          >
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = !item.external && pathname === item.href;
              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-3.5 rounded-xl inline-flex items-center text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {item.label}
                  </a>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`min-h-[44px] px-3.5 rounded-xl inline-flex items-center text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    isActive
                      ? "bg-surface-container-high text-on-surface font-semibold"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}
          <ThemeToggle />

          {showPrimaryNav && (
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-primary-nav"
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              className="md:hidden min-h-[44px] px-3 rounded-xl border border-outline-variant bg-surface-container hover:bg-surface-container-high text-on-surface inline-flex items-center justify-center gap-1.5 text-xs font-semibold transition-[color,background-color,border-color,transform] duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Menu className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              )}
              <span>Menu</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {showPrimaryNav && mobileMenuOpen && (
        <nav
          id="mobile-primary-nav"
          aria-label="Navigasi mobile"
          className="md:hidden border-t border-outline-variant bg-surface-container px-4 py-3"
        >
          <ul className="flex flex-col gap-2">
            {PRIMARY_NAV_ITEMS.map((item) => {
              const isActive = !item.external && pathname === item.href;
              return (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm flex items-center justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isActive
                          ? "bg-surface-container-high text-on-surface font-semibold"
                          : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-medium"
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
