import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-bg-tertiary rounded-lg',
        className,
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('bg-bg-secondary border border-border-primary rounded-xl p-4', className)}>
      <Skeleton className="w-full aspect-[1/2] mb-3 rounded-lg" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2 mb-1" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 6, className }: SkeletonProps & { count?: number }) {
  return (
    <div className={clsx('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
