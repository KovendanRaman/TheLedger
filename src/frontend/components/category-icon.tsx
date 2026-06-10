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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/backend/lib/utils";

export function getCategoryIcon(name: string): LucideIcon {
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

const SIZES = {
  sm: { tile: "w-7 h-7 rounded-lg", icon: "w-3.5 h-3.5" },
  md: { tile: "w-10 h-10 rounded-[0.75rem]", icon: "w-[18px] h-[18px]" },
  lg: { tile: "w-12 h-12 rounded-[1rem]", icon: "w-5 h-5" },
} as const;

interface CategoryIconProps {
  name?: string | null;
  color?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Tinted rounded-square tile showing the category's icon in the category colour.
 *  Falls back to the Tag icon and the indigo accent when no category is set. */
export const CategoryIcon = memo(function CategoryIcon({
  name,
  color,
  size = "md",
  className,
}: CategoryIconProps) {
  const Icon = name ? getCategoryIcon(name) : Tag;
  const tint = color ?? "#6366f1";

  return (
    <div
      className={cn("flex items-center justify-center flex-shrink-0", SIZES[size].tile, className)}
      style={{ backgroundColor: `${tint}18` }}
    >
      <Icon className={SIZES[size].icon} style={{ color: tint }} strokeWidth={2.25} />
    </div>
  );
});
