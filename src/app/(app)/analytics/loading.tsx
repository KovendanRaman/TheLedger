function Pulse({ className }: { className?: string }) {
  return <div className={`rounded-[1.5rem] bg-border/30 animate-pulse ${className ?? ""}`} />;
}

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-16">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-border/30 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-32 rounded-lg bg-border/30 animate-pulse" />
            <div className="h-3.5 w-24 rounded-lg bg-border/30 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          {[80, 72, 64].map((w) => (
            <div key={w} className="h-9 rounded-[1rem] bg-border/30 animate-pulse" style={{ width: w }} />
          ))}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-3">
          <Pulse className="col-span-2 h-28" />
          <Pulse className="h-28" />
          <Pulse className="h-28" />
        </div>
        {/* Trend chart */}
        <Pulse className="h-64" />
        {/* Category */}
        <Pulse className="h-56" />
        {/* Status */}
        <Pulse className="h-40" />
        {/* Top txns */}
        <Pulse className="h-52" />
      </div>
    </div>
  );
}
