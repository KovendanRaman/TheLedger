"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { PageTransition } from "@/frontend/components/page-transition";
import { IS_MOCK_MODE, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from "@/backend/lib/mock-data";
import { getUserTransactions, getCategories } from "@/backend/actions/data";
import type { Transaction, Category } from "@/backend/lib/types/database.types";
import { formatCurrency } from "@/backend/lib/utils";
import {
  ChevronLeft, TrendingUp, ShoppingBag,
  ReceiptText, Clock, FileCheck, CheckCircle2, ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/backend/lib/utils";
import { TransactionListSkeleton } from "@/frontend/components/transaction-card-skeleton";
import { format, subMonths, startOfMonth, parseISO, isAfter, isSameMonth } from "date-fns";

type Period = "month" | "quarter" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "This Month", value: "month" },
  { label: "3 Months", value: "quarter" },
  { label: "All Time", value: "all" },
];

function getCategoryById(categories: Category[], id: string | null) {
  return categories.find((c) => c.id === id) ?? null;
}

// ─── Tooltip components ───────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-border/40">
      <p className="text-[12px] font-bold text-muted-foreground mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-3 mb-1 last:mb-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-[13px] text-foreground flex-1 pr-4">{entry.name}</span>
          <span className="text-[13px] font-bold font-mono">R{entry.value.toLocaleString("en-ZA")}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, color } = payload[0].payload;
  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-border/50 text-center">
      <p className="text-[11px] font-semibold text-muted-foreground mb-0.5">{name}</p>
      <p className="text-[13px] font-bold" style={{ color }}>{formatCurrency(value)}</p>
    </div>
  );
}

// ─── Skeleton blocks ──────────────────────────────────────────────────────────

