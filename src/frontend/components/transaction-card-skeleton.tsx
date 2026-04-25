import { cn } from "@/backend/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-border/40 dark:bg-border/20",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/60 dark:before:via-white/10 before:to-transparent",
        className
      )}
    />
  );
}

export function TransactionCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
      {/* Category icon placeholder */}
      <Shimmer className="flex-shrink-0 w-12 h-12 rounded-[1rem]" />

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-2.5 pl-1">
        <Shimmer className="h-[15px] w-3/5" />
        <div className="flex items-center gap-2">
          <Shimmer className="h-[18px] w-[72px] rounded-full" />
          <Shimmer className="h-[18px] w-[60px] rounded-full" />
        </div>
      </div>

      {/* Amount + date */}
      <div className="flex flex-col items-end gap-1.5">
        <Shimmer className="h-[15px] w-[72px]" />
        <Shimmer className="h-[12px] w-[52px]" />
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionCardSkeleton key={i} />
      ))}
    </div>
  );
}
