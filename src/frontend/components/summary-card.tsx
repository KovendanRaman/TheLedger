import { cn } from "@/backend/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  accent?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  accent,
  className,
  icon,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] p-5 relative overflow-hidden transition-all duration-300",
        accent
          ? "gradient-primary glow-primary border-transparent"
          : "bg-white border border-border/60 glow-card",
        className
      )}
    >
      {/* Decorative blobs for accent card */}
      {accent && (
        <>
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        </>
      )}

      <div className="flex flex-col h-full justify-between gap-4 relative">
        <div className="flex items-center justify-between">
          <p className={cn("text-xs font-medium tracking-wide", accent ? "text-white/80 uppercase" : "text-muted-foreground")}>
            {title}
          </p>
          {icon && (
            <div className={cn("p-2 rounded-xl backdrop-blur-md", accent ? "bg-white/20" : "bg-primary/5 text-primary")}>
              {icon}
            </div>
          )}
        </div>
        
        <div>
          <p className={cn("text-[2rem] leading-none mb-1 font-bold font-mono tracking-tight", accent ? "text-white" : "text-foreground")}>
            {value}
          </p>
          {subtitle && (
            <p className={cn("text-xs font-medium", accent ? "text-white/70" : "text-muted-foreground")}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
