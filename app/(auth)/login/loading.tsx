import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between antialiased selection:bg-primary selection:text-on-primary">
      {/* Main Viewport Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 animate-page-enter">
        {/* Subtle Back to Home Navigation Skeleton */}
        <div className="w-full max-w-[440px] mb-3">
          <div className="inline-flex items-center gap-2 px-2 py-1 -ml-2">
            <Skeleton className="w-3.5 h-3.5 rounded bg-outline-variant/30" />
            <Skeleton className="h-3 w-28 rounded bg-outline-variant/30" />
          </div>
        </div>

        {/* Focused Single-Column Card */}
        <div className="w-full max-w-[440px] min-h-[460px] bg-surface-container border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary/5 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Logo & Headline Skeleton */}
            <div className="text-center flex flex-col items-center space-y-3">
              <Skeleton className="w-14 h-14 rounded-full bg-outline-variant/30" />
              <div className="space-y-1.5 flex flex-col items-center">
                <Skeleton className="h-3 w-36 rounded bg-outline-variant/30" />
                <Skeleton className="h-2.5 w-44 rounded bg-outline-variant/30" />
              </div>
              <div className="pt-1 flex flex-col items-center space-y-2 w-full">
                <Skeleton className="h-8 w-56 rounded-lg bg-outline-variant/30" />
                <Skeleton className="h-3 w-64 rounded bg-outline-variant/20" />
              </div>
            </div>

            {/* Input & Button Skeleton */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded bg-outline-variant/30" />
                <Skeleton className="h-12 w-full rounded-xl bg-surface-container-high border border-outline-variant/20" />
              </div>
              <Skeleton className="h-12 w-full rounded-xl bg-primary/30" />
              <div className="flex justify-center pt-1">
                <Skeleton className="h-3 w-52 rounded bg-outline-variant/20" />
              </div>
            </div>
          </div>

          {/* Card Footer Skeleton */}
          <div className="pt-5 border-t border-outline-variant/20 text-center mt-6">
            <Skeleton className="h-3 w-48 mx-auto rounded bg-outline-variant/20" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-[11px] text-on-surface-variant border-t border-outline-variant/15">
        <p className="max-w-4xl mx-auto px-4">
          &copy; 2026 HMIF Telkom University Purwokerto. &bull; Komisi Pemilihan Raya. Seluruh hak cipta dilindungi.
        </p>
      </footer>
    </div>
  );
}
