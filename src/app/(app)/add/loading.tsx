export default function AddLoading() {
  return (
    <div className="min-h-screen bg-[#F4F5FB] pb-32 animate-pulse">
      <div className="px-5 pt-14 pb-6 space-y-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div className="h-8 w-48 bg-gray-200 rounded-xl" />
        </div>
      </div>
      <div className="px-5">
        <div className="bg-white rounded-[2rem] p-7 border border-border/40 shadow-sm space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-gray-200 rounded-lg" />
              <div className="h-14 w-full bg-gray-100 rounded-xl" />
            </div>
          ))}
          <div className="h-14 w-full bg-gray-200 rounded-full mt-4" />
        </div>
      </div>
    </div>
  );
}
