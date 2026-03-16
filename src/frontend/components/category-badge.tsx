import { memo } from "react";
import { cn } from "@/backend/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  className?: string;
}

export const CategoryBadge = memo(function CategoryBadge({ name, color = "#6366f1", className }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-white/5 border border-white/10",
        className
      )}
    >
      <span
        className="h-2 w-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      {name}
    </span>
  );
});
