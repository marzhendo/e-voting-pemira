import { Skeleton } from '@/components/ui/skeleton';

export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-[#181818] text-white flex flex-col justify-between antialiased">
      {/* Main Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-4xl bg-hmif-dark border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT COLUMN: Identity & Branding Skeleton */}
          <section className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center bg-hmif-dark border-b lg:border-b-0 lg:border-r border-neutral-800">
            <div>
              {/* Logo & Subtitle Skeleton */}
              <div className="flex items-center gap-3.5 mb-8">
                <Skeleton className="w-12 h-12 rounded-2xl bg-neutral-800 shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-32 bg-neutral-800" />
                  <Skeleton className="h-2.5 w-44 bg-neutral-800" />
                </div>
              </div>

              {/* Title & Tagline Skeleton */}
              <div className="space-y-3 max-w-md">
                <Skeleton className="h-8 w-48 bg-neutral-800" />
                <Skeleton className="h-8 w-64 bg-neutral-800" />
                <Skeleton className="h-4 w-72 bg-neutral-800 mt-2" />
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: Authentication Panel Skeleton */}
          <section className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-white min-h-[440px]">
            <div>
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-3 w-28 bg-neutral-200" />
                <Skeleton className="h-3 w-16 bg-neutral-200" />
              </div>

              <div className="space-y-2.5 mb-6">
                <Skeleton className="h-6 w-44 bg-neutral-300" />
                <Skeleton className="h-3 w-full bg-neutral-200" />
                <Skeleton className="h-3 w-4/5 bg-neutral-200" />
              </div>

              {/* Input Skeleton */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-36 bg-neutral-200" />
                  <Skeleton className="h-12 w-full rounded-xl bg-neutral-100 border border-neutral-200" />
                  <Skeleton className="h-2.5 w-56 bg-neutral-200" />
                </div>

                {/* Submit Button Skeleton */}
                <Skeleton className="h-12 w-full rounded-xl bg-hmif-blue/40" />

                {/* DPT Note Skeleton */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Skeleton className="w-3.5 h-3.5 rounded bg-neutral-200" />
                  <Skeleton className="h-2.5 w-48 bg-neutral-200" />
                </div>
              </div>
            </div>

            {/* Help Contact Skeleton */}
            <div className="pt-6 border-t border-neutral-200 text-center mt-6">
              <Skeleton className="h-3 w-48 mx-auto bg-neutral-200" />
            </div>
          </section>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="w-full border-t border-neutral-800/80 py-4 text-center">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Skeleton className="h-3 w-48 bg-neutral-800" />
          <Skeleton className="h-3 w-40 bg-neutral-800" />
        </div>
      </footer>
    </div>
  );
}
