"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { markInvoicePaid } from "@/backend/actions/transactions";
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
import { Loader2, FileText, Plus } from "lucide-react";

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

  const handleMarkPaid = useCallback(function handleMarkPaid(invoiceId: string) {
    if (IS_MOCK_MODE) {
      toast.success("[Mock] Payment recorded!");
      return;
    }
    startTransition(async () => {
      try {
        await markInvoicePaid(invoiceId);
        toast.success("Payment recorded!");
        await loadData();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Could not mark as paid.");
      }
    });
  }, [startTransition]);

  return (
    <PageTransition className="min-h-screen bg-[#F4F5FB] pb-32">
      {/* Header */}
      <div className="flex items-end justify-between px-5 pt-14 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-foreground tracking-tight">Statements</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Create &amp; track parent invoices
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
          style={{ backgroundColor: "#6366f1" }}
        >
          <Plus className="w-4 h-4" />
          New Statement
        </Link>
      </div>

      {/* Pending CTA if there are billable items */}
      {!loading && hasPendingInvoicable && (
        <div className="px-5 mb-6">
          <Link
            href="/invoices/new"
            className="block p-5 rounded-[1.5rem] border border-dashed border-primary/30 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-foreground">
                  Create New Statement
                </p>
                <p className="text-[13px] font-medium text-muted-foreground mt-0.5">
                  You have pending billable transactions ready to invoice
                </p>
              </div>
            </div>
          </Link>
        </div>
      )}

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
              Add billable expenses and create your first statement
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

      <BottomNav className="lg:hidden" />
    </PageTransition>
  );
}
