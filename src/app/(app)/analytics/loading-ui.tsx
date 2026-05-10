"use client";

import { cn } from "@/backend/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("bg-border/30 animate-pulse rounded-md", className)} />;
}

export function TransactionListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
          <Shimmer className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-4 w-1/2" />
            <Shimmer className="h-3 w-1/3" />
          </div>
          <Shimmer className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

function KpiSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between mb-3">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-8 w-8 rounded-[0.75rem]" />
      </div>
      <div>
        <Shimmer className="h-6 w-24 mb-2" />
        <Shimmer className="h-3 w-12" />
      </div>
    </div>
  );
}

export function AnalyticsSkeleton({ appMode }: { appMode: "INVOICE" | "ALLOWANCE" }) {
  return (
    <div className="px-4 sm:px-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Total Spend */}
        <KpiSkeleton className={appMode === "INVOICE" ? "col-span-2 h-[140px]" : "col-span-1 h-[140px]"} />
        
        {appMode === "INVOICE" ? (
          <>
            <KpiSkeleton className="h-[140px]" />
            <KpiSkeleton className="h-[140px]" />
          </>
        ) : (
          <>
            <KpiSkeleton className="h-[140px]" />
            <KpiSkeleton className="h-[140px]" />
            <KpiSkeleton className="h-[140px]" />
            <KpiSkeleton className="h-[140px]" />
            <div className="col-span-2 p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm flex justify-between items-center h-20">
              <div className="space-y-2">
                <Shimmer className="h-4 w-32" />
                <Shimmer className="h-3 w-48" />
              </div>
              <Shimmer className="h-9 w-24 rounded-[1rem]" />
            </div>
          </>
        )}
      </div>

      {/* Chart Block */}
      <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Shimmer className="h-4 w-32" />
          <Shimmer className="h-4 w-4" />
        </div>
        <Shimmer className="h-3 w-48 mb-6" />
        <Shimmer className="h-[180px] w-full rounded-xl" />
      </div>

      {/* Donut Block */}
      <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm flex flex-col sm:flex-row gap-4">
        <Shimmer className="h-[140px] w-[140px] rounded-full mx-auto sm:mx-0 flex-shrink-0" />
        <div className="flex-1 space-y-4 py-2">
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-5/6" />
          <Shimmer className="h-3 w-4/6" />
          <Shimmer className="h-3 w-3/6" />
        </div>
      </div>

      {/* Top Transactions List */}
      <TransactionListSkeleton count={4} />
    </div>
  );
}
