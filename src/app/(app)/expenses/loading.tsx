import { TransactionListSkeleton } from "@/frontend/components/transaction-card-skeleton";

export default function ExpensesLoading() {
  return (
    <div className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 md:pb-12 animate-pulse">
      <div className="px-4 sm:px-6 md:px-10 mx-auto w-full max-w-4xl">

        {/* Header skeleton */}
        <div className="flex items-center justify-between gap-3 pt-10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-28 rounded-lg bg-gray-200 dark:bg-white/10" />
              <div className="h-7 w-40 rounded-lg bg-gray-200 dark:bg-white/10" />
              <div className="h-3 w-32 rounded-lg bg-gray-200 dark:bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 hidden sm:block" />
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10" />
          </div>
        </div>

        {/* Search bar skeleton */}
        <div className="h-12 rounded-2xl bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm" />

        {/* Filter pills skeleton */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 mb-4">
          <div className="h-10 w-full sm:w-56 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm" />
          <div className="h-10 w-full sm:w-72 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm" />
        </div>

        {/* Stat strip skeleton */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm space-y-2">
              <div className="h-3 w-14 rounded-lg bg-gray-200 dark:bg-white/10" />
              <div className="h-5 w-20 rounded-lg bg-gray-200 dark:bg-white/10" />
              <div className="h-3 w-16 rounded-lg bg-gray-100 dark:bg-white/5" />
            </div>
          ))}
        </div>

        {/* Transaction cards skeleton */}
        <TransactionListSkeleton count={7} />

      </div>
    </div>
  );
}
