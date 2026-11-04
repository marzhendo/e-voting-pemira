import { Skeleton } from '@/components/ui/skeleton';

export default function VoteLoading() {
  return (
    <div className="bg-surface font-montserrat text-on-surface antialiased min-h-screen flex flex-col justify-between">
      {/* Fixed Sticky Header Skeleton */}
      <header className="fixed top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
        <div className="h-16 max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl bg-surface-container-high shrink-0" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36 bg-surface-container-high" />
              <Skeleton className="h-2.5 w-24 bg-surface-container-high hidden sm:block" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-28 rounded-full bg-surface-container-low border border-outline-variant/20" />
            <Skeleton className="h-6 w-16 rounded-lg bg-surface-container-high hidden sm:block" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="w-full pt-20 flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-6 pb-36">
          {/* Header Title Section Skeleton */}
          <div className="mb-6 space-y-2">
            <Skeleton className="h-8 w-64 bg-surface-container-high" />
            <Skeleton className="h-4 w-96 bg-surface-container max-w-full" />
          </div>

          {/* Candidate Grid Skeleton */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Candidate Card Skeleton 1 */}
              <div className="bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 flex flex-col justify-between min-h-[420px]">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-12 h-12 rounded-2xl bg-surface-container-highest" />
                    <Skeleton className="h-5 w-24 rounded-full bg-surface-container-highest" />
                  </div>
                  <Skeleton className="w-24 h-24 rounded-2xl mx-auto my-3 bg-surface-container-highest" />
                  <div className="space-y-2 text-center my-4">
                    <Skeleton className="h-4 w-44 mx-auto bg-surface-container-highest" />
                    <Skeleton className="h-3.5 w-36 mx-auto bg-surface-container-high" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-2xl bg-surface-container-high mt-4" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl bg-surface-container-highest mt-6" />
              </div>

              {/* Candidate Card Skeleton 2 */}
              <div className="bg-surface-container rounded-3xl p-6 sm:p-7 border border-outline-variant/30 flex flex-col justify-between min-h-[420px]">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="w-12 h-12 rounded-2xl bg-surface-container-highest" />
                    <Skeleton className="h-5 w-24 rounded-full bg-surface-container-highest" />
                  </div>
                  <Skeleton className="w-24 h-24 rounded-2xl mx-auto my-3 bg-surface-container-highest" />
                  <div className="space-y-2 text-center my-4">
                    <Skeleton className="h-4 w-44 mx-auto bg-surface-container-highest" />
                    <Skeleton className="h-3.5 w-36 mx-auto bg-surface-container-high" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-2xl bg-surface-container-high mt-4" />
                </div>
                <Skeleton className="h-11 w-full rounded-xl bg-surface-container-highest mt-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sticky Action Bar Skeleton */}
        <div className="fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur-md z-40 py-3.5 border-t border-outline-variant/30 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="w-2.5 h-2.5 rounded-full bg-surface-container-highest" />
              <Skeleton className="h-4 w-48 bg-surface-container-highest" />
            </div>
            <Skeleton className="w-full sm:w-44 h-10 rounded-xl bg-primary/20" />
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="w-full border-t border-outline-variant/20 py-3.5 text-center">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Skeleton className="h-3 w-56 bg-surface-container" />
          <Skeleton className="h-3 w-48 bg-surface-container" />
        </div>
      </footer>
    </div>
  );
}
