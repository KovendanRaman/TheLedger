"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, FileText, PieChart, List } from "lucide-react";
import { cn } from "@/backend/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/expenses", icon: List, label: "Expenses" },
  { href: "/add", icon: Plus, label: "Add", primary: true },
  { href: "/invoices", icon: FileText, label: "Invoices" },
  { href: "/analytics", icon: PieChart, label: "Analytics" },
];

export function BottomNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("fixed bottom-0 left-0 right-0 z-50 pb-safe lg:hidden", className)}>
      <div className="mx-auto max-w-md">
        <div className="mx-4 mb-6 flex items-center justify-around bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[1.5rem] px-2 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          {navItems.map(({ href, icon: Icon, label, primary }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 relative",
                  primary
                    ? "text-white shadow-xl -mt-8 w-14 h-14 justify-center rounded-full border-4 border-background"
                    : isActive
                    ? "shadow-sm scale-105"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white hover:scale-105"
                )}
                style={primary ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' } : isActive ? { color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)' } : {}}
              >
                <Icon
                  className={cn("h-5 w-5", primary && "h-6 w-6")}
                  strokeWidth={primary || isActive ? 2.5 : 2}
                />
                {!primary && (
                  <span className={cn("text-[10px] font-bold transition-opacity", isActive ? "opacity-100" : "opacity-70 font-medium")}>{label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
