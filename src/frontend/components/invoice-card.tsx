"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/backend/lib/utils";
import type { Invoice } from "@/backend/lib/types/database.types";
import { FileText, CheckCircle2, Undo2, AlertTriangle, Download } from "lucide-react";
import { cn } from "@/backend/lib/utils";

interface InvoiceCardProps {
  invoice: Invoice;
  transactionCount?: number;
  onMarkPaid?: () => void;
  onRevoke?: () => void;
}

export const InvoiceCard = memo(function InvoiceCard({
  invoice,
  transactionCount,
  onMarkPaid,
  onRevoke,
}: InvoiceCardProps) {
  const isPaid = invoice.status === "paid";
  const [confirmingRevoke, setConfirmingRevoke] = useState(false);

  function handleRevokeClick() {
    if (!confirmingRevoke) {
      setConfirmingRevoke(true);
      return;
    }
    setConfirmingRevoke(false);
    onRevoke?.();
  }

  return (
    <div
      className={cn(
        "rounded-2xl p-4 border transition-colors",
        isPaid ? "bg-card border-emerald-500/20" : "bg-card border-border"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2 rounded-xl",
              isPaid
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-blue-500/10 text-blue-400"
            )}
          >
            {isPaid ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {invoice.month_label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {transactionCount
                ? `${transactionCount} transaction${transactionCount !== 1 ? "s" : ""}`
                : "Invoice"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold font-mono text-foreground">
            {formatCurrency(invoice.total_amount)}
          </p>
          <span
            className={cn(
              "text-xs font-medium",
              isPaid ? "text-emerald-400" : "text-blue-400"
            )}
          >
            {isPaid ? "Settled" : "Awaiting payment"}
          </span>
        </div>
      </div>

      {/* Save as PDF — always visible */}
      <Link
        href={`/invoices/${invoice.id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 w-full py-2 rounded-xl border border-border bg-muted/30 text-sm font-semibold text-muted-foreground hover:bg-muted/60 transition-colors flex items-center justify-center gap-2"
      >
        <Download className="h-4 w-4" />
        Save as PDF
      </Link>

      {/* Action buttons for open invoices */}
      {!isPaid && (
        <div className="mt-3 flex flex-col gap-2">
          {onMarkPaid && (
            <button
              onClick={onMarkPaid}
              className="w-full py-2.5 rounded-xl gradient-accent text-sm font-semibold text-white glow-accent hover:opacity-90 transition-opacity active:scale-[0.98]"
            >
              ✓ Payment Received
            </button>
          )}

          {onRevoke && (
            confirmingRevoke ? (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                <p className="text-xs font-medium text-red-700 flex-1">
                  This will delete the statement and return all transactions to pending.
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfirmingRevoke(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRevokeClick}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleRevokeClick}
                className="w-full py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <Undo2 className="h-4 w-4" />
                Revoke Statement
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
});
