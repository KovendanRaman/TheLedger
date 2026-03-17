import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { getDashboardData } from "@/backend/actions/data";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { LazyMoneyFlowChart, LazySpendingCategoryChart } from "@/frontend/components/dashboard-charts";
import { PageTransition } from "@/frontend/components/page-transition";
import { formatCurrency } from "@/backend/lib/utils";
import {
  IS_MOCK_MODE,
  MOCK_PROFILE,
  MOCK_TRANSACTIONS,
  MOCK_CATEGORIES,
} from "@/backend/lib/mock-data";
import type { Transaction } from "@/backend/lib/types/database.types";
import { Calendar, Plus, ArrowUpRight, Wallet, ArrowRight } from "lucide-react";
import { CategoryBadge } from "@/frontend/components/category-badge";
import { AnimatedCounter } from "@/frontend/components/animated-counter";
import Link from "next/link";
import { format, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let fullName: string | null;
  let txns: Transaction[];

  if (IS_MOCK_MODE) {
    fullName = MOCK_PROFILE.full_name;
    txns = MOCK_TRANSACTIONS as Transaction[];
  } else {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    [txns] = await Promise.all([
      getDashboardData(session.user.id),
    ]);
    fullName = session.user.name ?? null;
  }

  // Calculate Metrics
  const totalSpend = txns.reduce((s, t) => s + t.amount, 0);
  const invoicableTotal = txns
    .filter((t) => t.is_invoicable && t.status !== "paid")
    .reduce((s, t) => s + t.amount, 0);
  const pendingCount = txns.filter((t) => t.status === "pending").length;
  const paidTotal = txns.filter((t) => t.status === "paid").reduce((s, t) => s + t.amount, 0);

  const firstName = fullName?.split(" ")[0] ?? "Student";

  return (
    <PageTransition className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 md:pb-12 text-foreground transition-colors duration-300">
      
      {/* Top Navigation Bar */}
      <div className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6 md:px-10 pt-10 pb-5">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold tracking-tight truncate">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground text-[13px] sm:text-[15px] mt-0.5 hidden sm:block">Track your expenses and send invoices to your parents.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          <Link
            href="/settings"
            className="flex items-center gap-3 bg-white dark:bg-[#1a1a2e] pl-2 pr-4 py-1.5 rounded-full border border-border/40 dark:border-white/10 shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {firstName[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">{fullName ?? "Student"}</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-4 sm:px-6 md:px-10 space-y-5">

        {/* Controls Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-[#1a1a2e] px-4 py-2.5 border border-border/40 dark:border-white/10 rounded-full shadow-sm text-sm font-semibold">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>This month</span>
          </div>
          <Link href="/add" className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:opacity-90" style={{ backgroundColor: '#6366f1' }}>
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </Link>
        </div>

        {/* 3 Summary Cards Row */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5">
          {/* Card 1: Total Spend */}
          <div className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm relative group">
            <Link href="/analytics" className="absolute top-3 right-3 sm:top-5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 dark:group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
            <h3 className="font-bold text-[11px] sm:text-[15px] mb-2 sm:mb-4 text-muted-foreground uppercase tracking-wide">Spent</h3>
            <p className="text-[16px] sm:text-3xl font-bold tracking-tight mb-1 sm:mb-4 leading-none">
              <AnimatedCounter
                value={totalSpend}
                prefix="R"
                prefixClassName="text-[11px] sm:text-[20px] text-muted-foreground font-semibold pr-0.5"
              />
            </p>
            <p className="text-[10px] sm:text-[13px] font-semibold text-muted-foreground hidden sm:block">
              {txns.length} transaction{txns.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Card 2: Billable */}
          <div className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm relative group">
            <Link href="/invoices" className="absolute top-3 right-3 sm:top-5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 dark:group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
            <h3 className="font-bold text-[11px] sm:text-[15px] mb-2 sm:mb-4 text-muted-foreground uppercase tracking-wide">Billable</h3>
            <p className="text-[16px] sm:text-3xl font-bold tracking-tight mb-1 sm:mb-4 leading-none">
              <AnimatedCounter
                value={invoicableTotal}
                prefix="R"
                duration={1.4}
                prefixClassName="text-[11px] sm:text-[20px] text-muted-foreground font-semibold pr-0.5"
              />
            </p>
            <p className="text-[10px] sm:text-[13px] font-semibold text-muted-foreground hidden sm:block">Pending invoice</p>
          </div>

          {/* Card 3: Paid out */}
          <div className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm relative group">
            <Link href="/expenses" className="absolute top-3 right-3 sm:top-5 sm:right-5 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 dark:group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
            <h3 className="font-bold text-[11px] sm:text-[15px] mb-2 sm:mb-4 text-muted-foreground uppercase tracking-wide">Paid</h3>
            <p className="text-[16px] sm:text-3xl font-bold tracking-tight mb-1 sm:mb-4 leading-none">
              <AnimatedCounter
                value={paidTotal}
                prefix="R"
                duration={1.6}
                prefixClassName="text-[11px] sm:text-[20px] text-muted-foreground font-semibold pr-0.5"
              />
            </p>
            <p className="text-[10px] sm:text-[13px] font-semibold text-muted-foreground hidden sm:block">{pendingCount} still pending</p>
          </div>
        </div>

        {/* Complex Grid Layout Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Money Flow Chart Block */}
            <div className="bg-white dark:bg-[#1a1a2e] p-6 rounded-[2rem] border border-border/40 dark:border-white/10 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-lg font-bold">Spending flow</h2>
                <div className="flex gap-2">
                  <select className="px-4 py-2 bg-muted/30 dark:bg-white/10 border-none rounded-full text-sm font-semibold text-foreground focus:ring-0 cursor-pointer">
                    <option>All accounts</option>
                    <option>Cash</option>
                  </select>
                  <select className="px-4 py-2 bg-muted/30 dark:bg-white/10 border-none rounded-full text-sm font-semibold text-foreground focus:ring-0 cursor-pointer">
                    <option>This month</option>
                  </select>
                </div>
              </div>
              <LazyMoneyFlowChart transactions={txns} />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-[#1a1a2e] px-4 sm:px-6 py-5 rounded-[2rem] border border-border/40 dark:border-white/10 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold">Recent transactions</h2>
                <Link href="/expenses" className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 dark:bg-white/10 rounded-full text-sm font-semibold hover:bg-muted/50 dark:hover:bg-white/10 transition-colors">
                  See all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-1">
                {txns.slice(0, 5).map((txn) => {
                  const category = txn.categories || MOCK_CATEGORIES.find(c => c.id === txn.category_id);
                  const dateLabel = format(parseISO((txn.date || txn.created_at).split("T")[0]), "dd MMM");
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
                        <div className="flex items-center gap-2 mt-0.5">
                          {category && <CategoryBadge name={category.name} color={category.color} size="sm" variant="soft" className="shadow-none" />}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[14px] font-bold font-mono">R {txn.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{dateLabel}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 dark:border-white/10 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-left">
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Amount</th>
                      <th className="pb-3 px-2">Description</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 5).map((txn) => {
                      const category = txn.categories || MOCK_CATEGORIES.find(c => c.id === txn.category_id);
                      const dateLabel = format(parseISO((txn.date || txn.created_at).split("T")[0]), "dd MMM yyyy");
                      return (
                        <tr key={txn.id} className="border-b border-border/30 dark:border-white/10 last:border-0 hover:bg-muted/10 dark:hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-2 text-[13px] font-semibold text-muted-foreground whitespace-nowrap">{dateLabel}</td>
                          <td className="py-3.5 px-2 text-[14px] font-bold whitespace-nowrap">R {txn.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                          <td className="py-3.5 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                <Wallet className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="text-[14px] font-bold text-foreground truncate max-w-[140px]">{txn.description}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            {txn.is_invoicable ? (
                              <span className={`text-[11px] font-bold px-2 py-1 rounded-md capitalize ${txn.status === 'paid' ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>{txn.status}</span>
                            ) : (
                              <span className="text-[11px] font-bold px-2 py-1 rounded-md bg-muted text-muted-foreground">Personal</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {category ? (
                              <CategoryBadge name={category.name} color={category.color} size="sm" variant="soft" />
                            ) : (
                              <span className="text-[12px] font-medium text-muted-foreground">Uncategorized</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (Span 1) */}
          <div className="space-y-6">

            {/* Spending by Category */}
            <div className="bg-white dark:bg-[#1a1a2e] p-6 rounded-[2rem] border border-border/40 dark:border-white/10 shadow-sm relative group">
              <Link href="/analytics" className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 dark:group-hover:bg-white/10 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <h2 className="text-lg font-bold mb-6">Spending by category</h2>
              <LazySpendingCategoryChart transactions={txns} />
            </div>

          </div>

        </div>

      </div>

      <BottomNav className="lg:hidden" />
    </PageTransition>
  );
}

