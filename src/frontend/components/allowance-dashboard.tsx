"use client";

import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/backend/lib/utils";
import { CategoryBadge } from "@/frontend/components/category-badge";
import { AnimatedCounter } from "@/frontend/components/animated-counter";
import type { AllowanceDashboardData } from "@/backend/lib/types/database.types";
import { CalendarDays, TrendingDown, ShieldCheck, Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/backend/lib/utils";

interface Props {
  data: AllowanceDashboardData;
  firstName: string;
}

export function AllowanceDashboard({ data, firstName }: Props) {
  const {
    safeToSpend,
    baseline,
    obligations,
    variableSpend,
    cycleStart,
    cycleEnd,
    recentTxns,
    recurringExpenses,
  } = data;

  // Runway percentage: how much of spendable budget has been used
  const spendable = Math.max(baseline - obligations, 0);
  const spendPct = spendable > 0 ? Math.min((variableSpend / spendable) * 100, 100) : 100;
  const isNegative = safeToSpend < 0;

  // Color coding for the runway bar
  const runwayColor =
    spendPct >= 85
      ? "from-rose-500 to-red-600"
      : spendPct >= 60
      ? "from-amber-400 to-orange-500"
      : "from-emerald-400 to-green-500";

  // Today's day to detect upcoming debit orders
  const todayDay = new Date().getDate();
  const cycleEndDate = parseISO(cycleEnd);
  const cycleStartDate = parseISO(cycleStart);

  const upcomingDebits = recurringExpenses
    .filter((r) => {
      // Upcoming = billing day is still in the future within this cycle
      return r.billing_date > todayDay && r.billing_date <= cycleEndDate.getDate();
    })
    .sort((a, b) => a.billing_date - b.billing_date);

  const cycleLabel = `${format(cycleStartDate, "dd MMM")} → ${format(cycleEndDate, "dd MMM")}`;

  return (
    <div className="px-4 sm:px-6 md:px-10 space-y-5">
      
      {/* Cycle label */}
      <div className="flex items-center gap-2 text-muted-foreground text-[13px] font-semibold">
        <CalendarDays className="w-4 h-4" />
        <span>Billing cycle: {cycleLabel}</span>
      </div>

      {/* ── Hero: Safe to Spend ─────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden rounded-[2rem] p-6 sm:p-8 shadow-lg",
          isNegative
            ? "bg-gradient-to-br from-rose-500 to-red-600"
            : "bg-gradient-to-br from-emerald-500 to-green-600"
        )}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 bg-white translate-x-10 -translate-y-10" />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full opacity-10 bg-white -translate-x-8 translate-y-8" />

        <p className="text-white/70 text-[13px] font-bold uppercase tracking-widest mb-2">
          Safe to Spend
        </p>
        <p className="text-white text-[42px] sm:text-[52px] font-black tracking-tight leading-none">
          <AnimatedCounter
            value={Math.abs(safeToSpend)}
            prefix={isNegative ? "-R" : "R"}
            prefixClassName="text-[24px] text-white/80 font-bold pr-1"
          />
        </p>
        <p className="text-white/60 text-[13px] font-medium mt-1">
          {isNegative ? "You've exceeded your budget this cycle" : "remaining this cycle"}
        </p>

        {/* Runway bar */}
        <div className="mt-5">
          <div className="flex justify-between text-white/60 text-[11px] font-semibold mb-1.5">
            <span>Spent {spendPct.toFixed(0)}%</span>
            <span>{formatCurrency(variableSpend)} of {formatCurrency(spendable)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", runwayColor)}
              style={{ width: `${spendPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Income", value: baseline, icon: TrendingDown, colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
          { label: "Fixed Costs", value: obligations, icon: ShieldCheck, colorClass: "text-violet-500", bgClass: "bg-violet-500/10" },
          { label: "Variable", value: variableSpend, icon: Wallet, colorClass: "text-amber-500", bgClass: "bg-amber-500/10" },
        ].map(({ label, value, icon: Icon, colorClass, bgClass }) => (
          <div key={label} className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-4 rounded-2xl border border-border/40 dark:border-white/10 shadow-sm">
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-2", bgClass)}>
              <Icon className={cn("w-4 h-4", colorClass)} />
            </div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wide mb-1">{label}</p>
            <p className="text-foreground text-[15px] sm:text-[18px] font-bold leading-none font-mono">
              R{(value / 1000).toFixed(1)}k
            </p>
          </div>
        ))}
      </div>

      {/* ── Complex grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Upcoming Fixed Costs */}
        {upcomingDebits.length > 0 && (
          <div className="lg:col-span-1 bg-white dark:bg-[#1a1a2e] rounded-[2rem] p-5 border border-border/40 dark:border-white/10 shadow-sm">
            <h2 className="text-[15px] font-bold mb-4">Upcoming This Cycle</h2>
            <div className="space-y-3">
              {upcomingDebits.map((debit) => {
                const daysUntil = debit.billing_date - todayDay;
                return (
                  <div key={debit.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-violet-600 dark:text-violet-400 text-[12px] font-black leading-none">{debit.billing_date}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-foreground truncate">{debit.name}</p>
                      <p className="text-[11px] text-muted-foreground">in {daysUntil} day{daysUntil !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-[13px] font-bold font-mono text-foreground flex-shrink-0">
                      {formatCurrency(debit.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        <div className={cn("bg-white dark:bg-[#1a1a2e] px-4 sm:px-6 py-5 rounded-[2rem] border border-border/40 dark:border-white/10 shadow-sm", upcomingDebits.length > 0 ? "lg:col-span-2" : "lg:col-span-3")}>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-[15px] font-bold">Recent Transactions</h2>
            <Link href="/expenses" className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 dark:bg-white/10 rounded-full text-sm font-semibold hover:bg-muted/50 transition-colors">
              See all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentTxns.length === 0 ? (
            <p className="text-muted-foreground text-[13px] text-center py-6">No transactions this cycle yet.</p>
          ) : (
            <div className="space-y-1">
              {recentTxns.slice(0, 7).map((txn) => {
                const category = txn.categories;
                const dateLabel = format(parseISO(txn.date.split("T")[0]), "dd MMM");
                return (
                  <div key={txn.id} className="flex items-center gap-3 py-3 border-b border-border/20 dark:border-white/5 last:border-0">
                    <div
                      className="w-10 h-10 rounded-[0.75rem] flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: category?.color ? `${category.color}18` : "#6366f118" }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category?.color ?? "#6366f1" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-foreground truncate">{txn.description}</p>
                      {category && <CategoryBadge name={category.name} color={category.color} size="sm" variant="soft" className="shadow-none mt-0.5" />}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[14px] font-bold font-mono">R {txn.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{dateLabel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
