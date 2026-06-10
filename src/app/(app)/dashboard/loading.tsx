export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 md:pb-12 animate-pulse">

      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6 md:px-10 pt-10 pb-6">
        <div className="space-y-2.5">
          <div className="h-3 w-32 bg-gray-200 dark:bg-white/10 rounded-lg" />
          <div className="h-8 w-64 bg-gray-200 dark:bg-white/10 rounded-xl" />
          <div className="h-4 w-80 max-w-full bg-gray-200 dark:bg-white/10 rounded-lg hidden sm:block" />
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-[#1a1a2e] pl-2 pr-2 sm:pr-4 py-1.5 rounded-full border border-border/40 shadow-sm self-end md:self-auto flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10" />
          <div className="hidden sm:block h-4 w-24 bg-gray-200 dark:bg-white/10 rounded-lg" />
        </div>
      </div>

      <div className="px-4 sm:px-6 md:px-10 space-y-4 sm:space-y-6">

        {/* Bento Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:auto-rows-fr">
          {/* Hero tile */}
          <div className="col-span-2 lg:row-span-2 rounded-3xl bg-gray-200 dark:bg-white/10 min-h-[180px] sm:min-h-[210px] p-5 sm:p-7 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="h-7 w-28 bg-white/40 dark:bg-white/10 rounded-full" />
              <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 w-20 bg-white/40 dark:bg-white/10 rounded-lg" />
              <div className="h-10 w-44 bg-white/40 dark:bg-white/10 rounded-xl" />
              <div className="h-3.5 w-36 bg-white/40 dark:bg-white/10 rounded-lg" />
            </div>
          </div>

          {/* Stat + quick action tiles */}
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#1a1a2e] p-4 sm:p-5 rounded-3xl border border-border/40 shadow-sm flex flex-col justify-between gap-4 min-h-[100px]">
              <div className="h-3.5 w-20 bg-gray-200 dark:bg-white/10 rounded-lg" />
              <div className="space-y-1.5">
                <div className="h-6 w-24 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-white/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Chart Card */}
            <div className="bg-white dark:bg-[#1a1a2e] p-5 sm:p-6 rounded-3xl border border-border/40 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="h-5 w-36 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="h-8 w-28 bg-gray-100 dark:bg-white/5 rounded-full" />
              </div>
              {/* Chart bars */}
              <div className="flex items-end gap-3 h-44 pt-4">
                {[60, 85, 45, 70, 95, 55, 75, 40, 88, 65, 50, 78].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gray-200 dark:bg-white/10 rounded-t-lg"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-[#1a1a2e] px-4 sm:px-6 py-5 rounded-3xl border border-border/40 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div className="h-5 w-44 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="h-9 w-20 bg-gray-100 dark:bg-white/5 rounded-full" />
              </div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-1">
                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-gray-200 dark:bg-white/10 rounded-lg w-3/4" />
                      <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-lg w-1/2" />
                    </div>
                    <div className="h-4 w-16 bg-gray-200 dark:bg-white/10 rounded-lg shrink-0" />
                    <div className="h-5 w-16 bg-gray-100 dark:bg-white/5 rounded-md shrink-0" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white dark:bg-[#1a1a2e] p-5 sm:p-6 rounded-3xl border border-border/40 shadow-sm">
              <div className="h-5 w-44 bg-gray-200 dark:bg-white/10 rounded-lg mb-6" />
              {/* Donut placeholder */}
              <div className="flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-full bg-gray-200 dark:bg-white/10 relative">
                  <div className="absolute inset-6 rounded-full bg-[#F4F5FB] dark:bg-[#0f0f14]" />
                </div>
                <div className="w-full space-y-3 mt-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-white/10" />
                        <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded-lg" />
                      </div>
                      <div className="h-3 w-12 bg-gray-100 dark:bg-white/5 rounded-lg" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Setting up label at the bottom */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2.5 bg-white dark:bg-[#1a1a2e]/90 backdrop-blur-sm px-5 py-2.5 rounded-full shadow-lg border border-border/40 text-sm font-semibold text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping inline-block" />
          Setting up your dashboard…
        </div>
      </div>

    </div>
  );
}
