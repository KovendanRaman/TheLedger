"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { PageTransition } from "@/frontend/components/page-transition";
import { IS_MOCK_MODE, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from "@/backend/lib/mock-data";
import { getUserTransactions, getCategories, getUserIncomes, getUserProfile } from "@/backend/actions/data";
import { getRecurringExpenses } from "@/backend/actions/allowance";
import type { Transaction, Category, Income, RecurringExpense } from "@/backend/lib/types/database.types";
import { formatCurrency } from "@/backend/lib/utils";
import {
  ChevronLeft, TrendingUp, ShoppingBag,
  ReceiptText, Clock, FileCheck, CheckCircle2, ArrowUpRight,
  Calculator, Wallet, ArrowUpCircle, ShieldCheck, FileDown, Loader2
} from "lucide-react";
import { downloadPersonalExpensesPDF } from "@/frontend/lib/generate-expenses-pdf";
import Link from "next/link";
import { cn } from "@/backend/lib/utils";
import { TransactionListSkeleton } from "@/frontend/components/transaction-card-skeleton";
import { format, subMonths, startOfMonth, parseISO, isAfter, isSameMonth, differenceInDays } from "date-fns";
import { useAppMode } from "@/frontend/components/app-mode-provider";

type Period = "month" | "quarter" | "year" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "This Month", value: "month" },
  { label: "3 Months", value: "quarter" },
  { label: "1 Year", value: "year" },
  { label: "All Time", value: "all" },
];


function getCategoryById(categories: Category[], id: string | null) {
  return categories.find((c) => c.id === id) ?? null;
}

// ─── Tooltip components ───────────────────────────────────────────────────────

