import { memo } from "react";
import { cn } from "@/backend/lib/utils";
import type { TransactionStatus } from "@/backend/lib/types/database.types";

const statusConfig: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  },
  invoiced: {
    label: "Invoiced",
    className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  },
};

interface StatusBadgeProps {
  status: TransactionStatus;
  className?: string;
}

export const StatusBadge = memo(function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <span className="relative flex h-1.5 w-1.5 mr-1.5">
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            status === "pending" ? "bg-yellow-400" : "bg-transparent"
          )}
        />
        <span
          className={cn(
            "relative inline-flex rounded-full h-1.5 w-1.5",
            status === "pending"
              ? "bg-yellow-400"
              : status === "invoiced"
              ? "bg-blue-400"
              : "bg-emerald-400"
          )}
        />
      </span>
      {config.label}
    </span>
  );
});
