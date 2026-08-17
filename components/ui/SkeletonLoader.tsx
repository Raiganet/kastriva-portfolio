interface SkeletonLoaderProps {
  className?: string;
  count?: number;
}

export default function SkeletonLoader({
  className = "",
  count = 1,
}: SkeletonLoaderProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`}
        />
      ))}
    </>
  );
}

export function PortfolioCardSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-bg rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
      <SkeletonLoader className="h-48 w-full" />
      <div className="p-6 space-y-3">
        <div className="flex justify-between">
          <SkeletonLoader className="h-4 w-20" />
          <SkeletonLoader className="h-4 w-12" />
        </div>
        <SkeletonLoader className="h-6 w-3/4" />
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <SkeletonLoader className="h-6 w-16" count={3} />
        </div>
      </div>
    </div>
  );
}

export function PortfolioGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PortfolioCardSkeleton key={i} />
      ))}
    </div>
  );
}
