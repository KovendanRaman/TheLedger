"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addTransaction } from "@/backend/actions/transactions";
import { getCategories } from "@/backend/actions/data";
import { addIncome } from "@/backend/actions/allowance";
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
import type { Category } from "@/backend/lib/types/database.types";
import { IS_MOCK_MODE, MOCK_CATEGORIES } from "@/backend/lib/mock-data";
import { ChevronLeft, Receipt, Loader2, PlusCircle, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import { useAppMode } from "@/frontend/components/app-mode-provider";
import { cn } from "@/backend/lib/utils";

export default function AddTransactionPage() {
  const router = useRouter();
  const { appMode } = useAppMode();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // Expense State
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isInvoicable, setIsInvoicable] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Income State
  const [incAmount, setIncAmount] = useState("");
  const [incSource, setIncSource] = useState("");
  const [incRecurring, setIncRecurring] = useState(false);
  const [incDate, setIncDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setCategories(MOCK_CATEGORIES);
    } else {
      getCategories().then((cats) => setCategories(cats));
    }
  }, []);

  async function handleExpenseSubmit(e: React.FormEvent) {
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
            toast.success("Expense added! (Mock)");
            router.push("/dashboard");
            return;
        }
        await addTransaction(fd);
        toast.success("Expense logged! 💸");
        router.push("/dashboard");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  async function handleIncomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("amount", incAmount);
    fd.append("source", incSource);
    fd.append("is_recurring", String(incRecurring));
    fd.append("date", incDate);

    startTransition(async () => {
      try {
        if (IS_MOCK_MODE) {
            toast.success("Income added! (Mock)");
            router.push("/dashboard");
            return;
        }
        const { error } = await addIncome(fd);
        if (error) {
            toast.error(error);
            return;
        }
        toast.success("Income logged! 💰");
        router.push("/dashboard");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-32">
      <div className="flex items-center gap-3 px-5 pt-14 pb-6">
        <Link
          href="/dashboard"
          className="p-2.5 rounded-full bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-sm hover:bg-secondary dark:hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
           {appMode === "ALLOWANCE" ? "Log Activity" : "Add Expense"}
        </h1>
      </div>

      {appMode === "ALLOWANCE" && (
        <div className="px-5 mb-6">
          <div className="flex p-1 bg-muted/40 dark:bg-white/5 rounded-[1.25rem] border border-border/40 dark:border-white/10">
            <button
              onClick={() => setActiveTab("expense")}
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-bold transition-all",
                activeTab === "expense"
                  ? "bg-white dark:bg-[#1a1a2e] text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Expense
            </button>
            <button
              onClick={() => setActiveTab("income")}
              type="button"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-bold transition-all",
                activeTab === "income"
                  ? "bg-white dark:bg-[#1a1a2e] text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Income
            </button>
          </div>
        </div>
      )}

      {activeTab === "expense" ? (
        <form onSubmit={handleExpenseSubmit} className="px-5 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Amount (ZAR)</Label>
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
                className="pl-9 font-mono text-2xl h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 text-foreground font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Description</Label>
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

          <div className="space-y-2">
            <Label className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category" className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus:ring-2 focus:ring-primary/20 px-4 font-medium text-[15px]">
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

          <div className="space-y-2">
            <Label htmlFor="date" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 px-4 text-[15px] font-medium"
            />
          </div>

          {appMode === "INVOICE" && (
            <>
              <label
                htmlFor="is_invoicable"
                className="flex items-center justify-between p-4 mt-2 rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm cursor-pointer select-none"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-foreground">
                      Bill to Parent
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Include in the next parent invoice
                    </p>
                  </div>
                </div>
                <Switch
                  id="is_invoicable"
                  checked={isInvoicable}
                  onCheckedChange={setIsInvoicable}
                />
              </label>

              {isInvoicable && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 text-[13px] text-primary font-medium">
                  <Receipt className="h-4 w-4 flex-shrink-0" />
                  This expense will appear on your next parent statement.
                </div>
              )}
            </>
          )}

          <Button
            type="submit"
            className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all gradient-primary mt-2"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><PlusCircle className="mr-2 h-5 w-5" />Log Expense</>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleIncomeSubmit} className="px-5 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="incAmount" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Amount (ZAR)</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xl">R</span>
              <Input
                id="incAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={incAmount}
                onChange={(e) => setIncAmount(e.target.value)}
                className="pl-9 font-mono text-2xl h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="incSource" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Source</Label>
            <Input
              id="incSource"
              type="text"
              placeholder="e.g. Bursary, Weekend job, Cash from Grandma"
              value={incSource}
              onChange={(e) => setIncSource(e.target.value)}
              className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-emerald-500/20 px-4 text-[15px] font-medium"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="incDate" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Date</Label>
            <Input
              id="incDate"
              type="date"
              value={incDate}
              onChange={(e) => setIncDate(e.target.value)}
              className="h-14 bg-white dark:bg-[#1a1a2e] border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-emerald-500/20 px-4 text-[15px] font-medium"
            />
          </div>

          <label
            htmlFor="incRecurring"
            className="flex items-center justify-between p-4 mt-2 rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-white dark:bg-[#1a1a2e] shadow-sm cursor-pointer select-none"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10">
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">Recurring Income</p>
                <p className="text-xs text-muted-foreground mt-0.5">Expect this amount every month</p>
              </div>
            </div>
            <Switch
              id="incRecurring"
              checked={incRecurring}
              onCheckedChange={setIncRecurring}
            />
          </label>

          <Button
            type="submit"
            className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-emerald-500/25 hover:shadow-xl transition-all bg-emerald-500 hover:bg-emerald-600 text-white mt-2"
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><PlusCircle className="mr-2 h-5 w-5" />Log Income</>
            )}
          </Button>
        </form>
      )}

      <BottomNav />
    </PageTransition>
  );
}
