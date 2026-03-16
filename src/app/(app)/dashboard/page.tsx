import { redirect } from "next/navigation";
import { auth } from "@/backend/lib/auth";
import { getDashboardData } from "@/backend/actions/data";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { MoneyFlowChart } from "@/frontend/components/money-flow-chart";
import { SpendingCategoryChart } from "@/frontend/components/budget-donut-chart";
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
    <PageTransition className="min-h-screen bg-[#F4F5FB] pb-32 md:pb-12 text-foreground">
      
      {/* Top Navigation Bar (FinSet Style) */}
      <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4 px-6 md:px-10 pt-10 md:pt-10 pb-6">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight">Welcome back, {firstName}!</h1>
          <p className="text-muted-foreground text-[15px] mt-1">Track your expenses and send invoices to your parents.</p>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center gap-3 bg-white pl-2 pr-4 py-1.5 rounded-full border border-border/40 shadow-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: '#6366f1' }}>
              {firstName[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold leading-tight">{fullName ?? "Student"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="px-6 md:px-10 max-w-7xl mx-auto space-y-6">
        
        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 border border-border/40 rounded-full shadow-sm text-sm font-semibold">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>This month</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <Link href="/add" className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:opacity-90 hover:shadow-[0_6px_16px_rgba(99,102,241,0.4)]" style={{ backgroundColor: '#6366f1' }}>
               <Plus className="w-4 h-4" />
               Add transaction
             </Link>
          </div>
        </div>

        {/* 3 Summary Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Card 1: Total Spend */}
          <div className="bg-white p-5 rounded-3xl border border-border/40 shadow-sm relative group">
            <Link href="/analytics" className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <h3 className="font-bold text-[15px] mb-4">Total spent</h3>
            <p className="text-3xl font-bold tracking-tight mb-4">
              <span className="text-[20px] text-muted-foreground font-semibold pr-1">R</span>{totalSpend.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[13px] font-semibold text-muted-foreground">
              {txns.length} transaction{txns.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Card 2: Billable / Pending invoice */}
          <div className="bg-white p-5 rounded-3xl border border-border/40 shadow-sm relative group">
            <Link href="/invoices" className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <h3 className="font-bold text-[15px] mb-4">Billable</h3>
            <p className="text-3xl font-bold tracking-tight mb-4">
               <span className="text-[20px] text-muted-foreground font-semibold pr-1">R</span>{invoicableTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[13px] font-semibold text-muted-foreground">
              Pending invoice
            </p>
          </div>

          {/* Card 3: Paid out */}
          <div className="bg-white p-5 rounded-3xl border border-border/40 shadow-sm relative group">
            <Link href="/expenses" className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <h3 className="font-bold text-[15px] mb-4">Paid out</h3>
            <p className="text-3xl font-bold tracking-tight mb-4">
              <span className="text-[20px] text-muted-foreground font-semibold pr-1">R</span>{paidTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[13px] font-semibold text-muted-foreground">
              {pendingCount} still pending
            </p>
          </div>
        </div>

        {/* Complex Grid Layout Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column (Span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Money Flow Chart Block */}
            <div className="bg-white p-6 rounded-[2rem] border border-border/40 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="text-lg font-bold">Spending flow</h2>
                <div className="flex gap-2">
                  <select className="px-4 py-2 bg-muted/30 border-none rounded-full text-sm font-semibold text-foreground focus:ring-0 cursor-pointer">
                    <option>All accounts</option>
                    <option>Cash</option>
                  </select>
                  <select className="px-4 py-2 bg-muted/30 border-none rounded-full text-sm font-semibold text-foreground focus:ring-0 cursor-pointer">
                    <option>This month</option>
                  </select>
                </div>
              </div>
              <MoneyFlowChart transactions={txns} />
            </div>

            {/* Recent Transactions Simple List */}
            <div className="bg-white px-6 py-6 rounded-[2rem] border border-border/40 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold">Recent transactions</h2>
                 <Link href="/expenses" className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-full text-sm font-semibold hover:bg-muted/50 transition-colors">
                   See all <ArrowRight className="w-3.5 h-3.5" />
                 </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider text-left">
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Amount</th>
                      <th className="pb-3 px-2">Payment Name</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 5).map((txn) => {
                       const category = txn.categories || MOCK_CATEGORIES.find(c => c.id === txn.category_id);
                       const dateLabel = format(parseISO(txn.date || txn.created_at), "dd MMM HH:mm");
                       
                       return (
                        <tr key={txn.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="py-4 px-2 text-[13px] font-semibold text-muted-foreground whitespace-nowrap">{dateLabel}</td>
                          <td className="py-4 px-2 text-[14px] font-bold">
                            R {txn.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0">
                                 <Wallet className="w-4 h-4 text-primary" />
                               </div>
                               <span className="text-[14px] font-bold text-foreground truncate max-w-[150px]">{txn.description}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            {txn.is_invoicable ? (
                              <span className={`text-[11px] font-bold px-2 py-1 rounded capitalize ${txn.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                                {txn.status}
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2 py-1 rounded bg-muted text-muted-foreground">Personal</span>
                            )}
                          </td>
                          <td className="py-4 px-2 text-right text-[13px] font-semibold text-muted-foreground">
                            {category?.name || "Uncategorized"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column (Span 1) */}
          <div className="space-y-6">

            {/* Spending by Category */}
            <div className="bg-white p-6 rounded-[2rem] border border-border/40 shadow-sm relative group">
              <Link href="/analytics" className="absolute top-5 right-5 w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground group-hover:bg-muted/50 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <h2 className="text-lg font-bold mb-6">Spending by category</h2>
              <SpendingCategoryChart transactions={txns} />
            </div>

          </div>

        </div>

      </div>

      <BottomNav className="lg:hidden" />
    </PageTransition>
  );
}