function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1a1a2e] px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-border/40 dark:border-white/10">
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
  const { name, color } = payload[0].payload;
  const value = payload[0].value;
  return (
    <div className="bg-white dark:bg-[#1a1a2e] px-3 py-2 rounded-xl shadow-lg border border-border/50 dark:border-white/10 text-center">
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
  const { appMode } = useAppMode();
  const [allTxns, setAllTxns] = useState<Transaction[]>([]);
  const [allIncomes, setAllIncomes] = useState<any[]>([]);
  const [allDebits, setAllDebits] = useState<RecurringExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("month");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      setLoading(true);
      if (IS_MOCK_MODE) {
        await new Promise<void>((r) => setTimeout(r, 0));
        if (!cancelled) {
          setAllTxns(MOCK_TRANSACTIONS);
          setCategories(MOCK_CATEGORIES);
          setAllIncomes([
             { id: "inc1", amount: 2500, source: "Allowance", date: new Date().toISOString(), is_recurring: true }
          ]);
          setAllDebits([
             { id: "deb1", user_id: "mock", name: "Spotify", amount: 60, billing_date: 10, is_active: true, created_at: new Date().toISOString() }
          ]);
          setLoading(false);
        }
        return;
      }
      const [txns, cats, incomes, debits] = await Promise.all([
        getUserTransactions(),
        getCategories(),
        getUserIncomes(),
        getRecurringExpenses(),
      ]);
      if (!cancelled) {
        setAllTxns(txns);
        setCategories(cats);
        setAllIncomes(incomes);
        setAllDebits(debits);
        setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  // ─── Period filter ──────────────────────────────────────────────────────────
  const filteredTxns = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      return allTxns.filter((t) => isSameMonth(parseISO(t.date || t.created_at), now));
    }
    if (period === "quarter") {
      const cutoff = startOfMonth(subMonths(now, 2));
      return allTxns.filter((t) => isAfter(parseISO(t.date || t.created_at), cutoff) || isSameMonth(parseISO(t.date || t.created_at), cutoff));
    }
    if (period === "year") {
      const cutoff = subMonths(now, 12);
      return allTxns.filter((t) => isAfter(parseISO(t.date || t.created_at), cutoff));
    }
    return allTxns;
  }, [allTxns, period]);

  const filteredIncomes = useMemo(() => {
    const now = new Date();
    return allIncomes.filter(i => {
       if (i.is_recurring) return true;
       const dateStr = i.date || new Date().toISOString();
       if (period === "month") return isSameMonth(parseISO(dateStr), now);
       if (period === "quarter") {
         const cutoff = startOfMonth(subMonths(now, 2));
         return isAfter(parseISO(dateStr), cutoff) || isSameMonth(parseISO(dateStr), cutoff);
       }
       if (period === "year") {
         const cutoff = subMonths(now, 12);
         return isAfter(parseISO(dateStr), cutoff);
       }
       return true;
    });
  }, [allIncomes, period]);

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    let totalSpend = 0, billable = 0, personal = 0;
    for (const t of filteredTxns) {
      totalSpend += t.amount;
      if (t.is_invoicable) billable += t.amount;
      else personal += t.amount;
    }

    let totalFixedSpend = 0;
    const activeDebits = allDebits.filter(d => d.is_active);
    for (const d of activeDebits) {
       if (period === "month") totalFixedSpend += d.amount;
       if (period === "quarter") totalFixedSpend += d.amount * 3;
       if (period === "year") totalFixedSpend += d.amount * 12;
       if (period === "all") totalFixedSpend += d.amount * 6; // Rough estimate
    }
    
    const trueTotalSpend = totalSpend + totalFixedSpend;

    let totalIncome = 0;
    // Calculate total income, multiplying recurring by months if needed
    for (const inc of filteredIncomes) {
       if (inc.is_recurring) {
          if (period === "month") totalIncome += inc.amount;
          if (period === "quarter") totalIncome += inc.amount * 3;
          if (period === "year") totalIncome += inc.amount * 12;
          if (period === "all") totalIncome += inc.amount * 6; // Rough estimate
       } else {
          totalIncome += inc.amount;
       }
    }

    // Days in selected period
    const now = new Date();
    let daysCount = 30;
    if (period === "quarter") daysCount = 90;
    if (period === "year") daysCount = 365;
    if (period === "all" && filteredTxns.length > 0) {
       const oldest = filteredTxns.reduce((earliest, t) => {
         const d = parseISO(t.date || t.created_at);
         return isAfter(earliest, d) ? d : earliest;
       }, new Date());
       daysCount = Math.max(1, differenceInDays(now, oldest) + 1);
    }

    return { 
      totalSpend: trueTotalSpend, 
      variableSpend: totalSpend,
      fixedSpend: totalFixedSpend,
      billableTotal: billable, 
      personalTotal: personal, 
      billablePct: trueTotalSpend > 0 ? Math.round((billable / trueTotalSpend) * 100) : 0,
      dailyAvg: daysCount > 0 ? trueTotalSpend / daysCount : 0,
      totalIncome,
      netCashflow: totalIncome - trueTotalSpend
    };
  }, [filteredTxns, filteredIncomes, allDebits, period]);

  const { totalSpend, variableSpend, fixedSpend, billableTotal, personalTotal, billablePct, dailyAvg, totalIncome, netCashflow } = kpis;

  // ─── Monthly trend ──────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const buckets: Record<string, { label: string; personal: number; billable: number; totalSpend: number; totalIncome: number }> = {};
    
    // Transactions
    filteredTxns.forEach((t) => {
      const dateStr = t.date || t.created_at;
      const key = dateStr.substring(0, 7); // YYYY-MM
      if (!buckets[key]) {
        buckets[key] = { label: format(parseISO(dateStr), "MMM yy"), personal: 0, billable: 0, totalSpend: 0, totalIncome: 0 };
      }
      buckets[key].totalSpend += t.amount;
      if (t.is_invoicable) buckets[key].billable += t.amount;
      else buckets[key].personal += t.amount;
    });

    // Incomes
    filteredIncomes.forEach((i) => {
      if (i.is_recurring) return; // Ignore recurring in the bar chart individual buckets for now to avoid complexity
      const dateStr = i.date || new Date().toISOString();
      const key = dateStr.substring(0, 7);
      if (!buckets[key]) {
         buckets[key] = { label: format(parseISO(dateStr), "MMM yy"), personal: 0, billable: 0, totalSpend: 0, totalIncome: 0 };
      }
      buckets[key].totalIncome += i.amount;
    });

    // Add recurring base to all buckets
    const recIncomeSum = filteredIncomes.filter(i => i.is_recurring).reduce((s, i) => s + i.amount, 0);
    const recDebitSum = allDebits.filter(d => d.is_active).reduce((s, d) => s + d.amount, 0);
    
    Object.values(buckets).forEach(b => { 
      b.totalIncome += recIncomeSum; 
      b.totalSpend += recDebitSum;
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [filteredTxns, filteredIncomes, allDebits]);

  // ─── Category breakdown ─────────────────────────────────────────────────────
  const categoryData = useMemo(() => {
    const totals: Record<string, { amount: number; name: string; color: string }> = {};
    filteredTxns.forEach((t) => {
      if (!t.category_id) return;
      const cat = getCategoryById(categories, t.category_id);
      if (!totals[t.category_id]) {
        totals[t.category_id] = { amount: 0, name: cat?.name ?? "Other", color: cat?.color ?? "#10b981" };
      }
      totals[t.category_id].amount += t.amount;
    });
    return Object.values(totals).sort((a, b) => b.amount - a.amount).slice(0, 6);
  }, [filteredTxns, categories]);

  // ─── Status breakdown (billable transactions only) ──────────────────────────
  const statusData = useMemo(() => {
    const billable = filteredTxns.filter((t) => t.is_invoicable);
    const pending  = billable.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);
    const invoiced = billable.filter((t) => t.status === "invoiced").reduce((s, t) => s + t.amount, 0);
    const settled  = billable.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);
    const pendingCount  = billable.filter((t) => t.status === "pending").length;
    const invoicedCount = billable.filter((t) => t.status === "invoiced").length;
    const settledCount  = billable.filter((t) => t.status === "paid").length;
    return { pending, invoiced, settled, pendingCount, invoicedCount, settledCount };
  }, [filteredTxns]);

  // ─── Top transactions ───────────────────────────────────────────────────────
  const topTxns = useMemo(
    () => [...filteredTxns].sort((a, b) => b.amount - a.amount).slice(0, 5),
    [filteredTxns]
  );

  const isEmpty = !loading && filteredTxns.length === 0 && appMode === "INVOICE";
  // For allowance mode, we might have incomes and debits but no transactions
  const isAllowanceEmpty = !loading && filteredTxns.length === 0 && allIncomes.length === 0 && allDebits.length === 0;

  // ─── PDF export ─────────────────────────────────────────────────────────────
  const handleExportPDF = useCallback(async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      // Get user profile for name/email
      const profile = IS_MOCK_MODE
        ? { full_name: "Demo User", email: "demo@theledger.app" }
        : await getUserProfile();

      const personalTxns = filteredTxns.filter((t) => !t.is_invoicable);
      await downloadPersonalExpensesPDF(
        personalTxns,
        categories,
        period,
        profile?.full_name ?? "User",
        profile?.email ?? ""
      );
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  }, [filteredTxns, categories, period, pdfLoading]);

  return (
    <PageTransition className="min-h-screen bg-background pb-36 lg:pb-16">
      {/* ── Header ── */}
      <div className="px-4 sm:px-5 pt-14 pb-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-sm hover:bg-secondary dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[28px] leading-none font-bold text-foreground tracking-tight">
              {appMode === "ALLOWANCE" ? "Spending Insights" : "Analytics"}
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-1">
              {loading
                ? <span className="inline-block h-3 w-28 rounded bg-border/40 animate-pulse" />
                : `${filteredTxns.length} transactions`}
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
                  : "bg-white dark:bg-[#1a1a2e] text-muted-foreground border-border/50 dark:border-white/10 hover:border-primary/30 shadow-sm"
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
      ) : (appMode === "INVOICE" ? isEmpty : isAllowanceEmpty) ? (
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

          {/* ── KPI cards (Dynamic based on Mode) ── */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Total Spend - Full width across both modes */}
            <div className={cn(
               "p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm",
               appMode === "INVOICE" ? "col-span-2" : "col-span-1"
            )}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Total Spend
              </p>
              <p className={cn("font-bold text-foreground leading-none tracking-tight", appMode === "INVOICE" ? "text-[32px]" : "text-[22px]")}>
                {formatCurrency(totalSpend)}
              </p>

              {appMode === "INVOICE" && (
                <>
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
                </>
              )}
            </div>

            {appMode === "INVOICE" ? (
              <>
                {/* Billable */}
                <div className="p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Billable</p>
                    <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/20 flex items-center justify-center">
                      <ReceiptText className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    </div>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(billableTotal)}</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-1">
                    {filteredTxns.filter((t) => t.is_invoicable).length} txns
                  </p>
                </div>

                {/* Personal */}
                <div className="p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Personal</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExportPDF}
                        disabled={pdfLoading || loading}
                        title="Download personal expense report"
                        className="w-8 h-8 rounded-full bg-pink-50 dark:bg-pink-500/20 flex items-center justify-center hover:bg-pink-100 dark:hover:bg-pink-500/30 transition-colors disabled:opacity-50"
                      >
                        {pdfLoading
                          ? <Loader2 className="h-3.5 w-3.5 text-pink-500 dark:text-pink-400 animate-spin" />
                          : <FileDown className="h-3.5 w-3.5 text-pink-500 dark:text-pink-400" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(personalTotal)}</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-1">
                    {filteredTxns.filter((t) => !t.is_invoicable).length} txns
                  </p>
                  <button
                    onClick={handleExportPDF}
                    disabled={pdfLoading || loading}
                    className={cn(
                      "mt-3 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-[0.75rem] text-[11px] font-semibold transition-all",
                      pdfLoading || loading
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-100 dark:hover:bg-pink-500/20"
                    )}
                  >
                    {pdfLoading
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Generating…</>
                      : <><FileDown className="h-3 w-3" /> Download Report</>}
                  </button>
                </div>
              </>
            ) : (
               <>
                {/* Net Cashflow (Allowance only) */}
                <div className="p-4 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Net Cashflow</p>
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-[22px] font-bold text-foreground leading-none">{formatCurrency(netCashflow)}</p>
                </div>

                {/* Total Income */}
                <div className="p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Income</p>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center">
                      <ArrowUpCircle className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(totalIncome)}</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-1">
                    Logged in period
                  </p>
                </div>

                {/* Fixed Costs */}
                <div className="p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Fixed Costs</p>
                    <div className="w-8 h-8 rounded-full bg-violet-50 dark:bg-violet-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                    </div>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(fixedSpend)}</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-1">
                    Debit orders
                  </p>
                </div>

                {/* Daily Average */}
                <div className="p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Daily Avg</p>
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-500/20 flex items-center justify-center">
                      <Calculator className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-[20px] font-bold text-foreground leading-none">{formatCurrency(dailyAvg)}</p>
                  <p className="text-[12px] font-medium text-muted-foreground mt-1">
                    spent per day
                  </p>
                </div>

                {/* Export Report — Allowance Mode */}
                <div className="col-span-2 p-4 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-bold text-foreground">Personal Expense Report</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Download a PDF of your spending for this period</p>
                    </div>
                    <button
                      onClick={handleExportPDF}
                      disabled={pdfLoading || loading}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-[1rem] text-[13px] font-semibold transition-all flex-shrink-0 ml-3",
                        pdfLoading || loading
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "gradient-primary text-white glow-primary shadow-md hover:opacity-90"
                      )}
                    >
                      {pdfLoading
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                        : <><FileDown className="h-4 w-4" /> Download</>}
                    </button>
                  </div>
                </div>
               </>
            )}
          </div>

          {/* ── Spending Trend ── */}
          {monthlyData.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[15px] font-bold text-foreground">
                   {appMode === "INVOICE" ? "Spending Trend" : "Income vs Expense"}
                </p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[12px] font-medium text-muted-foreground mb-4">
                {appMode === "INVOICE" ? "Personal vs billable by month" : "Monthly cashflow comparison"}
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
                    {appMode === "INVOICE" ? (
                      <>
                        <Bar dataKey="personal" name="Personal" fill="#8B5CF6" radius={[4, 4, 4, 4]} barSize={12} />
                        <Bar dataKey="billable" name="Billable" fill="#C4B5FD" radius={[4, 4, 4, 4]} barSize={12} />
                      </>
                    ) : (
                      <>
                        <Bar dataKey="totalIncome" name="Income" fill="#10B981" radius={[4, 4, 4, 4]} barSize={12} />
                        <Bar dataKey="totalSpend" name="Spend" fill="#EF4444" radius={[4, 4, 4, 4]} barSize={12} />
                      </>
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="flex justify-center gap-6 mt-2">
                {appMode === "INVOICE" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                      <span className="text-[11px] font-semibold text-muted-foreground">Personal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#C4B5FD]" />
                      <span className="text-[11px] font-semibold text-muted-foreground">Billable</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="text-[11px] font-semibold text-muted-foreground">Income</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span className="text-[11px] font-semibold text-muted-foreground">Spend</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Category Breakdown ── */}
          {categoryData.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
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

          {/* ── Status Overview (Invoice Mode Only) ── */}
          {appMode === "INVOICE" && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
              <p className="text-[15px] font-bold text-foreground mb-0.5">Status Overview</p>
              <p className="text-[12px] font-medium text-muted-foreground mb-4">
                Billable transactions only
              </p>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  {
                    label: "Pending",
                    sublabel: "awaiting invoice",
                    amount: statusData.pending,
                    count: statusData.pendingCount,
                    icon: Clock,
                    bg: "bg-amber-50 dark:bg-amber-500/20",
                    text: "text-amber-600 dark:text-amber-400",
                  },
                  {
                    label: "Invoiced",
                    sublabel: "on open invoice",
                    amount: statusData.invoiced,
                    count: statusData.invoicedCount,
                    icon: FileCheck,
                    bg: "bg-indigo-50 dark:bg-indigo-500/20",
                    text: "text-indigo-600 dark:text-indigo-400",
                  },
                  {
                    label: "Settled",
                    sublabel: "paid by parent",
                    amount: statusData.settled,
                    count: statusData.settledCount,
                    icon: CheckCircle2,
                    bg: "bg-emerald-50 dark:bg-emerald-500/20",
                    text: "text-emerald-600 dark:text-emerald-400",
                  },
                ].map(({ label, sublabel, amount, count, icon: Icon, bg, text }) => (
                  <div key={label} className={cn("rounded-[1.25rem] p-3 sm:p-3.5", bg)}>
                    <div className="w-7 h-7 rounded-full bg-white dark:bg-[#1a1a2e] flex items-center justify-center mb-2 shadow-sm">
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
          )}

          {/* ── Top Transactions ── */}
          {topTxns.length > 0 && (
            <div className="p-4 sm:p-5 rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm">
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
                        style={{ backgroundColor: `${cat?.color ?? "#10b981"}18` }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat?.color ?? "#10b981" }}
                        />
                      </div>

                      {/* Description + bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-[13px] font-semibold text-foreground truncate leading-none">
                            {txn.description}
                          </p>
                          {/* Personal / Billable pill - INVOICE MODE ONLY */}
                          {appMode === "INVOICE" && (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide flex-shrink-0",
                                txn.is_invoicable
                                  ? "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400"
                                  : "bg-muted/60 text-muted-foreground"
                              )}
                            >
                              {txn.is_invoicable ? "Billable" : "Personal"}
                            </span>
                          )}
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: cat?.color ?? "#10b981" }}
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
