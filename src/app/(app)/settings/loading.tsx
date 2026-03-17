export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 animate-pulse">
      <div className="px-5 pt-14 pb-6 space-y-2">
        <div className="h-8 w-32 bg-gray-200 dark:bg-white dark:bg-[#1a1a2e]/10 rounded-xl" />
        <div className="h-4 w-56 bg-gray-200 dark:bg-white dark:bg-[#1a1a2e]/10 rounded-lg" />
      </div>
      <div className="px-5 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#1a1a2e] rounded-[1.5rem] p-6 border border-border/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-40 bg-gray-200 dark:bg-white dark:bg-[#1a1a2e]/10 rounded-lg" />
              <div className="h-6 w-12 bg-gray-200 dark:bg-white dark:bg-[#1a1a2e]/10 rounded-full" />
            </div>
            <div className="h-4 w-full bg-gray-100 dark:bg-white dark:bg-[#1a1a2e]/5 rounded-lg" />
            <div className="h-4 w-3/4 bg-gray-100 dark:bg-white dark:bg-[#1a1a2e]/5 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
