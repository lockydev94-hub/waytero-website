interface SkeletonProps {
  className?: string;
}

/**
 * Skeleton — animated placeholder block.
 */
export default function Skeleton({ className = "" }: SkeletonProps) {
  return <div className={`animate-pulse rounded-lg bg-ink-8 ${className}`} aria-hidden />;
}

export function SkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}
