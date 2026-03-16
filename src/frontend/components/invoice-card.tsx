import { formatCurrency } from "@/backend/lib/utils";
import type { Invoice } from "@/backend/lib/types/database.types";
import { FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/backend/lib/utils";

interface InvoiceCardProps {
  invoice: Invoice;
  transactionCount?: number;
  onMarkPaid?: () => void;
}

export function InvoiceCard({
  invoice,
  transactionCount,
  onMarkPaid,
}: InvoiceCardProps) {
  const isPaid = invoice.status === "paid";
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

      {!isPaid && onMarkPaid && (
        <button
          onClick={onMarkPaid}
          className="mt-3 w-full py-2.5 rounded-xl gradient-accent text-sm font-semibold text-white glow-accent hover:opacity-90 transition-opacity active:scale-[0.98]"
        >
          ✓ Payment Received
        </button>
      )}
    </div>
  );
}
