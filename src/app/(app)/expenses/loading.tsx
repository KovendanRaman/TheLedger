import { TransactionListSkeleton } from "@/frontend/components/transaction-card-skeleton";

export default function ExpensesLoading() {
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header skeleton */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-border/40 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-40 rounded-lg bg-border/40 animate-pulse" />
            <div className="h-3.5 w-32 rounded-lg bg-border/40 animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-full bg-border/40 animate-pulse" />
        </div>

        {/* Search bar skeleton */}
        <div className="h-12 rounded-[1rem] bg-border/40 animate-pulse" />
      </div>

      {/* Status tabs skeleton */}
      <div className="flex gap-2 px-5 mb-5 overflow-hidden pb-1">
        {["All", "Pending", "Invoiced", "Paid"].map((label) => (
          <div
            key={label}
            className="h-10 w-20 rounded-[1rem] bg-border/40 animate-pulse flex-shrink-0"
          />
        ))}
      </div>

      {/* Results summary skeleton */}
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="h-3.5 w-20 rounded-lg bg-border/40 animate-pulse" />
        <div className="h-3.5 w-24 rounded-lg bg-border/40 animate-pulse" />
      </div>

      {/* Transaction cards skeleton */}
      <div className="px-5">
        <TransactionListSkeleton count={7} />
      </div>
    </div>
  );
}
