export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse rounded-lg bg-surface-hover ${className}`} style={style} />
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-edge bg-surface p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-1.5">
        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-5 w-24" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-edge bg-surface p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-edge bg-surface p-5">
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="flex items-end gap-2 h-48">
        {[60, 80, 45, 90, 55, 70].map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  )
}
