import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-surface font-montserrat text-on-surface antialiased p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Admin Header Skeleton */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl bg-surface-container-high" />
            <Skeleton className="h-7 w-64 bg-surface-container-high" />
            <Skeleton className="h-6 w-28 rounded-full bg-surface-container-high hidden md:block" />
          </div>
          <Skeleton className="h-3.5 w-80 bg-surface-container max-w-full" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Skeleton className="h-10 w-28 rounded-xl bg-surface-container-high" />
          <Skeleton className="h-10 w-24 rounded-xl bg-surface-container" />
        </div>
      </header>

      {/* Tabs Bar Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-outline-variant/20">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            className="h-10 w-32 rounded-xl bg-surface-container shrink-0"
          />
        ))}
      </div>

      {/* 4 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface-container rounded-2xl p-5 border border-outline-variant/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24 bg-surface-container-highest" />
              <Skeleton className="w-7 h-7 rounded-lg bg-surface-container-highest" />
            </div>
            <Skeleton className="h-7 w-20 bg-surface-container-highest" />
            <Skeleton className="h-2.5 w-32 bg-surface-container-high" />
          </div>
        ))}
      </div>

      {/* Main Panel Content Skeleton */}
      <div className="bg-surface-container rounded-3xl p-6 sm:p-8 border border-outline-variant/30 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 bg-surface-container-highest" />
            <Skeleton className="h-3 w-64 bg-surface-container-high" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg bg-surface-container-highest" />
        </div>

        {/* Chart Bars Skeleton */}
        <div className="space-y-4 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Skeleton className="h-3 w-28 bg-surface-container-highest" />
                <Skeleton className="h-3 w-16 bg-surface-container-highest" />
              </div>
              <Skeleton className="h-3 w-full rounded-full bg-surface-container-high" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
