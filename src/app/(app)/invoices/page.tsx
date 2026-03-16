"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { generateInvoice, markInvoicePaid } from "@/backend/actions/transactions";
import { getInvoicesData } from "@/backend/actions/data";
import { InvoiceCard } from "@/frontend/components/invoice-card";
import { BottomNav } from "@/frontend/components/bottom-nav";
import { PageTransition } from "@/frontend/components/page-transition";
import {
  IS_MOCK_MODE,
  MOCK_INVOICES,
  MOCK_TRANSACTIONS,
  getMockTxnCountByInvoice,
} from "@/backend/lib/mock-data";
import type { Invoice, InvoiceStatus, TransactionStatus } from "@/backend/lib/types/database.types";
import { Button } from "@/frontend/components/ui/button";
import { Loader2, Sparkles, FileText } from "lucide-react";

type InvoiceRow = {
  id: string;
  user_id: string;
  month_label: string;
  total_amount: number;
  status: InvoiceStatus;
  generated_at: string;
};

type TxnMini = {
  id: string;
  invoice_id: string | null;
  is_invoicable: boolean;
  status: TransactionStatus;
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [txnCounts, setTxnCounts] = useState<Record<string, number>>({});
  const [hasPendingInvoicable, setHasPendingInvoicable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    setLoading(true);
    if (IS_MOCK_MODE) {
      const mockTxns = MOCK_TRANSACTIONS as TxnMini[];
      const pending = mockTxns.filter((t) => t.is_invoicable && t.status === "pending");
      setHasPendingInvoicable(pending.length > 0);
      setTxnCounts(getMockTxnCountByInvoice());
      setInvoices(MOCK_INVOICES);
      setLoading(false);
      return;
    }

    const data = await getInvoicesData();
    setInvoices(data.invoices);
    setTxnCounts(data.txnCounts);
    setHasPendingInvoicable(data.hasPendingInvoicable);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  function handleGenerate() {
    if (IS_MOCK_MODE) {
      toast.success("[Mock] Statement generated! In real mode this would invoice transactions. 📄");
      return;
    }
    startTransition(async () => {
      try {
        await generateInvoice();
        toast.success("Statement generated! Share the link with your parents. 📄");
        await loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Could not generate invoice.");
      }
    });
  }

  function handleMarkPaid(invoiceId: string) {
    if (IS_MOCK_MODE) {
      toast.success("[Mock] Payment recorded! ✅");
      return;
    }
    startTransition(async () => {
      try {
        await markInvoicePaid(invoiceId);
        toast.success("Payment recorded! All done. ✅");
        await loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Could not mark as paid.");
      }
    });
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-[28px] font-bold text-foreground tracking-tight">Invoices</h1>
        <p className="text-sm font-medium text-muted-foreground mt-1">
          Generate & track parent statements
        </p>
      </div>

      {/* Generate CTA */}
      <div className="px-5 mb-8">
        <div className="p-5 rounded-[1.5rem] border border-border/50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">
                Generate Statement
              </p>
              <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                {hasPendingInvoicable
                  ? "You have unprocessed billable items"
                  : "No pending billable items"}
              </p>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={!hasPendingInvoicable || isPending}
            className="w-full h-12 rounded-xl font-bold tracking-wide"
            variant={hasPendingInvoicable ? "default" : "secondary"}
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Generate New Statement"
            )}
          </Button>
        </div>
      </div>

      {/* Invoice List */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-bold text-foreground tracking-tight">
            Statement History
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-[1.5rem] border border-border/50 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground font-semibold">No statements yet</p>
            <p className="text-muted-foreground text-[13px] mt-1 px-4">
              Add invoicable expenses and generate your first statement
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                transactionCount={txnCounts[inv.id]}
                onMarkPaid={
                  inv.status === "open"
                    ? () => handleMarkPaid(inv.id)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </PageTransition>
  );
}
