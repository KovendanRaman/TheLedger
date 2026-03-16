"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/backend/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  PieChart,
  Settings,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/expenses", icon: ArrowLeftRight, label: "Transactions" },
    { href: "/invoices", icon: FileText, label: "Statements" },
    { href: "/analytics", icon: PieChart, label: "Analytics" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-white border-r border-border/40 fixed left-0 top-0">
      {/* Logo Area */}
      <div className="h-[90px] px-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg font-mono">L</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">The Ledger</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 rounded-[1.25rem] text-[15px] font-medium transition-all duration-300 relative overflow-hidden",
                isActive
                  ? "text-white hover:scale-[1.02]"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-slate-800 hover:translate-x-1"
              )}
              style={isActive ? { backgroundColor: '#6366f1', boxShadow: '0 8px 20px rgba(99,102,241,0.25)' } : {}}
            >
              <item.icon className={cn("h-[18px] w-[18px] transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-4 py-6 space-y-1.5 mt-auto">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors text-left">
          <HelpCircle className="h-[18px] w-[18px]" />
          Help
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors text-left">
          <LogOut className="h-[18px] w-[18px]" />
          Log out
        </button>

        {/* Theme Toggle (Visual Only for now) */}
        <div className="flex items-center gap-2 mt-4 px-4 bg-muted/30 p-1.5 rounded-full w-fit">
          <div className="text-white p-2 rounded-full cursor-pointer shadow-sm" style={{ backgroundColor: '#6366f1' }}>
            <Sun className="w-4 h-4" />
          </div>
          <div className="text-muted-foreground p-2 rounded-full cursor-pointer hover:bg-muted/50 transition-colors">
            <Moon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </aside>
  );
}
