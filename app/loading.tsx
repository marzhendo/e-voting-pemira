import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 selection:bg-primary-container">
      <div className="flex flex-col items-center text-center max-w-sm w-full space-y-6 animate-in fade-in duration-300">
        {/* HMIF Logo with subtle pulse ring */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-hmif-gold/15 blur-lg animate-pulse" />
          <Image
            src="/assets/img/hmif-logo.png"
            alt="Logo HMIF"
            width={72}
            height={72}
            priority
            className="w-full h-full object-contain relative z-10"
          />
        </div>

        {/* Text and Skeleton Indicator */}
        <div className="space-y-2 w-full flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-hmif-gold animate-ping" />
            <span className="text-xs font-bold tracking-widest uppercase text-hmif-gold">
              PEMIRA HMIF 2026/2027
            </span>
          </div>
          <Skeleton className="h-3 w-48 bg-surface-container-high" />
          <Skeleton className="h-2.5 w-32 bg-surface-container" />
        </div>
      </div>
    </div>
  );
}
