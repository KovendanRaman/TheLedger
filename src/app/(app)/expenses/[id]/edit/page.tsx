"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTransaction, deleteTransaction } from "@/backend/actions/transactions";
import { getTransactionById } from "@/backend/actions/data";
import { getCategories } from "@/backend/actions/data";
import { Button } from "@/frontend/components/ui/button";
import { Input } from "@/frontend/components/ui/input";
import { Label } from "@/frontend/components/ui/label";
import { Switch } from "@/frontend/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/frontend/components/ui/select";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { PageTransition } from "@/frontend/components/page-transition";
import type { Category, Transaction } from "@/backend/lib/types/database.types";
import { IS_MOCK_MODE, MOCK_CATEGORIES, MOCK_TRANSACTIONS } from "@/backend/lib/mock-data";
import { ChevronLeft, Receipt, Loader2, Save, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/backend/lib/utils";

export default function EditTransactionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isInvoicable, setIsInvoicable] = useState(false);
  const [date, setDate] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [txn, setTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    async function load() {
      if (IS_MOCK_MODE) {
        const found = (MOCK_TRANSACTIONS as Transaction[]).find((t) => t.id === params.id);
        setTxn(found ?? null);
        setCategories(MOCK_CATEGORIES);
        if (found) {
          setAmount(String(found.amount));
          setDescription(found.description);
          setCategoryId(found.category_id ?? "");
          setIsInvoicable(found.is_invoicable);
          setDate(found.date.split("T")[0]);
        }
        setLoading(false);
        return;
      }

      const [found, cats] = await Promise.all([
        getTransactionById(params.id),
        getCategories(),
      ]);

      setTxn(found);
      setCategories(cats);
      if (found) {
        setAmount(String(found.amount));
        setDescription(found.description);
        setCategoryId(found.category_id ?? "");
        setIsInvoicable(found.is_invoicable);
        setDate(found.date.split("T")[0]);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("amount", amount);
    fd.append("description", description);
    fd.append("category_id", categoryId);
    fd.append("is_invoicable", String(isInvoicable));
    fd.append("date", date);

    startTransition(async () => {
      try {
        if (IS_MOCK_MODE) {
          toast.success("Transaction updated! (mock)");
          router.push("/expenses");
          return;
        }
        await updateTransaction(params.id, fd);
        toast.success("Transaction updated!");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      if (IS_MOCK_MODE) {
        toast.success("Transaction deleted! (mock)");
        router.push("/expenses");
        return;
      }
      await deleteTransaction(params.id);
      toast.success("Transaction deleted.");
      router.push("/expenses");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete.");
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-background pb-32">
        <div className="flex items-center gap-3 px-5 pt-14 pb-6">
          <div className="w-10 h-10 rounded-full bg-border/40 animate-pulse" />
          <div className="h-7 w-48 rounded-lg bg-border/40 animate-pulse" />
        </div>
        <div className="px-5 space-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-border/30 animate-pulse" />
              <div className="h-14 rounded-[1rem] bg-border/20 animate-pulse" />
            </div>
          ))}
        </div>
        <BottomNav />
      </PageTransition>
    );
  }

  if (!txn) {
    return (
      <PageTransition className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-5">
          <p className="text-foreground font-bold text-lg mb-2">Transaction not found</p>
          <Link href="/expenses" className="text-primary font-semibold text-sm hover:underline">
            ← Back to expenses
          </Link>
        </div>
        <BottomNav />
      </PageTransition>
    );
  }

  const isLocked = txn.status === "invoiced" || txn.status === "paid";

  return (
    <PageTransition className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-6">
        <Link
          href="/expenses"
          className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-sm hover:bg-secondary dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Expense</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate max-w-[220px]">
            {txn.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-red-200 dark:border-red-500/20 shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          title="Delete transaction"
        >
          <Trash2 className="h-5 w-5 text-red-400" />
        </button>
      </div>

      {/* Locked notice */}
      {isLocked && (
        <div className="mx-5 mb-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-amber-700 dark:text-amber-400 font-medium leading-snug">
            This transaction has been <strong>{txn.status}</strong> and is read-only.
            Only the description and category can be changed.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
            Amount (ZAR)
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xl">R</span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLocked}
              className="pl-9 font-mono text-2xl h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 text-foreground font-bold disabled:opacity-50"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">
            Description
          </Label>
          <Input
            id="description"
            type="text"
            placeholder="e.g. Uber Eats, Checkers groceries"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 px-4 text-[15px] font-medium"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus:ring-2 focus:ring-primary/20 px-4 font-medium text-[15px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="rounded-[1rem] shadow-xl border-border/50">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="py-2.5">
                  <span className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLocked}
            className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 px-4 text-[15px] font-medium disabled:opacity-50"
          />
        </div>

        {/* Billable toggle */}
        <label
          htmlFor="is_invoicable"
          className={cn(
            "flex items-center justify-between p-4 mt-2 rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm",
            isLocked ? "opacity-50 cursor-not-allowed" : "cursor-pointer select-none"
          )}
        >
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Bill to Parent</p>
              <p className="text-xs text-muted-foreground mt-0.5">Include in the next parent invoice</p>
            </div>
          </div>
          <Switch
            id="is_invoicable"
            checked={isInvoicable}
            onCheckedChange={setIsInvoicable}
            disabled={isLocked}
          />
        </label>

        {isInvoicable && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-[13px] text-primary font-medium">
            <Receipt className="h-4 w-4 flex-shrink-0" />
            This expense will appear on your next parent statement.
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all gradient-primary mt-2"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Changes
            </>
          )}
        </Button>
      </form>

      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white dark:bg-[#1a1a2e] rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h2 className="text-[18px] font-bold text-foreground text-center mb-2">Delete transaction?</h2>
            <p className="text-[13px] text-muted-foreground text-center mb-6 leading-relaxed">
              <strong className="text-foreground">{txn.description}</strong> will be permanently removed.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-12 rounded-[1rem] border border-border/60 dark:border-white/10 font-bold text-sm hover:bg-muted/50 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-[1rem] bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </PageTransition>
  );
}
