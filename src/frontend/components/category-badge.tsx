import { memo } from "react";
import {
  Car,
  Fuel,
  Gamepad2,
  Home,
  MoreHorizontal,
  PenTool,
  Shirt,
  ShoppingCart,
  Tag,
  Utensils,
} from "lucide-react";
import { cn } from "@/backend/lib/utils";

interface CategoryBadgeProps {
  name: string;
  color?: string;
  size?: "md" | "sm";
  className?: string;
}

function getCategoryIcon(name: string) {
  switch (name.toLowerCase()) {
    case "fuel":
      return Fuel;
    case "groceries":
      return ShoppingCart;
    case "fast food":
      return Utensils;
    case "transport":
      return Car;
    case "stationery":
      return PenTool;
    case "clothing":
      return Shirt;
    case "accommodation":
      return Home;
    case "entertainment":
      return Gamepad2;
    case "other":
      return MoreHorizontal;
    default:
      return Tag;
  }
}

export const CategoryBadge = memo(function CategoryBadge({
  name,
  color = "#6366f1",
  size = "md",
  className,
}: CategoryBadgeProps) {
  const Icon = getCategoryIcon(name);
  const isSmall = size === "sm";
  return (
    <span
      className={cn(
        "relative inline-flex items-center rounded-full text-white font-bold tracking-widest uppercase shadow-[0_4px_10px_rgb(0,0,0,0.10)]",
        isSmall ? "h-7 pr-3 pl-1 text-[10px]" : "h-9 pr-4 pl-1 text-[11px]",
        className
      )}
      style={{ backgroundColor: color }}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-full bg-white shadow-sm flex-shrink-0",
          isSmall ? "w-5 h-5 mr-2" : "w-7 h-7 mr-2.5"
        )}
      >
        <Icon className={cn(isSmall ? "w-3 h-3" : "w-3.5 h-3.5")} style={{ color }} />
      </span>
      {name}
    </span>
  );
});
