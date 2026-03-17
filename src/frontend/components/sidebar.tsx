"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/backend/lib/utils";
import { useTheme } from "@/frontend/components/theme-provider";
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileText,
  PieChart,
  Settings,
  LogOut,
  Moon,
  Sun,
  Pin,
  PinOff,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isPinned, setIsPinned] = useState(false);

  // Restore pinned state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-pinned");
    if (saved === "true") setIsPinned(true);
  }, []);

  // Persist pinned preference
  useEffect(() => {
    localStorage.setItem("sidebar-pinned", String(isPinned));
  }, [isPinned]);

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/expenses", icon: ArrowLeftRight, label: "Transactions" },
    { href: "/invoices", icon: FileText, label: "Statements" },
    { href: "/analytics", icon: PieChart, label: "Analytics" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white dark:bg-[#1a1a2e] border-r border-border/40 dark:border-white/10 sticky top-0 h-screen flex-shrink-0 transition-colors duration-300",
        "overflow-hidden transition-[width] duration-300 ease-in-out",
        "group/sidebar",
        isPinned ? "w-[260px]" : "w-16 hover:w-[260px]"
      )}
    >
      {/* Logo Area */}
      <Link href="/dashboard" className="h-[70px] flex items-center px-[14px] flex-shrink-0 overflow-hidden hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
          <span className="text-background font-bold text-lg font-mono">L</span>
        </div>
        <span
          className={cn(
            "ml-3 font-bold text-xl tracking-tight text-foreground whitespace-nowrap",
            "transition-opacity duration-200 delay-100",
            isPinned
              ? "opacity-100"
              : "opacity-0 group-hover/sidebar:opacity-100"
          )}
        >
          The Ledger
        </span>
      </Link>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-[1.25rem] text-[15px] font-medium transition-all duration-200 overflow-hidden whitespace-nowrap",
                isActive
                  ? "text-white hover:scale-[1.02]"
                  : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-white"
              )}
              style={
                isActive
                  ? {
                      backgroundColor: "#6366f1",
                      boxShadow: "0 8px 20px rgba(99,102,241,0.25)",
                    }
                  : {}
              }
            >
              <item.icon
                className="h-5 w-5 flex-shrink-0"
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "transition-opacity duration-200 delay-100",
                  isPinned
                    ? "opacity-100"
                    : "opacity-0 group-hover/sidebar:opacity-100"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-2 py-4 space-y-1 flex-shrink-0">
        {/* Pin / Unpin button */}
        <button
          onClick={() => setIsPinned((v) => !v)}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[14px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors whitespace-nowrap overflow-hidden"
        >
          {isPinned ? (
            <PinOff className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
          ) : (
            <Pin className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
          )}
          <span
            className={cn(
              "transition-opacity duration-200 delay-100",
              isPinned
                ? "opacity-100"
                : "opacity-0 group-hover/sidebar:opacity-100"
            )}
          >
            {isPinned ? "Unpin sidebar" : "Pin sidebar"}
          </span>
        </button>

        {/* Log out */}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[15px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors text-left whitespace-nowrap overflow-hidden"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
          <span
            className={cn(
              "transition-opacity duration-200 delay-100",
              isPinned
                ? "opacity-100"
                : "opacity-0 group-hover/sidebar:opacity-100"
            )}
          >
            Log out
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[14px] font-medium text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10 transition-colors whitespace-nowrap overflow-hidden"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
          ) : (
            <Sun className="h-5 w-5 flex-shrink-0" strokeWidth={2} />
          )}
          <span
            className={cn(
              "transition-opacity duration-200 delay-100",
              isPinned
                ? "opacity-100"
                : "opacity-0 group-hover/sidebar:opacity-100"
            )}
          >
            {theme === "light" ? "Dark mode" : "Light mode"}
          </span>
        </button>
      </div>
    </aside>
  );
}
