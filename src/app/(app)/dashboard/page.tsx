import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { getUserTransactions, getAllowanceDashboardData, getUserProfile } from "@/backend/actions/data";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { LazyMoneyFlowChart, LazySpendingCategoryChart } from "@/frontend/components/dashboard-charts";
import { PageTransition } from "@/frontend/components/page-transition";
import { AllowanceDashboard } from "@/frontend/components/allowance-dashboard";
import {
  IS_MOCK_MODE,
  MOCK_PROFILE,
  MOCK_TRANSACTIONS,
  MOCK_CATEGORIES,
} from "@/backend/lib/mock-data";
import type { Transaction } from "@/backend/lib/types/database.types";
import { Calendar, Plus, ArrowUpRight, ArrowRight, Settings, FileText, ReceiptText } from "lucide-react";
import { CategoryBadge } from "@/frontend/components/category-badge";
import { CategoryIcon } from "@/frontend/components/category-icon";
import { AnimatedCounter } from "@/frontend/components/animated-counter";
import Link from "next/link";
import { format, parseISO, isSameMonth } from "date-fns";

export const dynamic = "force-dynamic";

function DashboardHeader({
  firstName,
  fullName,
  subtitle,
}: {
  firstName: string;
  fullName: string | null;
  subtitle: string;
}) {
  return (
    <div className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6 md:px-10 pt-10 pb-6">
      <div className="min-w-0">
        <p className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">
          {format(new Date(), "EEEE, d MMMM")}
        </p>
        <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-bold tracking-tight truncate">
          Welcome back, {firstName}!
        </h1>
        <p className="text-muted-foreground text-[13px] sm:text-[15px] mt-0.5 hidden sm:block">{subtitle}</p>
      </div>

      <Link
        href="/settings"
        className="flex items-center gap-3 bg-white dark:bg-[#1a1a2e] pl-2 pr-2 sm:pr-4 py-1.5 rounded-full border border-border/40 dark:border-white/10 shadow-sm hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.97] self-end md:self-auto flex-shrink-0"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          {firstName[0]}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold leading-tight">{fullName ?? "Student"}</p>
        </div>
      </Link>
    </div>
  );
}

function MobileSettingsLink() {
  return (
    <div className="lg:hidden px-4 sm:px-6 md:px-10 mt-8 mb-5 flex justify-center">
      <Link
        href="/settings"
        className="px-6 py-3 bg-white/50 dark:bg-[#1a1a2e]/50 rounded-full text-[14px] font-bold border border-border/40 dark:border-white/10 text-muted-foreground flex items-center gap-2 hover:bg-white dark:hover:bg-[#1a1a2e] transition-[background-color,transform] duration-150 active:scale-[0.97] shadow-sm"
      >
        <Settings className="w-4 h-4" />
        App Settings
      </Link>
    </div>
  );
}

