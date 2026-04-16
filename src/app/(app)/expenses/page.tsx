"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Fuel,
  ShoppingCart,
  Utensils,
  Car,
  PenTool,
  Shirt,
  Home,
  Gamepad2,
  MoreHorizontal,
  Tag,
  LayoutGrid,
  Loader2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/backend/lib/utils";

const PAGE_SIZE = 50;

function getCategoryIcon(name: string) {
  switch (name.toLowerCase()) {
    case "fuel": return Fuel;
    case "groceries": return ShoppingCart;
    case "fast food": return Utensils;
    case "transport": return Car;
    case "stationery": return PenTool;
    case "clothing": return Shirt;
    case "accommodation": return Home;
    case "entertainment": return Gamepad2;
    case "other": return MoreHorizontal;
    default: return Tag;
  }
}

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
  const hasActiveFilters = activeStatus !== "all" || activeCategoryId !== "all" || activeBillability !== "all" || search.trim() !== "";

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
    <PageTransition className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/dashboard"
            className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-sm hover:bg-secondary dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-[28px] leading-none font-bold text-foreground tracking-tight">
              All Expenses
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-1">
              {loading ? (
                <span className="inline-block h-3 w-32 rounded bg-border/40 animate-pulse" />
              ) : (
                `${allTxns.length} total transactions`
              )}
            </p>
          </div>
          <Link
            href="/invoices"
            className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-sm hover:bg-secondary dark:hover:bg-white/10 transition-colors"
            title="Statements"
          >
            <FileText className="h-5 w-5 text-foreground" />
          </Link>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "p-2.5 rounded-full border shadow-sm transition-all",
              showFilters || activeCategoryId !== "all" || sortBy !== "date-desc"
                ? "bg-primary text-white border-primary shadow-primary/20"
                : "bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 text-foreground"
            )}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-[1rem] bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-sm text-[15px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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

        {/* Extended Filters */}
        {showFilters && (
          <div className="mt-5 space-y-6">
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
                      "px-4 py-2 rounded-[1rem] text-[13px] font-semibold border transition-all",
                      sortBy === opt.value
                        ? "bg-foreground text-background border-foreground shadow-md shadow-foreground/10"
                        : "bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 text-muted-foreground hover:border-primary/30 shadow-sm"
                    )}
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
      </div>

      {/* Billability Toggle */}
      <div className="flex gap-2 px-5 mb-3 overflow-x-auto no-scrollbar pb-1">
        <p className="sr-only">Filter by type</p>
        {BILLABILITY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveBillability(tab.value)}
            className={cn(
              "px-5 py-2.5 rounded-[1rem] text-[13px] font-semibold whitespace-nowrap transition-all border",
              activeBillability === tab.value
                ? "bg-foreground text-background border-foreground shadow-md shadow-foreground/10"
                : "bg-white dark:bg-[#1a1a2e] text-muted-foreground border border-border/50 dark:border-white/10 hover:border-primary/30 shadow-sm shadow-black/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status Tabs — only shown when billability is not "personal" */}
      {activeBillability !== "personal" && (
        <div className="flex gap-2 px-5 mb-5 overflow-x-auto no-scrollbar pb-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveStatus(tab.value)}
              className={cn(
                "px-5 py-2.5 rounded-[1rem] text-[13px] font-semibold whitespace-nowrap transition-all border",
                activeStatus === tab.value
                  ? "gradient-primary text-white border-transparent glow-primary shadow-lg"
                  : "bg-white dark:bg-[#1a1a2e] text-muted-foreground border border-border/50 dark:border-white/10 hover:border-primary/30 shadow-sm shadow-black/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Results summary */}
      {!loading && (
        <div className="px-5 mb-4 flex items-center justify-between">
          <p className="text-[13px] font-medium text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "result" : "results"}
            {hasActiveFilters && " (filtered)"}
          </p>
          <p className="text-[13px] font-bold font-mono text-foreground">
            R {totalFiltered.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
          </p>
        </div>
      )}

      {/* List */}
      <div className="px-5">
        {loading ? (
          <TransactionListSkeleton count={7} />
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-[#1a1a2e] rounded-[1.5rem] border border-border/50 dark:border-white/10 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-primary/40" />
            </div>
            <p className="text-foreground font-semibold">No matching expenses</p>
            <p className="text-muted-foreground text-[13px] mt-1">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveStatus("all");
                  setActiveCategoryId("all");
                  setActiveBillability("all");
                  setSortBy("date-desc");
                }}
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
                  className="px-4 py-2 rounded-xl text-[13px] font-bold bg-white dark:bg-[#1a1a2e] border border-border/50 disabled:opacity-50 transition-all shadow-sm disabled:cursor-not-allowed hover:-translate-x-0.5 active:translate-x-0 disabled:hover:translate-x-0"
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
                  className="px-4 py-2 rounded-xl text-[13px] font-bold bg-white dark:bg-[#1a1a2e] border border-border/50 disabled:opacity-50 transition-all shadow-sm disabled:cursor-not-allowed hover:translate-x-0.5 active:translate-x-0 disabled:hover:translate-x-0"
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
