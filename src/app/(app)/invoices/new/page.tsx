"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { getPendingInvoicableTransactions, getParentalLinksForUser } from "@/backend/actions/data";
import { generateInvoice } from "@/backend/actions/transactions";
import { formatCurrency, formatDate } from "@/backend/lib/utils";
import { IS_MOCK_MODE, MOCK_TRANSACTIONS, MOCK_PARENTAL_LINKS } from "@/backend/lib/mock-data";
import type { Transaction, ParentalLink } from "@/backend/lib/types/database.types";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { PageTransition } from "@/frontend/components/page-transition";
import { CategoryBadge } from "@/frontend/components/category-badge";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Link2,
  ExternalLink,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "select" | "success";

export default function NewInvoicePage() {
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [links, setLinks] = useState<ParentalLink[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("select");
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (IS_MOCK_MODE) {
        const pending = (MOCK_TRANSACTIONS as Transaction[]).filter(
          (t) => t.is_invoicable && t.status === "pending"
        );
        setTxns(pending);
        setLinks(MOCK_PARENTAL_LINKS);
        setLoading(false);
        return;
      }
      const [pendingTxns, parentalLinks] = await Promise.all([
        getPendingInvoicableTransactions(),
        getParentalLinksForUser(),
      ]);
      setTxns(pendingTxns);
      setLinks(parentalLinks);
      setLoading(false);
    }
    load();
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === txns.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(txns.map((t) => t.id)));
    }
  }

  const selectedTotal = txns
    .filter((t) => selected.has(t.id))
    .reduce((s, t) => s + t.amount, 0);

  function handleGenerate() {
    if (selected.size === 0) return;

    if (IS_MOCK_MODE) {
      toast.success("[Mock] Statement created!");
      setStep("success");
      return;
    }

    startTransition(async () => {
      try {
        await generateInvoice(Array.from(selected));
        setStep("success");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to create statement.");
      }
    });
  }

  function copyLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    toast.success("Link copied!");
    setTimeout(() => setCopiedLink(null), 2000);
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  // ── Loading state ────────────────────────────────────────────
  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-[#F4F5FB]">
        <div className="px-5 pt-10 pb-6">
          <div className="h-4 w-24 bg-gray-200 rounded-lg animate-pulse mb-5" />
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="px-5 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-border/40 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 bg-gray-200 rounded-lg" />
                  <div className="h-3 w-1/2 bg-gray-100 rounded-lg" />
                </div>
                <div className="h-5 w-16 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
        <BottomNav className="lg:hidden" />
      </PageTransition>
    );
  }

  // ── Success state ────────────────────────────────────────────
  if (step === "success") {
    return (
      <PageTransition className="min-h-screen bg-[#F4F5FB] pb-28 lg:pb-12">
        <div className="px-5 pt-10 pb-6">
          <Link
            href="/invoices"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Statements
          </Link>
        </div>

        <div className="px-5 max-w-lg mx-auto">
          <div className="bg-white rounded-[2rem] p-8 border border-border/40 shadow-sm text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Statement Created!</h1>
            <p className="text-muted-foreground text-[15px] mb-2">
              {selected.size} transaction{selected.size !== 1 ? "s" : ""} totalling{" "}
              <span className="font-bold text-foreground">{formatCurrency(selectedTotal)}</span>
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Share a link below with your parent so they can view the statement.
            </p>

            {links.length > 0 ? (
              <div className="space-y-3 text-left">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold px-1">
                  Share Links
                </p>
                {links.map((link) => {
                  const url = `${origin}/view/${link.key}`;
                  const isCopied = copiedLink === url;
                  return (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-3"
                    >
                      <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{link.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{url}</p>
                      </div>
                      <button
                        onClick={() => copyLink(url)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                          isCopied
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-white border border-border/60 text-foreground hover:bg-muted/50"
                        )}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? "Copied" : "Copy"}
                      </button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg border border-border/60 hover:bg-muted/50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm text-left">
                You haven&apos;t set up any parental share links yet.{" "}
                <Link href="/settings" className="font-bold underline">
                  Create one in Settings
                </Link>{" "}
                to share this statement.
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/invoices"
                className="flex-1 inline-flex items-center justify-center h-12 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
              >
                View All Statements
              </Link>
              <Link
                href="/invoices/new"
                onClick={() => { setStep("select"); setSelected(new Set()); setLoading(true); }}
                className="flex-1 inline-flex items-center justify-center h-12 rounded-xl border border-border/60 font-bold text-sm hover:bg-muted/50 transition-colors"
              >
                Create Another
              </Link>
            </div>
          </div>
        </div>

        <BottomNav className="lg:hidden" />
      </PageTransition>
    );
  }

  // ── Select transactions state ────────────────────────────────
  // Full-height flex column: header + scrollable list + action bar.
  // No fixed positioning — the bar is part of the natural layout flow.
  return (
    <PageTransition className="h-screen flex flex-col bg-[#F4F5FB] overflow-hidden">

      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex-shrink-0">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-[26px] font-bold text-foreground tracking-tight">New Statement</h1>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">
          Select the transactions to include.
        </p>
      </div>

      {txns.length === 0 ? (
        /* Empty state — centred in remaining space */
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="flex flex-col items-center text-center bg-white rounded-[1.5rem] border border-border/50 shadow-sm p-10 w-full max-w-sm">
            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">No pending billable transactions</p>
            <p className="text-muted-foreground text-[13px] mt-1 max-w-[220px]">
              Add transactions and mark them as &quot;billable&quot; to include them in a statement.
            </p>
            <Link
              href="/add"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#6366f1" }}
            >
              Add Transaction
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Select-all row */}
          <div className="px-5 pb-2 flex-shrink-0 flex items-center justify-between">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                  selected.size === txns.length
                    ? "bg-primary border-primary"
                    : "border-gray-300"
                )}
              >
                {selected.size === txns.length && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              {selected.size === txns.length ? "Deselect all" : "Select all"} ({txns.length})
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {selected.size} selected
            </span>
          </div>

          {/* Scrollable transaction list */}
          <div className="flex-1 overflow-y-auto px-5 space-y-2 pb-3">
            {txns.map((txn) => {
              const isSelected = selected.has(txn.id);
              return (
                <button
                  key={txn.id}
                  onClick={() => toggle(txn.id)}
                  className={cn(
                    "w-full flex items-center gap-3 bg-white rounded-2xl p-4 border transition-all text-left",
                    isSelected
                      ? "border-primary/40 shadow-[0_0_0_1px_rgba(99,102,241,0.15)] bg-primary/[0.02]"
                      : "border-border/40 hover:border-border/70"
                  )}
                >
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                      isSelected ? "bg-primary border-primary" : "border-gray-300"
                    )}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {txn.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                      {txn.categories && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <CategoryBadge
                            name={txn.categories.name}
                            color={txn.categories.color ?? undefined}
                            size="sm"
                            className="shadow-none"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-[15px] font-bold text-foreground whitespace-nowrap">
                    {formatCurrency(txn.amount)}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Action bar — naturally at the bottom of the flex column, no fixed needed */}
      {txns.length > 0 && (
        <div className="flex-shrink-0 bg-white/90 backdrop-blur-md border-t border-border/30 px-5 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] lg:mb-0 mb-16">
          <div className="flex items-center justify-between gap-4">
            {/* Summary */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
              >
                <Receipt className="w-5 h-5" style={{ color: "#6366f1" }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium leading-tight">
                  {selected.size} of {txns.length} selected
                </p>
                <p className="text-[18px] font-bold tracking-tight leading-tight">
                  {formatCurrency(selectedTotal)}
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleGenerate}
              disabled={selected.size === 0 || isPending}
              className={cn(
                "h-11 px-7 rounded-xl font-bold text-[15px] text-white transition-all",
                selected.size === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:opacity-90 shadow-[0_6px_20px_rgba(99,102,241,0.35)]"
              )}
              style={{ backgroundColor: "#6366f1" }}
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Create Statement (${selected.size})`
              )}
            </button>
          </div>
        </div>
      )}

      <BottomNav className="lg:hidden" />
    </PageTransition>
  );
}
