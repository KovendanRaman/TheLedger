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
import { Button } from "@/frontend/components/ui/button";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Loader2,
  Link2,
  ExternalLink,
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

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-[#F4F5FB] pb-32">
        <div className="px-5 pt-14 pb-6">
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-gray-200 rounded-lg animate-pulse mt-2" />
        </div>
        <div className="px-5 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-border/40 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-gray-200" />
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

  // ── Success state ──────────────────────────────────────────
  if (step === "success") {
    return (
      <PageTransition className="min-h-screen bg-[#F4F5FB] pb-32">
        <div className="px-5 pt-14 pb-6">
          <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Invoices
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

  // ── Select transactions state ──────────────────────────────
  return (
    <PageTransition className="min-h-screen bg-[#F4F5FB] pb-40">
      <div className="px-5 pt-14 pb-6">
        <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">
          New Statement
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Select the transactions to include in this invoice.
        </p>
      </div>

      {txns.length === 0 ? (
        <div className="px-5">
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[1.5rem] border border-border/50 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">No pending billable transactions</p>
            <p className="text-muted-foreground text-[13px] mt-1 px-4 max-w-xs">
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
          {/* Select all bar */}
          <div className="px-5 mb-3">
            <button
              onClick={selectAll}
              className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <div className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                selected.size === txns.length
                  ? "bg-primary border-primary"
                  : "border-gray-300"
              )}>
                {selected.size === txns.length && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              {selected.size === txns.length ? "Deselect all" : "Select all"} ({txns.length})
            </button>
          </div>

          {/* Transaction list */}
          <div className="px-5 space-y-2">
            {txns.map((txn) => {
              const isSelected = selected.has(txn.id);
              return (
                <button
                  key={txn.id}
                  onClick={() => toggle(txn.id)}
                  className={cn(
                    "w-full flex items-center gap-3 bg-white rounded-2xl p-4 border transition-all text-left",
                    isSelected
                      ? "border-primary/40 shadow-[0_0_0_1px_rgba(99,102,241,0.2)] bg-primary/[0.02]"
                      : "border-border/40 hover:border-border"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all shrink-0",
                    isSelected ? "bg-primary border-primary" : "border-gray-300"
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-foreground truncate">
                      {txn.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatDate(txn.date)}</span>
                      {txn.categories && (
                        <>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs font-medium" style={{ color: txn.categories.color }}>
                            {txn.categories.name}
                          </span>
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

      {/* Sticky bottom bar */}
      {txns.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-border/40 p-4 pb-safe z-40 lg:ml-64">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                {selected.size} of {txns.length} selected
              </p>
              <p className="text-xl font-bold tracking-tight">
                {formatCurrency(selectedTotal)}
              </p>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={selected.size === 0 || isPending}
              className="h-12 px-8 rounded-xl font-bold text-base gradient-primary shadow-lg shadow-primary/25"
            >
              {isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Create Statement (${selected.size})`
              )}
            </Button>
          </div>
        </div>
      )}

      <BottomNav className="lg:hidden" />
    </PageTransition>
  );
}