function SkeletonCard({ className }: { className?: string }) {
  return <div className={cn("rounded-[1.5rem] bg-border/30 animate-pulse", className)} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      if (IS_MOCK_MODE) {
        await new Promise<void>((r) => setTimeout(r, 0));
        if (!cancelled) {
          setAllTxns(MOCK_TRANSACTIONS);
          setCategories(MOCK_CATEGORIES);
          setLoading(false);
        }
        return;
      }
      const [txns, cats] = await Promise.all([
        getUserTransactions(),
        getCategories(),
      ]);
      if (!cancelled) {
        setAllTxns(txns);
        setCategories(cats);
        setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  // ─── Period filter ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      return allTxns.filter((t) => isSameMonth(parseISO(t.date), now));
    }
    if (period === "quarter") {
      const cutoff = startOfMonth(subMonths(now, 2));
      return allTxns.filter((t) => isAfter(parseISO(t.date), cutoff) || isSameMonth(parseISO(t.date), cutoff));
    }
    return allTxns;
  }, [allTxns, period]);

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    let total = 0, billable = 0, personal = 0;
    for (const t of filtered) {
      total += t.amount;
      if (t.is_invoicable) billable += t.amount;
      else personal += t.amount;
    }
    return { total, billable, personal, billablePct: total > 0 ? Math.round((billable / total) * 100) : 0 };
  }, [filtered]);
  const { total: totalSpend, billable: billableTotal, personal: personalTotal, billablePct } = kpis;

  // ─── Monthly trend ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const buckets: Record<string, { label: string; personal: number; billable: number }> = {};
    filtered.forEach((t) => {
      const key = t.date.substring(0, 7); // YYYY-MM
      if (!buckets[key]) {
        buckets[key] = {
          label: format(parseISO(t.date), "MMM yy"),
          personal: 0,
          billable: 0,
        };
      }
      if (t.is_invoicable) buckets[key].billable += t.amount;
      else buckets[key].personal += t.amount;
    });
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filtered]);

  // ─── Category breakdown ─────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const totals: Record<string, { amount: number; name: string; color: string }> = {};
    filtered.forEach((t) => {
      if (!t.category_id) return;
      const cat = getCategoryById(categories, t.category_id);
      if (!totals[t.category_id]) {
        totals[t.category_id] = { amount: 0, name: cat?.name ?? "Other", color: cat?.color ?? "#6b7280" };
      }
      totals[t.category_id].amount += t.amount;
    });
    return Object.values(totals).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [filtered, categories]);

  // ─── Status breakdown ───────────────────────────────────────────────────────
  const statusData = useMemo(() => {
    const pending = filtered.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);
    const invoiced = filtered.filter((t) => t.status === "invoiced").reduce((s, t) => s + t.amount, 0);
    const paid = filtered.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
    return { pending, invoiced, paid, total: pending + invoiced + paid };
  }, [filtered]);

  // ─── Top transactions ───────────────────────────────────────────────────────
  const topTxns = useMemo(
    () => [...filtered].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [filtered]
  );

  const isEmpty = !loading && filtered.length === 0;

  return (
    <PageTransition className="min-h-screen bg-background pb-36 lg:pb-16">
      {/* ── Header ── */}
      <div className="px-4 sm:px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-full bg-white border border-border/50 shadow-sm hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[28px] leading-none font-bold text-foreground tracking-tight">
              Analytics
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-1">
              {loading
                ? <span className="inline-block h-3 w-28 rounded bg-border/40 animate-pulse" />
                : `${filtered.length} transactions`}
            </p>
          </div>
        </div>

        {/* Period tabs */}
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "px-4 py-2 rounded-[1rem] text-[13px] font-semibold border transition-all",
                period === p.value
                  ? "gradient-primary text-white border-transparent glow-primary shadow-lg"
                  : "bg-white text-muted-foreground border-border/50 hover:border-primary/30 shadow-sm"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="px-4 sm:px-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
          </div>
          <SkeletonCard className="h-64" />
          <SkeletonCard className="h-56" />
          <TransactionListSkeleton count={5} />
        </div>
      ) : isEmpty ? (
        <div className="px-5 flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-5">
            <TrendingUp className="h-9 w-9 text-primary/30" />
          </div>
          <p className="text-foreground font-semibold text-[17px]">No data for this period</p>
          <p className="text-muted-foreground text-[13px] mt-1.5">
            Add some transactions to see your analytics
          </p>
        </div>
      ) : (
        <div className="px-4 sm:px-5 space-y-4">

          {/* ── KPI cards ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Spend */}
            <div className="col-span-2 p-5 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Total Spend
              </p>
              <p className="text-[32px] font-bold text-foreground leading-none tracking-tight">
                {formatCurrency(totalSpend)}
              </p>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${billablePct}%`,
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">{billablePct}% billable</span>
                <span className="text-[11px] font-medium text-muted-foreground">{100 - billablePct}% personal</span>
              </div>
            </div>

            {/* Billable */}
            <div className="p-4 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Billable</p>
                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center">
                  <ReceiptText className="h-4 w-4 text-violet-500" />
                </div>
              </div>
              <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(billableTotal)}</p>
              <p className="text-[12px] font-medium text-muted-foreground mt-1">
                {filtered.filter((t) => t.is_invoicable).length} txns
              </p>
            </div>

            {/* Personal */}
            <div className="p-4 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Personal</p>
                <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-pink-500" />
                </div>
              </div>
              <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(personalTotal)}</p>
              <p className="text-[12px] font-medium text-muted-foreground mt-1">
                {filtered.filter((t) => !t.is_invoicable).length} txns
              </p>
            </div>
          </div>

          {/* ── Spending Trend ── */}
          {monthlyData.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[15px] font-bold text-foreground">Spending Trend</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[12px] font-medium text-muted-foreground mb-4">
                Personal vs billable by month
              </p>
              <div className="h-[200px] sm:h-[220px] w-full overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -24, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 10, fontWeight: 500 }}
                      tickFormatter={(v) => `R${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                      width={44}
                    />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: "#F8FAFC", radius: 8 }} />
                    <Bar dataKey="personal" name="Personal" fill="#8B5CF6" radius={[4, 4, 4, 4]} barSize={12} />
                    <Bar dataKey="billable" name="Billable" fill="#C4B5FD" radius={[4, 4, 4, 4]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Personal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#C4B5FD]" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Billable</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Category Breakdown ── */}
          {categoryData.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
              <p className="text-[15px] font-bold text-foreground mb-0.5">By Category</p>
              <p className="text-[12px] font-medium text-muted-foreground mb-4">Top spending categories</p>

              {/* Donut centered + list below on mobile, side-by-side on sm+ */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="relative w-[140px] h-[140px] mx-auto sm:mx-0 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="amount"
                        stroke="none"
                        cornerRadius={4}
                      >
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Total</span>
                    <span className="text-[14px] font-bold text-foreground leading-none">
                      R{(categoryData.reduce((s, c) => s + c.amount, 0) / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>

                {/* Ranked list */}
                <div className="flex-1 space-y-2.5 min-w-0">
                  {categoryData.map((cat, i) => {
                    const pct = totalSpend > 0 ? (cat.amount / totalSpend) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-[12px] font-semibold text-foreground truncate">{cat.name}</span>
                          </div>
                          <span className="text-[11px] font-bold font-mono text-muted-foreground ml-2 flex-shrink-0">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── Status Overview ── */}
          <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
            <p className="text-[15px] font-bold text-foreground mb-1">Status Overview</p>
            <p className="text-[12px] font-medium text-muted-foreground mb-4">
              Where your money stands
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  label: "Pending",
                  amount: statusData.pending,
                  count: filtered.filter((t) => t.status === "pending").length,
                  icon: Clock,
                  color: "#f59e0b",
                  bg: "bg-amber-50",
                  text: "text-amber-600",
                },
                {
                  label: "Invoiced",
                  amount: statusData.invoiced,
                  count: filtered.filter((t) => t.status === "invoiced").length,
                  icon: FileCheck,
                  color: "#6366f1",
                  bg: "bg-indigo-50",
                  text: "text-indigo-600",
                },
                {
                  label: "Paid",
                  amount: statusData.paid,
                  count: filtered.filter((t) => t.status === "paid").length,
                  icon: CheckCircle2,
                  color: "#10b981",
                  bg: "bg-emerald-50",
                  text: "text-emerald-600",
                },
              ].map(({ label, amount, count, icon: Icon, color, bg, text }) => (
                <div key={label} className={cn("rounded-[1.25rem] p-3 sm:p-3.5", bg)}>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm">
                    <Icon className={cn("h-3.5 w-3.5", text)} />
                  </div>
                  <p className={cn("text-[10px] sm:text-[11px] font-bold uppercase tracking-wider leading-none mb-1.5", text)}>
                    {label}
                  </p>
                  <p className="text-[13px] sm:text-[15px] font-bold text-foreground leading-none">
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground mt-1">
                    {count} txn{count !== 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top Transactions ── */}
          {topTxns.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white border border-border/40 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[15px] font-bold text-foreground">Biggest Expenses</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-0.5">Top 5 by amount</p>
                </div>
                <Link
                  href="/expenses"
                  className="flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                >
                  View all
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {topTxns.map((txn, i) => {
                  const cat = getCategoryById(categories, txn.category_id);
                  const pct = totalSpend > 0 ? (txn.amount / totalSpend) * 100 : 0;
                  return (
                    <div key={txn.id} className="flex items-center gap-3">
                      {/* Rank */}
                      <span className="text-[12px] font-bold text-muted-foreground w-4 flex-shrink-0 text-right">
                        {i + 1}
                      </span>

                      {/* Color dot */}
                      <div
                        className="w-8 h-8 rounded-[0.75rem] flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${cat?.color ?? "#6366f1"}18` }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat?.color ?? "#6366f1" }}
                        />
                      </div>

                      {/* Description + bar */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate leading-none mb-1.5">
                          {txn.description}
                        </p>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat?.color ?? "#6366f1" }}
                          />
                        </div>
                      </div>

                      {/* Amount */}
                      <span className="text-[14px] font-bold font-mono text-foreground flex-shrink-0">
                        {formatCurrency(txn.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      <BottomNav />
    </PageTransition>
  );
}
