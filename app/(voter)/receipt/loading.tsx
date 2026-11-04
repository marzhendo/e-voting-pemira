import { Skeleton } from '@/components/ui/skeleton';

export default function ReceiptLoading() {
  return (
    <div className="bg-surface font-montserrat text-on-surface antialiased min-h-screen flex flex-col justify-between">
      {/* Sticky Header Skeleton */}
      <header className="fixed top-0 w-full z-40 bg-surface/95 backdrop-blur-md border-b border-outline-variant/20 shadow-sm">
        <div className="h-16 max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-xl bg-surface-container-high" />
            <Skeleton className="h-4 w-36 bg-surface-container-high" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full bg-surface-container-low" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="w-full pt-28 pb-16 px-4 flex-1 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full mx-auto space-y-8 text-center">
          {/* Success Badge & Header Skeleton */}
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="w-16 h-16 rounded-2xl bg-surface-container-highest" />
            <Skeleton className="h-8 w-64 bg-surface-container-high" />
            <Skeleton className="h-4 w-80 bg-surface-container max-w-full" />
          </div>

          {/* Digital Ticket Card Skeleton */}
          <div className="bg-surface-container rounded-3xl p-6 sm:p-8 border border-outline-variant/30 text-left space-y-6 shadow-xl">
            {/* Ticket Header */}
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20">
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-28 bg-surface-container-highest" />
                <Skeleton className="h-4 w-44 bg-surface-container-highest" />
              </div>
              <Skeleton className="w-10 h-10 rounded-xl bg-surface-container-high" />
            </div>

            {/* Token Box Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-32 bg-surface-container-highest" />
              <Skeleton className="h-14 w-full rounded-2xl bg-surface-container-high border border-outline-variant/30" />
            </div>

            {/* Metadata Rows Skeleton */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-20 bg-surface-container-highest" />
                <Skeleton className="h-4 w-32 bg-surface-container-highest" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-20 bg-surface-container-highest" />
                <Skeleton className="h-4 w-28 bg-surface-container-highest" />
              </div>
            </div>

            {/* Security Guarantee Box */}
            <Skeleton className="h-16 w-full rounded-2xl bg-surface-container-low border border-outline-variant/20" />
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto w-full pt-2">
            <Skeleton className="w-full sm:w-1/2 h-11 rounded-xl bg-surface-container-high" />
            <Skeleton className="w-full sm:w-1/2 h-11 rounded-xl bg-surface-container" />
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="w-full border-t border-outline-variant/20 py-4 text-center">
        <Skeleton className="h-3 w-64 mx-auto bg-surface-container" />
      </footer>
    </div>
  );
}
