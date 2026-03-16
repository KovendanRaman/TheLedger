export default function InvoicesLoading() {
  return (
    <div className="min-h-screen bg-[#F4F5FB] pb-32 animate-pulse">
      <div className="flex items-end justify-between px-5 pt-14 pb-6">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-gray-200 rounded-xl" />
          <div className="h-4 w-56 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-full" />
      </div>
      <div className="px-5 space-y-4">
        <div className="h-5 w-36 bg-gray-200 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-border/40 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded-lg" />
                <div className="h-3 w-24 bg-gray-100 rounded-lg" />
              </div>
              <div className="space-y-1.5 text-right">
                <div className="h-5 w-20 bg-gray-200 rounded-lg ml-auto" />
                <div className="h-3 w-24 bg-gray-100 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
