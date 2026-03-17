"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addTransaction } from "@/backend/actions/transactions";
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
import type { Category } from "@/backend/lib/types/database.types";
import { IS_MOCK_MODE, MOCK_CATEGORIES } from "@/backend/lib/mock-data";
import { ChevronLeft, Receipt, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function AddTransactionPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isInvoicable, setIsInvoicable] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (IS_MOCK_MODE) {
      setCategories(MOCK_CATEGORIES);
    } else {
      getCategories().then((cats) => setCategories(cats));
    }
  }, []);

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
        await addTransaction(fd);
        toast.success("Transaction added! 💸");
        router.push("/dashboard");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-6">
        <Link
          href="/dashboard"
          className="p-2.5 rounded-full bg-white border border-border/50 shadow-sm hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Add Expense</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 space-y-6">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Amount (ZAR)</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xl">
              R
            </span>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-9 font-mono text-2xl h-14 bg-white border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 text-foreground font-bold"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Description</Label>
          <Input
            id="description"
            type="text"
            placeholder="e.g. Uber Eats, Checkers groceries"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-14 bg-white border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 px-4 text-[15px] font-medium"
            required
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-muted-foreground font-semibold uppercase text-xs tracking-wider">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category" className="h-14 bg-white border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus:ring-2 focus:ring-primary/20 px-4 font-medium text-[15px]">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent className="rounded-[1rem] shadow-xl border-border/50">
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="py-2.5">
                  <span className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
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
            className="h-14 bg-white border-none shadow-[0_2px_10px_rgb(0,0,0,0.03)] rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary/20 px-4 text-[15px] font-medium"
          />
        </div>

        {/* Invoicable Toggle */}
        <label
          htmlFor="is_invoicable"
          className="flex items-center justify-between p-4 mt-2 rounded-[1.25rem] border border-border/50 bg-white shadow-sm cursor-pointer select-none"
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

        <Button
          type="submit"
          className="w-full h-14 rounded-full text-base font-bold shadow-lg shadow-primary/25 hover:shadow-xl transition-all gradient-primary mt-2"
          disabled={isPending}
        >
          {isPending ? (
             <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <PlusCircle className="mr-2 h-5 w-5" />
              Log Expense
            </>
          )}
        </Button>
      </form>

      <BottomNav />
    </PageTransition>
  );
}
