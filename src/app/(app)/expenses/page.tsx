"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { TransactionCard } from "@/frontend/components/transaction-card";
import { TransactionListSkeleton } from "@/frontend/components/transaction-card-skeleton";
import { PageTransition } from "@/frontend/components/page-transition";
import { IS_MOCK_MODE, MOCK_TRANSACTIONS, MOCK_CATEGORIES } from "@/backend/lib/mock-data";
import { getUserTransactions, getCategories } from "@/backend/actions/data";
import { deleteTransaction } from "@/backend/actions/transactions";
import type { Transaction, TransactionStatus } from "@/backend/lib/types/database.types";
import {
  ChevronLeft,
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/backend/lib/utils";
import { format } from "date-fns";
import { getCategoryIcon } from "@/frontend/components/category-icon";

const PAGE_SIZE = 50;

const STATUS_TABS: { label: string; value: TransactionStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Invoiced", value: "invoiced" },
  { label: "Paid", value: "paid" },
];

type BillabilityFilter = "all" | "billable" | "personal";

const BILLABILITY_TABS: { label: string; value: BillabilityFilter }[] = [
  { label: "All", value: "all" },
  { label: "Billable", value: "billable" },
  { label: "Personal", value: "personal" },
];

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

function formatRand(value: number) {
  return value.toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

export default function ExpensesPage() {
  const [allTxns, setAllTxns] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState<TransactionStatus | "all">("all");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");
  const [activeBillability, setActiveBillability] = useState<BillabilityFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transactions
  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
      setLoading(true);

      if (IS_MOCK_MODE) {
        // Yield to browser to allow skeleton to paint first
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

    fetchTransactions();
    return () => { cancelled = true; };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, activeStatus, activeCategoryId, activeBillability, sortBy]);

  // Filter
  const filtered = useMemo(() => {
    return allTxns.filter((t) => {
      const matchesSearch =
        search.trim() === "" ||
        t.description.toLowerCase().includes(search.trim().toLowerCase()) ||
        t.categories?.name.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus =
        activeStatus === "all" ||
        // Status filter only applies to billable items; personal always pass through
        !t.is_invoicable ||
        t.status === activeStatus;
      const matchesCategory = activeCategoryId === "all" || t.category_id === activeCategoryId;
      const matchesBillability =
        activeBillability === "all" ||
        (activeBillability === "billable" && t.is_invoicable) ||
        (activeBillability === "personal" && !t.is_invoicable);
      return matchesSearch && matchesStatus && matchesCategory && matchesBillability;
    });
  }, [allTxns, search, activeStatus, activeCategoryId, activeBillability]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      return 0;
    });
  }, [filtered, sortBy]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const visibleTxns = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  const totalFiltered = sorted.reduce((s, t) => s + t.amount, 0);
  const billableFiltered = sorted.filter((t) => t.is_invoicable);
  const personalFiltered = sorted.filter((t) => !t.is_invoicable);
  const billableTotal = billableFiltered.reduce((s, t) => s + t.amount, 0);
  const personalTotal = personalFiltered.reduce((s, t) => s + t.amount, 0);
  const hasActiveFilters = activeStatus !== "all" || activeCategoryId !== "all" || activeBillability !== "all" || search.trim() !== "";

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setActiveStatus("all");
    setActiveCategoryId("all");
    setActiveBillability("all");
    setSortBy("date-desc");
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setAllTxns((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransaction(id);
    } catch {
      const [txns] = await Promise.all([getUserTransactions()]);
      setAllTxns(txns);
    }
  }, []);

  return (
    <PageTransition className="min-h-screen bg-[#F4F5FB] dark:bg-[#0f0f14] pb-32 md:pb-12 text-foreground transition-colors duration-300">
      <div className="px-4 sm:px-6 md:px-10 mx-auto w-full max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 pt-10 pb-5">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.95] flex-shrink-0"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </Link>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                {format(new Date(), "EEEE, d MMMM")}
              </p>
              <h1 className="text-[22px] sm:text-[28px] leading-tight font-bold tracking-tight truncate">
                All Expenses
              </h1>
              <p className="text-[12px] sm:text-[13px] font-medium text-muted-foreground mt-0.5">
                {loading ? (
                  <span className="inline-block h-3 w-32 rounded bg-border/40 animate-pulse" />
                ) : (
                  `${allTxns.length} total transaction${allTxns.length !== 1 ? "s" : ""}`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/invoices"
              className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm hover:border-primary/40 hover:shadow-md transition-[border-color,box-shadow,transform] duration-150 active:scale-[0.95] hidden sm:block"
              title="Invoices"
            >
              <FileText className="h-5 w-5 text-foreground" />
            </Link>
            <Link
              href="/add"
              className="p-2.5 rounded-full text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] flex items-center justify-center transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.95]"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              title="Add transaction"
            >
              <Plus className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "p-2.5 rounded-full border shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.95]",
                showFilters || activeCategoryId !== "all" || sortBy !== "date-desc"
                  ? "bg-primary text-white border-primary shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                  : "bg-white dark:bg-[#1a1a2e] border-border/40 dark:border-white/10 text-foreground hover:border-primary/40"
              )}
              title="Sort & category filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 shadow-sm text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-[border-color,box-shadow] duration-150"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-secondary dark:hover:bg-white/10"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Extended Filters: sort + category */}
        {showFilters && (
          <div className="mt-4 bg-white dark:bg-[#1a1a2e] rounded-3xl border border-border/40 dark:border-white/10 shadow-sm p-5 space-y-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
                Sort By
              </p>
              <div className="flex gap-2 flex-wrap">
                {[
                  { label: "Newest First", value: "date-desc" },
                  { label: "Oldest First", value: "date-asc" },
                  { label: "Highest Amount", value: "amount-desc" },
                  { label: "Lowest Amount", value: "amount-asc" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value as SortOption)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[13px] font-semibold border transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.97]",
                      sortBy === opt.value
                        ? "text-white border-transparent shadow-[0_4px_12px_rgba(99,102,241,0.3)]"
                        : "bg-[#F4F5FB] dark:bg-white/5 border-border/40 dark:border-white/10 text-muted-foreground hover:border-primary/30"
                    )}
                    style={sortBy === opt.value ? { backgroundColor: "#6366f1" } : undefined}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 pl-1">
                Category
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setActiveCategoryId("all")}
                  className={cn(
                    "relative flex items-center h-[2.35rem] pr-4 pl-1 rounded-full text-white font-bold text-[11px] tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_4px_10px_rgb(0,0,0,0.1)]",
                    activeCategoryId === "all" ? "ring-2 ring-offset-2 ring-primary" : ""
                  )}
                  style={{ backgroundColor: activeCategoryId === "all" ? "#6366f1" : "#9ca3af" }}
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm mr-2.5 flex-shrink-0">
                    <LayoutGrid className="w-3.5 h-3.5" style={{ color: activeCategoryId === "all" ? "#6366f1" : "#9ca3af" }} />
                  </div>
                  ALL
                </button>

                {categories.map((cat) => {
                  const Icon = getCategoryIcon(cat.name);
                  const isActive = activeCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategoryId((prev) => (prev === cat.id ? "all" : cat.id))}
                      className={cn(
                        "relative flex items-center h-[2.35rem] pr-4 pl-1 rounded-full text-white font-bold text-[11px] tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_4px_10px_rgb(0,0,0,0.1)]",
                        isActive ? "ring-2 ring-offset-2" : "opacity-90 saturate-[0.85]"
                      )}
                      style={{
                        backgroundColor: cat.color,
                        ...(isActive ? { "--tw-ring-color": cat.color } as React.CSSProperties : {})
                      }}
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm mr-2.5 flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      </div>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Consolidated filter pills: billability + status.
            Mobile: stacked full-width rows so everything is visible without scrolling.
            sm+: inline row. */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4 mb-4">
          <div className="flex w-full sm:w-auto p-1 bg-white dark:bg-[#1a1a2e] rounded-full border border-border/40 dark:border-white/10 shadow-sm">
            {BILLABILITY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveBillability(tab.value)}
                className={cn(
                  "flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-semibold whitespace-nowrap transition-[background-color,color] duration-150",
                  activeBillability === tab.value
                    ? "text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
                style={activeBillability === tab.value ? { backgroundColor: "#6366f1" } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status — only applies to billable items */}
          {activeBillability !== "personal" && (
            <div className="flex w-full sm:w-auto p-1 bg-white dark:bg-[#1a1a2e] rounded-full border border-border/40 dark:border-white/10 shadow-sm">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveStatus(tab.value)}
                  className={cn(
                    "flex-1 sm:flex-initial px-2 sm:px-4 py-1.5 rounded-full text-[12px] sm:text-[13px] font-semibold whitespace-nowrap transition-[background-color,color] duration-150",
                    activeStatus === tab.value
                      ? "text-white shadow-[0_2px_8px_rgba(99,102,241,0.3)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  style={activeStatus === tab.value ? { backgroundColor: "#6366f1" } : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center justify-center gap-1 px-3 py-1 sm:py-2 text-[13px] font-bold text-primary hover:underline whitespace-nowrap self-end sm:self-auto"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>

        {/* Summary stat strip — live-updates with filters */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
              <p className="text-[14px] sm:text-[18px] font-bold tracking-tight leading-none mb-1">
                <span className="text-[10px] sm:text-[13px] text-muted-foreground font-semibold pr-0.5">R</span>
                {formatRand(totalFiltered)}
              </p>
              <p className="text-[10px] sm:text-[12px] font-medium text-muted-foreground">
                {sorted.length} result{sorted.length !== 1 ? "s" : ""}{hasActiveFilters ? " · filtered" : ""}
              </p>
            </div>
            <div className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Billable</p>
              <p className="text-[14px] sm:text-[18px] font-bold tracking-tight leading-none mb-1">
                <span className="text-[10px] sm:text-[13px] text-muted-foreground font-semibold pr-0.5">R</span>
                {formatRand(billableTotal)}
              </p>
              <p className="text-[10px] sm:text-[12px] font-medium text-muted-foreground">
                {billableFiltered.length} txn{billableFiltered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="bg-white dark:bg-[#1a1a2e] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-border/40 dark:border-white/10 shadow-sm">
              <p className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Personal</p>
              <p className="text-[14px] sm:text-[18px] font-bold tracking-tight leading-none mb-1">
                <span className="text-[10px] sm:text-[13px] text-muted-foreground font-semibold pr-0.5">R</span>
                {formatRand(personalTotal)}
              </p>
              <p className="text-[10px] sm:text-[12px] font-medium text-muted-foreground">
                {personalFiltered.length} txn{personalFiltered.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="mt-4">
            <TransactionListSkeleton count={7} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#1a1a2e] rounded-3xl border border-border/40 dark:border-white/10 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-foreground font-semibold">No matching expenses</p>
            <p className="text-muted-foreground text-[13px] mt-1">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-4 text-[13px] font-bold text-primary hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleTxns.map((txn) => (
                <TransactionCard key={txn.id} transaction={txn} onDelete={handleDelete} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between py-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-5 py-2.5 rounded-full text-[13px] font-bold bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 disabled:opacity-50 transition-all shadow-sm disabled:cursor-not-allowed hover:-translate-x-0.5 active:translate-x-0 disabled:hover:translate-x-0"
                >
                  Previous
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-[13px] font-medium text-muted-foreground">
                    Page <span className="font-bold text-foreground">{page}</span> of {totalPages}
                  </span>
                  <span className="text-[10px] text-muted-foreground/70 uppercase tracking-widest mt-0.5">
                    {sorted.length} Total
                  </span>
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-5 py-2.5 rounded-full text-[13px] font-bold bg-white dark:bg-[#1a1a2e] border border-border/40 dark:border-white/10 disabled:opacity-50 transition-all shadow-sm disabled:cursor-not-allowed hover:translate-x-0.5 active:translate-x-0 disabled:hover:translate-x-0"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

      </div>

      <BottomNav />
    </PageTransition>
  );
}
