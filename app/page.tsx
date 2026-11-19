'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getElectionEventSchema } from '@/lib/seo/constants';

export default function HomePage() {
  return (
    <div className="bg-surface min-h-screen text-on-surface font-montserrat flex flex-col justify-between selection:bg-primary selection:text-on-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(getElectionEventSchema()),
        }}
      />
      {/* Top Header */}
      <header className="w-full border-b border-outline-variant/30 bg-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                PEMIRA HMIF 2026/2027
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                Telkom University Purwokerto
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://wa.me/6281809300406"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-on-surface-variant hover:text-primary transition-colors min-h-[44px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-container/60 hover:bg-surface-container border border-outline-variant/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <HelpCircle className="w-4 h-4 text-primary" />
              <span>Bantuan KPR</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', ease: 'easeOut', duration: 0.18 }}
        className="flex-1 flex items-center justify-center p-4 sm:p-6"
      >
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6 py-10 sm:py-16">
          {/* Heading */}
          <h1 className="font-bebas text-4xl sm:text-6xl md:text-7xl tracking-wide uppercase text-on-surface leading-[1.05]">
            Satu Suara, <br />
            <span className="text-primary">Bawa Perubahan untuk Informatika.</span>
          </h1>

          <p className="text-xs sm:text-sm text-on-surface-variant max-w-lg leading-relaxed">
            Platform resmi pemilihan Chairman &amp; Vice Chairman HMIF Periode 2026/2027.
          </p>

          {/* Single Dominant CTA */}
          <div className="pt-2 w-full sm:w-auto">
            <motion.div
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 0.1 }}
            >
              <Link
                href="/login"
                prefetch={false}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-xl bg-primary hover:bg-secondary text-on-primary text-xs font-bold uppercase tracking-wider transition-colors duration-150 inline-flex items-center justify-center gap-2.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none cursor-pointer"
              >
                <span>Masuk ke Bilik Suara</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="w-full border-t border-outline-variant/15 py-6 text-[11px] text-on-surface-variant text-center">
        <p className="max-w-6xl mx-auto px-4">
          &copy; 2026 HMIF Telkom University Purwokerto. &bull; Komisi Pemilihan Raya. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
