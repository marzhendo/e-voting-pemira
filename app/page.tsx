"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getElectionEventSchema } from "@/lib/seo/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-[100dvh] bg-[#101010] text-on-surface font-montserrat flex flex-col justify-between selection:bg-primary selection:text-on-primary overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getElectionEventSchema()),
        }}
      />

      {/* Background Decor: Civic Dot-Matrix & Radial Golden Spotlight (Linear / x.ai tech style) */}
      <div
        className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
        aria-hidden="true"
      >
        {/* Soft Golden Ambient Aura centered behind hero headline */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[680px] lg:w-[900px] h-[260px] sm:h-[450px] bg-primary/12 rounded-full blur-[140px] pointer-events-none" />

        {/* Civic Micro Dot-Matrix Pattern masked radially to fade cleanly before CTA & edges */}
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: `radial-gradient(circle, #EBBD1C 1.2px, transparent 1.2px)`,
            backgroundSize: "28px 28px",
            maskImage:
              "radial-gradient(ellipse 65% 48% at 50% 40%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 65% 48% at 50% 40%, black 20%, transparent 75%)",
          }}
        />

        {/* Subtle Dark Vignette at boundaries to guarantee zero-clash with header and footer */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#101010] via-transparent to-[#101010] opacity-80" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 w-full border-b border-outline-variant/20 bg-[#101010]/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 min-h-[56px] sm:h-16 py-2.5 sm:py-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative w-7 h-7 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center">
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
              <span className="text-xs sm:text-sm font-bold text-on-surface uppercase tracking-wider block leading-tight whitespace-nowrap">
                PEMIRA HMIF 2026/2027
              </span>
              <span className="text-[10px] sm:text-xs text-on-surface-variant font-medium block leading-tight truncate">
                Telkom University Purwokerto
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/6281809300406"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-on-surface-variant hover:text-on-surface transition-colors min-h-[40px] sm:min-h-[44px] inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true" />
              <span>Bantuan KPR</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.18 }}
        className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-auto"
      >
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-16">
          {/* Heading */}
          <h1 className="font-bebas text-3xl sm:text-6xl md:text-7xl tracking-wide uppercase text-brand-cream leading-[1.08] sm:leading-[1.05] text-balance">
            Satu Suara, <br />
            Bawa Perubahan untuk Informatika.
          </h1>

          <p className="text-xs sm:text-base text-on-surface-variant max-w-lg leading-relaxed text-pretty">
            Platform resmi pemilihan Chairman &amp; Vice Chairman HMIF Periode
            2026/2027.
          </p>

          {/* Single Dominant CTA */}
          <div className="pt-2 w-full sm:w-auto">
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.1 }}
            >
              <Link
                href="/login"
                prefetch={false}
                className="w-full sm:w-auto min-h-[48px] px-7 sm:px-8 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors duration-150 inline-flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer shadow-lg shadow-primary/10"
              >
                <span>Masuk ke Bilik Suara</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.main>

      {/* Footer (Subtle Floating Footer) */}
      <footer className="relative z-10 w-full border-t border-outline-variant/15 py-3 sm:py-6 text-[11px] sm:text-xs text-on-surface-variant/80 text-center">
        <p className="max-w-6xl mx-auto px-4">
          &copy; 2026 HMIF Telkom University Purwokerto. &bull; Komisi Pemilihan
          Raya. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
