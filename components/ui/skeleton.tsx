import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({
  className,
  shimmer = true,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'bg-surface-container rounded-xl',
        shimmer ? 'shimmer-effect' : 'animate-pulse',
        className
      )}
      {...props}
    />
  );
}