export default async function DashboardPage() {
  let fullName: string | null;
  let txns: Transaction[];
  let appMode: "INVOICE" | "ALLOWANCE" = "INVOICE";

  if (IS_MOCK_MODE) {
    fullName = MOCK_PROFILE.full_name;
    txns = MOCK_TRANSACTIONS as Transaction[];
  } else {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const [profile, fetchedTxns] = await Promise.all([
      getUserProfile(),
      getUserTransactions(),
    ]);

    appMode = profile?.appMode ?? "INVOICE";
    txns = fetchedTxns;
    fullName = session.user.name ?? null;

    // Allowance mode: delegate to AllowanceDashboard
    if (appMode === "ALLOWANCE") {
      const allowanceData = await getAllowanceDashboardData(session.user.id);
      const firstName = fullName?.split(" ")[0] ?? "Student";

      return (
        <PageTransition className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 md:pb-12 text-foreground transition-colors duration-300">
          <DashboardHeader firstName={firstName} fullName={fullName} subtitle="Your personal budget overview." />

          {/* Controls Toolbar */}
          <div className="flex items-center justify-end gap-3 px-4 sm:px-6 md:px-10 mb-5">
            <Link href="/add" className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold transition-[opacity,transform,box-shadow] duration-150 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:opacity-90 active:scale-[0.97] active:shadow-[0_2px_6px_rgba(99,102,241,0.2)]" style={{ backgroundColor: "#6366f1" }}>
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </Link>
          </div>

          <AllowanceDashboard data={allowanceData} firstName={firstName} />

          <MobileSettingsLink />
          <BottomNav className="lg:hidden" />
        </PageTransition>
      );
    }
  }

  // ─── INVOICE mode ────────────────────────────────────────────
  const now = new Date();
  const currentMonthTxns = txns.filter((t) => isSameMonth(parseISO(t.date || t.created_at), now));

  const totalSpend = currentMonthTxns.reduce((s, t) => s + t.amount, 0);
  const pendingInvoicable = currentMonthTxns.filter((t) => t.is_invoicable && t.status !== "paid");
  const invoicableTotal = pendingInvoicable.reduce((s, t) => s + t.amount, 0);
  const personalTxns = currentMonthTxns.filter((t) => !t.is_invoicable);
  const personalTotal = personalTxns.reduce((s, t) => s + t.amount, 0);

  const firstName = fullName?.split(" ")[0] ?? "Student";

  return (
    <PageTransition className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 md:pb-12 text-foreground transition-colors duration-300">
      <DashboardHeader firstName={firstName} fullName={fullName} subtitle="Track your expenses and send invoices to your parents." />

      {/* Main Dashboard Content */}
      <div className="px-4 sm:px-6 md:px-10 space-y-4 sm:space-y-6">

        {/* Bento Grid: hero + stats + quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:auto-rows-fr">

          {/* Hero: Billable this month */}
          <Link
            href="/invoices"
            className="order-1 col-span-2 lg:row-span-2 relative overflow-hidden rounded-3xl p-5 sm:p-7 text-white shadow-[0_8px_28px_rgba(99,102,241,0.35)] transition-[transform,box-shadow] duration-150 hover:shadow-[0_12px_36px_rgba(99,102,241,0.45)] active:scale-[0.99] group flex flex-col justify-between min-h-[180px] sm:min-h-[210px]"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #7558f3 55%, #8b5cf6 100%)" }}
          >
            {/* Decorative shapes */}
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -bottom-16 -left-10 w-52 h-52 rounded-full bg-white/[0.06] pointer-events-none" />

            <div className="relative flex items-start justify-between">
              <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] sm:text-[12px] font-semibold">
                <Calendar className="w-3.5 h-3.5" />
                This month
              </span>
              <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>

            <div className="relative">
              <p className="text-[12px] sm:text-[13px] font-semibold text-white/75 uppercase tracking-wider mb-1.5">Billable</p>
              <p className="text-[32px] sm:text-[42px] font-bold tracking-tight leading-none mb-2">
                <AnimatedCounter
                  value={invoicableTotal}
                  prefix="R"
                  duration={1.4}
                  prefixClassName="text-[18px] sm:text-[24px] text-white/70 font-semibold pr-1"
                />
              </p>
              <p className="text-[12px] sm:text-[13px] font-medium text-white/75">
                {pendingInvoicable.length} expense{pendingInvoicable.length !== 1 ? "s" : ""} pending invoice
              </p>
            </div>
          </Link>

          {/* Stat: Total spend */}
          <Link
            href="/analytics"
            className="order-2 bg-white dark:bg-[#1a1a2e] p-4 sm:p-5 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm relative group flex flex-col justify-between gap-3 hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Total spend</p>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-[18px] sm:text-[24px] font-bold tracking-tight leading-none mb-1">
                <AnimatedCounter
                  value={totalSpend}
                  prefix="R"
                  prefixClassName="text-[12px] sm:text-[15px] text-muted-foreground font-semibold pr-0.5"
                />
              </p>
              <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">
                {currentMonthTxns.length} txn{currentMonthTxns.length !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>

          {/* Stat: Personal */}
          <Link
            href="/expenses"
            className="order-3 lg:order-4 bg-white dark:bg-[#1a1a2e] p-4 sm:p-5 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm relative group flex flex-col justify-between gap-3 hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] sm:text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Personal</p>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="text-[18px] sm:text-[24px] font-bold tracking-tight leading-none mb-1">
                <AnimatedCounter
                  value={personalTotal}
                  prefix="R"
                  duration={1.6}
                  prefixClassName="text-[12px] sm:text-[15px] text-muted-foreground font-semibold pr-0.5"
                />
              </p>
              <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">
                {personalTxns.length} txn{personalTxns.length !== 1 ? "s" : ""}
              </p>
            </div>
          </Link>

          {/* Quick action: Add expense */}
          <Link
            href="/add"
            className="order-4 lg:order-3 bg-white dark:bg-[#1a1a2e] p-4 sm:p-5 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm group flex flex-col justify-between gap-3 hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98]"
          >
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-transform duration-150 group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] sm:text-[14px] font-bold leading-tight">Add expense</p>
              <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground mt-0.5">Log a new transaction</p>
            </div>
          </Link>

          {/* Quick action: New invoice */}
          <Link
            href="/invoices/new"
            className="order-5 bg-white dark:bg-[#1a1a2e] p-4 sm:p-5 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm group flex flex-col justify-between gap-3 hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.98]"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center bg-violet-500/10 text-violet-500 transition-transform duration-150 group-hover:scale-105">
              <FileText className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[13px] sm:text-[14px] font-bold leading-tight">New invoice</p>
              <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground mt-0.5">Bill pending expenses</p>
            </div>
          </Link>
        </div>

        {/* Charts + Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">

            {/* Money Flow Chart Block */}
            <div className="bg-white dark:bg-[#1a1a2e] p-5 sm:p-6 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm">
              <div className="flex justify-between items-center mb-6 gap-4">
                <h2 className="text-lg font-bold">Spending flow</h2>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 dark:bg-white/10 rounded-full text-[12px] font-semibold text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  This month
                </span>
              </div>
              <LazyMoneyFlowChart transactions={currentMonthTxns} />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white dark:bg-[#1a1a2e] px-4 sm:px-6 py-5 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold">Recent transactions</h2>
                <Link href="/expenses" className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/30 dark:bg-white/10 rounded-full text-sm font-semibold hover:bg-muted/50 dark:hover:bg-white/10 transition-[background-color,transform] duration-150 active:scale-[0.97]">
                  See all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {currentMonthTxns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                    <ReceiptText className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[14px] font-bold">No transactions yet this month</p>
                  <p className="text-[12px] text-muted-foreground mt-1 mb-4">Add your first expense to see it here.</p>
                  <Link href="/add" className="flex items-center gap-2 px-4 py-2 text-white rounded-full text-[13px] font-semibold shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:opacity-90 active:scale-[0.97] transition-[opacity,transform] duration-150" style={{ backgroundColor: "#6366f1" }}>
                    <Plus className="w-3.5 h-3.5" />
                    Add expense
                  </Link>
                </div>
              ) : (
                <>
                  {/* Mobile card list */}
                  <div className="md:hidden space-y-1">
                    {currentMonthTxns.slice(0, 5).map((txn) => {
                      const category = txn.categories || MOCK_CATEGORIES.find(c => c.id === txn.category_id);
                      const dateLabel = format(parseISO((txn.date || txn.created_at).split("T")[0]), "dd MMM");
                      return (
                        <div key={txn.id} className="flex items-center gap-3 py-3 border-b border-border/20 dark:border-white/5 last:border-0">
                          <CategoryIcon name={category?.name} color={category?.color} size="md" />
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
                        {currentMonthTxns.slice(0, 5).map((txn) => {
                          const category = txn.categories || MOCK_CATEGORIES.find(c => c.id === txn.category_id);
                          const dateLabel = format(parseISO((txn.date || txn.created_at).split("T")[0]), "dd MMM yyyy");
                          return (
                            <tr key={txn.id} className="border-b border-border/30 dark:border-white/10 last:border-0 hover:bg-muted/10 dark:hover:bg-white/5 transition-colors">
                              <td className="py-3.5 px-2 text-[13px] font-semibold text-muted-foreground whitespace-nowrap">{dateLabel}</td>
                              <td className="py-3.5 px-2 text-[14px] font-bold whitespace-nowrap">R {txn.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                              <td className="py-3.5 px-2">
                                <div className="flex items-center gap-3">
                                  <CategoryIcon name={category?.name} color={category?.color} size="sm" />
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
                </>
              )}
            </div>

          </div>

          {/* Right Column (Span 1) */}
          <div className="space-y-4 sm:space-y-6">

            {/* Spending by Category */}
            <div className="bg-white dark:bg-[#1a1a2e] p-5 sm:p-6 rounded-3xl border border-border/40 dark:border-white/10 shadow-sm relative group">
              <Link href="/analytics" className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/60 dark:border-white/10 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 dark:group-hover:bg-white/10 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <h2 className="text-lg font-bold mb-6">Spending by category</h2>
              <LazySpendingCategoryChart transactions={currentMonthTxns} />
            </div>

          </div>

        </div>

      </div>

      <MobileSettingsLink />
      <BottomNav className="lg:hidden" />
    </PageTransition>
  );
}
