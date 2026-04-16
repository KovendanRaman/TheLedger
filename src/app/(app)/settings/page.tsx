"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { getUserProfile, getParentalLinksForUser } from "@/backend/actions/data";
import { updateSharingEnabled } from "@/backend/actions/auth";
import {
  updateAppMode,
  updateAllowanceResetDay,
  getIncomes,
  addIncome,
  updateIncome,
  deleteIncome,
  getRecurringExpenses,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  toggleRecurringExpense,
} from "@/backend/actions/allowance";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { Switch } from "@/frontend/components/ui/switch";
import { Label } from "@/frontend/components/ui/label";
import { PageTransition } from "@/frontend/components/page-transition";
import type { UserProfile, ParentalLink, Income, RecurringExpense, AppMode } from "@/backend/lib/types/database.types";
import { IS_MOCK_MODE, MOCK_PROFILE, MOCK_PARENTAL_LINKS } from "@/backend/lib/mock-data";
import {
  createParentalLink,
  deleteParentalLink,
  getParentalLinks,
  updateParentalLinkLabel,
} from "@/backend/actions/parental-links";
import {
  Share2, Copy, ExternalLink, Loader2, Shield, LogOut,
  BookOpen, Plus, Trash2, Check, Pencil, X, Link2,
  Sun, Moon, Layers, TrendingUp, AlertTriangle,
  CalendarDays, RefreshCw, DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/backend/lib/utils";
import { useTheme } from "@/frontend/components/theme-provider";
import { formatCurrency } from "@/backend/lib/utils";

// ─── Confirmation Modal ───────────────────────────────────────
function ConfirmModeModal({
  open,
  targetMode,
  onConfirm,
  onCancel,
  pending,
}: {
  open: boolean;
  targetMode: AppMode;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-[#1a1a2e] rounded-[1.5rem] border border-border/50 dark:border-white/10 shadow-2xl p-6 max-w-sm w-full z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-[16px] font-bold text-foreground">Switch to {targetMode === "ALLOWANCE" ? "Allowance" : "Invoice"} Mode?</p>
        </div>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
          {targetMode === "ALLOWANCE"
            ? "Your dashboard will switch to a personal budget view. Invoice features will be hidden. Your existing invoices and transactions are not affected."
            : "Your dashboard will switch back to the invoice tracking view. Your income sources and budget data are preserved."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={pending}
            className="flex-1 h-11 rounded-xl gradient-primary text-white text-[13px] font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
          </button>
          <button
            onClick={onCancel}
            className="px-5 h-11 rounded-xl bg-muted/40 dark:bg-white/10 text-[13px] font-semibold text-muted-foreground hover:bg-muted/60 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Income Item Card ─────────────────────────────────────────
function IncomeCard({
  income,
  onDelete,
  onUpdated,
}: {
  income: Income;
  onDelete: (id: string) => void;
  onUpdated: (updated: Income) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(income.source);
  const [amount, setAmount] = useState(String(income.amount));
  const [isRecurring, setIsRecurring] = useState(income.is_recurring);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("source", source);
      fd.append("amount", amount);
      fd.append("is_recurring", String(isRecurring));
      fd.append("date", income.date);
      const { error } = await updateIncome(income.id, fd);
      if (error) { toast.error(error); return; }
      onUpdated({ ...income, source, amount: parseFloat(amount), is_recurring: isRecurring });
      setEditing(false);
      toast.success("Income updated.");
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteIncome(income.id);
      if (error) { toast.error(error); return; }
      onDelete(income.id);
      toast.success("Income removed.");
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-secondary/20 dark:bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 dark:border-white/10 bg-white dark:bg-[#1a1a2e]">
        <DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />
        {editing ? (
          <>
            <input
              autoFocus
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="flex-1 text-[14px] font-semibold bg-transparent border-b border-primary outline-none py-0.5"
              placeholder="Income source"
              maxLength={60}
            />
            <button onClick={handleSave} disabled={isPending} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button onClick={() => { setEditing(false); setSource(income.source); setAmount(String(income.amount)); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-[14px] font-semibold text-foreground truncate">{income.source}</span>
            <span className="text-[13px] font-bold font-mono text-foreground mr-2">{formatCurrency(income.amount)}</span>
            {income.is_recurring && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Recurring</span>}
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-destructive">Remove?</span>
                <button onClick={handleDelete} disabled={isPending} className="px-2.5 py-1 rounded-lg bg-destructive text-white text-[12px] font-bold">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1 rounded-lg bg-muted text-[12px] font-bold">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </>
        )}
      </div>
      {editing && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 pl-7 pr-3 rounded-xl border border-border/50 bg-white dark:bg-[#0f0f14] text-[14px] font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Amount"
              />
            </div>
            <label className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border/50 bg-white dark:bg-[#0f0f14] cursor-pointer select-none">
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
              <span className="text-[12px] font-semibold text-muted-foreground">Recurring</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Income Form ──────────────────────────────────────────
function AddIncomeForm({ onAdd, onCancel }: { onAdd: (i: Income) => void; onCancel: () => void }) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!source.trim() || !amount) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("source", source.trim());
      fd.append("amount", amount);
      fd.append("is_recurring", String(isRecurring));
      fd.append("date", date);
      const { error } = await addIncome(fd);
      if (error) { toast.error(error); return; }
      const incomes = await getIncomes();
      const newest = incomes[0];
      if (newest) onAdd(newest);
      toast.success("Income source added!");
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-[13px] font-semibold text-foreground">New income source</p>
      <input
        autoFocus
        value={source}
        onChange={(e) => setSource(e.target.value)}
        placeholder="e.g. Allowance, Part-time job…"
        maxLength={60}
        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[14px] font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 pl-7 pr-3 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            placeholder="0.00"
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-11 px-3 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[13px] font-medium outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
        />
      </div>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
        <span className="text-[13px] font-medium text-muted-foreground">Recurring (monthly)</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={isPending || !source.trim() || !amount}
          className="flex-1 h-10 rounded-xl gradient-primary text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Income
        </button>
        <button onClick={onCancel} className="px-4 h-10 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Debit Order Card ─────────────────────────────────────────
function DebitOrderCard({
  item,
  onDelete,
  onUpdated,
}: {
  item: RecurringExpense;
  onDelete: (id: string) => void;
  onUpdated: (updated: RecurringExpense) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [amount, setAmount] = useState(String(item.amount));
  const [billingDate, setBillingDate] = useState(String(item.billing_date));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("amount", amount);
      fd.append("billing_date", billingDate);
      fd.append("is_active", String(item.is_active));
      const { error } = await updateRecurringExpense(item.id, fd);
      if (error) { toast.error(error); return; }
      onUpdated({ ...item, name, amount: parseFloat(amount), billing_date: parseInt(billingDate) });
      setEditing(false);
      toast.success("Debit order updated.");
    });
  }

  function handleToggle(active: boolean) {
    startTransition(async () => {
      const { error } = await toggleRecurringExpense(item.id, active);
      if (error) { toast.error(error); return; }
      onUpdated({ ...item, is_active: active });
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const { error } = await deleteRecurringExpense(item.id);
      if (error) { toast.error(error); return; }
      onDelete(item.id);
      toast.success("Debit order removed.");
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-secondary/20 dark:bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-[#1a1a2e]">
        <RefreshCw className="h-4 w-4 text-violet-500 flex-shrink-0" />
        {editing ? (
          <>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-[14px] font-semibold bg-transparent border-b border-primary outline-none py-0.5"
              placeholder="Debit order name"
              maxLength={60}
            />
            <button onClick={handleSave} disabled={isPending} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button onClick={() => { setEditing(false); setName(item.name); setAmount(String(item.amount)); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <span className="flex-1 text-[14px] font-semibold text-foreground truncate">{item.name}</span>
            <span className="text-[13px] font-bold font-mono text-foreground mr-1">{formatCurrency(item.amount)}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 mr-1">Day {item.billing_date}</span>
            <Switch
              checked={item.is_active}
              onCheckedChange={handleToggle}
              disabled={isPending}
            />
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-destructive">Remove?</span>
                <button onClick={handleDelete} disabled={isPending} className="px-2.5 py-1 rounded-lg bg-destructive text-white text-[12px] font-bold">
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1 rounded-lg bg-muted text-[12px] font-bold">No</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </>
        )}
      </div>
      {editing && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 pl-7 pr-3 rounded-xl border border-border/50 bg-white dark:bg-[#0f0f14] text-[14px] font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Amount"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-semibold">Day</span>
              <input
                type="number"
                min={1}
                max={28}
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
                className="w-24 h-10 pl-10 pr-3 rounded-xl border border-border/50 bg-white dark:bg-[#0f0f14] text-[14px] font-semibold outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Debit Order Form ─────────────────────────────────────
function AddDebitForm({ onAdd, onCancel }: { onAdd: (r: RecurringExpense) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingDate, setBillingDate] = useState("1");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!name.trim() || !amount) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("amount", amount);
      fd.append("billing_date", billingDate);
      fd.append("is_active", "true");
      const { error } = await addRecurringExpense(fd);
      if (error) { toast.error(error); return; }
      const debits = await getRecurringExpenses();
      const newest = debits[debits.length - 1];
      if (newest) onAdd(newest);
      toast.success("Debit order added!");
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-[13px] font-semibold text-foreground">New debit order</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Netflix, Gym, Insurance…"
        maxLength={60}
        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[14px] font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full h-11 pl-7 pr-3 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            placeholder="0.00"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px] font-semibold">Day</span>
          <input
            type="number"
            min={1}
            max={28}
            value={billingDate}
            onChange={(e) => setBillingDate(e.target.value)}
            className="w-24 h-11 pl-10 pr-3 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[14px] font-semibold outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={isPending || !name.trim() || !amount}
          className="flex-1 h-10 rounded-xl gradient-primary text-white text-[13px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add Debit Order
        </button>
        <button onClick={onCancel} className="px-4 h-10 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Parental Link Card ───────────────────────────────────────
function ParentalLinkCard({
  link,
  onDelete,
  onLabelSaved,
  sharingEnabled,
}: {
  link: ParentalLink;
  onDelete: (id: string) => void;
  onLabelSaved: (id: string, label: string) => void;
  sharingEnabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [labelInput, setLabelInput] = useState(link.label);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/view/${link.key}`
      : `/view/${link.key}`;

  function handleCopy() {
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
  }

  function handleSaveLabel() {
    if (!labelInput.trim()) return;
    startTransition(async () => {
      if (IS_MOCK_MODE) {
        onLabelSaved(link.id, labelInput.trim());
        setEditing(false);
        toast.success("[Mock] Label updated.");
        return;
      }
      const { error } = await updateParentalLinkLabel(link.id, labelInput.trim());
      if (error) {
        toast.error(error);
      } else {
        onLabelSaved(link.id, labelInput.trim());
        setEditing(false);
        toast.success("Label updated.");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      if (IS_MOCK_MODE) {
        onDelete(link.id);
        toast.success("[Mock] Link removed.");
        return;
      }
      const { error } = await deleteParentalLink(link.id);
      if (error) {
        toast.error(error);
      } else {
        onDelete(link.id);
        toast.success("Share link removed.");
      }
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-border/50 dark:border-white/10 bg-secondary/20 dark:bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 dark:border-white/10 bg-white dark:bg-[#1a1a2e]">
        {editing ? (
          <>
            <input
              autoFocus
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveLabel()}
              maxLength={40}
              className="flex-1 text-[14px] font-semibold bg-transparent border-b border-primary outline-none py-0.5"
              placeholder="e.g. Mom, Dad, Guardian"
            />
            <button
              onClick={handleSaveLabel}
              disabled={isPending || !labelInput.trim()}
              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button
              onClick={() => { setEditing(false); setLabelInput(link.label); }}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="flex-1 text-[14px] font-semibold text-foreground">{link.label}</span>
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors"
              title="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-destructive">Remove?</span>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-2.5 py-1 rounded-lg bg-destructive text-white text-[12px] font-bold hover:bg-destructive/90 transition-colors disabled:opacity-40"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 rounded-lg bg-muted text-[12px] font-bold hover:bg-muted/70 transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Remove link"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        <p className="text-[12px] font-mono text-muted-foreground truncate">{url}</p>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={!sharingEnabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold border transition-all",
              sharingEnabled
                ? "bg-white dark:bg-[#1a1a2e] border-border/60 dark:border-white/10 hover:bg-secondary/40 dark:hover:bg-white/10 text-foreground shadow-sm"
                : "bg-muted/30 dark:bg-white/10 border-border/30 text-muted-foreground cursor-not-allowed"
            )}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button
            onClick={() => window.open(url, "_blank")}
            disabled={!sharingEnabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-[13px] font-semibold border transition-all",
              sharingEnabled
                ? "bg-white dark:bg-[#1a1a2e] border-border/60 dark:border-white/10 hover:bg-secondary/40 dark:hover:bg-white/10 text-primary shadow-sm"
                : "bg-muted/30 dark:bg-white/10 border-border/30 text-muted-foreground cursor-not-allowed"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Link Form ────────────────────────────────────────────
function AddLinkForm({
  onAdd,
  onCancel,
}: {
  onAdd: (link: ParentalLink) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!label.trim()) return;
    startTransition(async () => {
      if (IS_MOCK_MODE) {
        const mockLink: ParentalLink = {
          id: `plink-mock-${Date.now()}`,
          user_id: "mock-user-001",
          key: crypto.randomUUID(),
          label: label.trim(),
          created_at: new Date().toISOString(),
        };
        onAdd(mockLink);
        toast.success("[Mock] Share link created.");
        return;
      }
      const { link, error } = await createParentalLink(label.trim());
      if (error || !link) {
        toast.error(error ?? "Could not create link.");
      } else {
        onAdd(link);
        toast.success("Share link created!");
      }
    });
  }

  return (
    <div className="rounded-[1.25rem] border border-primary/30 bg-primary/5 p-4 space-y-3">
      <p className="text-[13px] font-semibold text-foreground">New share link</p>
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        maxLength={40}
        placeholder="Label, e.g. Mom, Dad, Guardian…"
        className="w-full h-11 px-4 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[14px] font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={isPending || !label.trim()}
          className="flex-1 h-10 rounded-xl gradient-primary text-white text-[13px] font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Create link
        </button>
        <button
          onClick={onCancel}
          className="px-4 h-10 rounded-xl bg-white dark:bg-[#1a1a2e] border border-border/60 dark:border-white/10 text-[13px] font-semibold text-muted-foreground hover:bg-muted/40 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<ParentalLink[]>([]);
  const [incomeList, setIncomeList] = useState<Income[]>([]);
  const [debitList, setDebitList] = useState<RecurringExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingPending, startSharingTransition] = useTransition();
  const [modePending, startModeTransition] = useTransition();
  const [resetDayPending, startResetDayTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddDebit, setShowAddDebit] = useState(false);
  const [pendingMode, setPendingMode] = useState<AppMode | null>(null);
  const [resetDayInput, setResetDayInput] = useState("1");

  useEffect(() => {
    async function load() {
      setLoading(true);
      if (IS_MOCK_MODE) {
        setProfile({ id: MOCK_PROFILE.id, email: MOCK_PROFILE.email, full_name: MOCK_PROFILE.full_name, is_sharing_enabled: MOCK_PROFILE.is_sharing_enabled, theme: MOCK_PROFILE.theme, appMode: "INVOICE", allowanceResetDay: 1 });
        setLinks(MOCK_PARENTAL_LINKS);
        setLoading(false);
        return;
      }
      const [profileData, linksData, incomesData, debitsData] = await Promise.all([
        getUserProfile(),
        getParentalLinksForUser(),
        getIncomes(),
        getRecurringExpenses(),
      ]);
      setProfile(profileData);
      setLinks(linksData);
      setIncomeList(incomesData);
      setDebitList(debitsData);
      if (profileData?.allowanceResetDay) setResetDayInput(String(profileData.allowanceResetDay));
      setLoading(false);
    }
    load();
  }, []);

  function toggleSharing(enabled: boolean) {
    if (!profile) return;
    if (IS_MOCK_MODE) {
      setProfile((p) => p ? { ...p, is_sharing_enabled: enabled } : p);
      toast.success(enabled ? "[Mock] Sharing enabled." : "[Mock] Sharing disabled.");
      return;
    }
    startSharingTransition(async () => {
      const { error } = await updateSharingEnabled(profile.id, enabled);
      if (error) {
        toast.error(error);
      } else {
        setProfile((p) => p ? { ...p, is_sharing_enabled: enabled } : p);
        toast.success(enabled ? "Parental sharing enabled." : "Parental sharing disabled.");
      }
    });
  }

  function handleModeSwitch(mode: AppMode) {
    if (profile?.appMode === mode) return;
    setPendingMode(mode);
  }

  function confirmModeSwitch() {
    if (!pendingMode) return;
    startModeTransition(async () => {
      const { error } = await updateAppMode(pendingMode);
      if (error) {
        toast.error(error);
      } else {
        setProfile((p) => p ? { ...p, appMode: pendingMode } : p);
        toast.success(`Switched to ${pendingMode === "ALLOWANCE" ? "Allowance" : "Invoice"} Mode.`);
        router.refresh();
      }
      setPendingMode(null);
    });
  }

  function saveResetDay() {
    const day = parseInt(resetDayInput, 10);
    if (isNaN(day) || day < 1 || day > 28) {
      toast.error("Reset day must be between 1 and 28.");
      return;
    }
    startResetDayTransition(async () => {
      const { error } = await updateAllowanceResetDay(day);
      if (error) {
        toast.error(error);
      } else {
        setProfile((p) => p ? { ...p, allowanceResetDay: day } : p);
        toast.success("Reset day saved.");
      }
    });
  }

  async function handleSignOut() {
    if (IS_MOCK_MODE) {
      toast.info("[Mock] Sign out — connect a real DB to enable auth.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  const sharingEnabled = profile?.is_sharing_enabled ?? false;
  const appMode = profile?.appMode ?? "INVOICE";

  return (
    <PageTransition className="min-h-screen bg-background pb-32">
      {/* Confirmation Modal */}
      <ConfirmModeModal
        open={!!pendingMode}
        targetMode={pendingMode ?? "ALLOWANCE"}
        onConfirm={confirmModeSwitch}
        onCancel={() => setPendingMode(null)}
        pending={modePending}
      />

      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-white dark:bg-[#1a1a2e] shadow-sm border border-border/50 dark:border-white/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-[28px] font-bold text-foreground">Settings</h1>
        </div>
        {profile && (
          <p className="text-[15px] font-medium text-muted-foreground pl-[3.5rem]">
            {profile.full_name ?? profile.email}
          </p>
        )}
      </div>

      <div className="px-5 space-y-6">

        {/* ── App Mode Card ── */}
        <div className="rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">App Mode</p>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                Switch between Invoice and Allowance tracking
              </p>
            </div>
          </div>

          {/* Mode toggle buttons */}
          <div className="flex gap-3">
            <button
              id="mode-invoice"
              onClick={() => handleModeSwitch("INVOICE")}
              disabled={loading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border transition-all",
                appMode === "INVOICE"
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-white/5 border-border/60 dark:border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              <TrendingUp className="h-4 w-4" />
              Invoice Mode
            </button>
            <button
              id="mode-allowance"
              onClick={() => handleModeSwitch("ALLOWANCE")}
              disabled={loading}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border transition-all",
                appMode === "ALLOWANCE"
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-white/5 border-border/60 dark:border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Allowance Mode
            </button>
          </div>

          {/* Allowance settings (only shown in allowance mode) */}
          {!loading && appMode === "ALLOWANCE" && (
            <div className="space-y-5 border-t border-border/40 pt-5">

              {/* Reset Day */}
              <div>
                <p className="text-[13px] font-bold text-foreground mb-1">Billing Cycle Reset Day</p>
                <p className="text-[12px] text-muted-foreground mb-3">The day of the month your budget cycle starts (1–28).</p>
                <div className="flex gap-2">
                  <input
                    id="reset-day"
                    type="number"
                    min={1}
                    max={28}
                    value={resetDayInput}
                    onChange={(e) => setResetDayInput(e.target.value)}
                    className="w-28 h-11 px-4 rounded-xl bg-background border border-border/60 dark:border-white/10 text-[15px] font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    onClick={saveResetDay}
                    disabled={resetDayPending}
                    className="flex items-center gap-2 h-11 px-5 rounded-xl gradient-primary text-white text-[13px] font-bold disabled:opacity-50"
                  >
                    {resetDayPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Save
                  </button>
                </div>
              </div>

              {/* Income Sources */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">Income Sources</p>
                    <p className="text-[12px] text-muted-foreground">Money flowing in this cycle</p>
                  </div>
                  {!showAddIncome && (
                    <button
                      onClick={() => setShowAddIncome(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-border/60 bg-white dark:bg-[#0f0f14] hover:border-primary/40 hover:text-primary transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {incomeList.map((inc) => (
                    <IncomeCard
                      key={inc.id}
                      income={inc}
                      onDelete={(id) => setIncomeList((prev) => prev.filter((i) => i.id !== id))}
                      onUpdated={(updated) => setIncomeList((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
                    />
                  ))}
                  {incomeList.length === 0 && !showAddIncome && (
                    <p className="text-[13px] text-muted-foreground text-center py-3">No income sources yet.</p>
                  )}
                  {showAddIncome && (
                    <AddIncomeForm
                      onAdd={(inc) => { setIncomeList((prev) => [inc, ...prev]); setShowAddIncome(false); }}
                      onCancel={() => setShowAddIncome(false)}
                    />
                  )}
                </div>
              </div>

              {/* Debit Orders */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[13px] font-bold text-foreground">Debit Orders</p>
                    <p className="text-[12px] text-muted-foreground">Fixed monthly obligations</p>
                  </div>
                  {!showAddDebit && (
                    <button
                      onClick={() => setShowAddDebit(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border border-border/60 bg-white dark:bg-[#0f0f14] hover:border-primary/40 hover:text-primary transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {debitList.map((d) => (
                    <DebitOrderCard
                      key={d.id}
                      item={d}
                      onDelete={(id) => setDebitList((prev) => prev.filter((r) => r.id !== id))}
                      onUpdated={(updated) => setDebitList((prev) => prev.map((r) => r.id === updated.id ? updated : r))}
                    />
                  ))}
                  {debitList.length === 0 && !showAddDebit && (
                    <p className="text-[13px] text-muted-foreground text-center py-3">No debit orders yet.</p>
                  )}
                  {showAddDebit && (
                    <AddDebitForm
                      onAdd={(d) => { setDebitList((prev) => [...prev, d].sort((a, b) => a.billing_date - b.billing_date)); setShowAddDebit(false); }}
                      onCancel={() => setShowAddDebit(false)}
                    />
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Parental Sharing Card ── */}
        <div className="rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Share2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Parental Share Links</p>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                Give each parent their own read-only link
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border/40">
            <Label htmlFor="sharing-toggle" className="text-[15px] font-medium text-foreground cursor-pointer">
              Enable sharing
            </Label>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <Switch
                id="sharing-toggle"
                checked={sharingEnabled}
                onCheckedChange={toggleSharing}
                disabled={sharingPending}
              />
            )}
          </div>

          {!loading && sharingEnabled && (
            <div className="space-y-3 pt-1">
              {links.length === 0 && !showAddForm && (
                <p className="text-[13px] text-muted-foreground text-center py-4">
                  No share links yet. Add one below.
                </p>
              )}

              {links.map((link) => (
                <ParentalLinkCard
                  key={link.id}
                  link={link}
                  sharingEnabled={sharingEnabled}
                  onDelete={(id) => setLinks((prev) => prev.filter((l) => l.id !== id))}
                  onLabelSaved={(id, label) =>
                    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, label } : l))
                  }
                />
              ))}

              {showAddForm ? (
                <AddLinkForm
                  onAdd={(newLink) => {
                    setLinks((prev) => [...prev, newLink]);
                    setShowAddForm(false);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              ) : (
                links.length < 10 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="w-full flex items-center justify-center gap-2 h-11 rounded-[1.25rem] border-2 border-dashed border-border/60 text-[13px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add another link
                  </button>
                )
              )}
            </div>
          )}

          {!loading && !sharingEnabled && (
            <p className="text-[13px] font-medium text-muted-foreground text-center pb-1">
              Enable sharing to manage links
            </p>
          )}
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-3 p-5 rounded-[1.25rem] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 shadow-sm">
          <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Parents can only see transactions marked as{" "}
            <strong className="text-foreground">Bill to Parent</strong> with an{" "}
            <strong className="text-foreground">Invoiced</strong> status. Personal expenses are never visible.
          </p>
        </div>

        {/* Theme Toggle */}
        <div className="rounded-[1.5rem] bg-white dark:bg-[#1a1a2e] border border-border/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              {theme === "dark" ? (
                <Moon className="h-6 w-6 text-primary" />
              ) : (
                <Sun className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">Appearance</p>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                {theme === "dark" ? "Dark mode is active" : "Light mode is active"}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => theme === "dark" && toggleTheme()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border transition-all",
                theme === "light"
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-white/5 border-border/60 dark:border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              onClick={() => theme === "light" && toggleTheme()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 h-12 rounded-xl text-sm font-semibold border transition-all",
                theme === "dark"
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                  : "bg-white dark:bg-white/5 border-border/60 dark:border-white/10 text-muted-foreground hover:border-primary/40 hover:text-primary"
              )}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full h-14 rounded-full text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-colors font-semibold tracking-wide flex items-center justify-center gap-2 bg-white dark:bg-[#1a1a2e] shadow-sm"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </PageTransition>
  );
}
