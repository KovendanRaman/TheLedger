import { memo } from "react";
import { formatCurrency, formatDate } from "@/backend/lib/utils";
import { StatusBadge } from "@/frontend/components/status-badge";
import { CategoryBadge } from "@/frontend/components/category-badge";
import type { Transaction } from "@/backend/lib/types/database.types";
import { Receipt } from "lucide-react";

interface TransactionCardProps {
  transaction: Transaction;
}

export const TransactionCard = memo(function TransactionCard({ transaction }: TransactionCardProps) {
  const category = transaction.categories;

  return (
    <div className="flex items-center gap-4 p-4 rounded-[1.25rem] bg-white border border-border/40 shadow-sm hover:shadow-md transition-all group">
      {/* Category icon */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-[1rem] flex items-center justify-center"
        style={{
          backgroundColor: category?.color
            ? `${category.color}15`
            : "#6366f115",
        }}
      >
        <div
          className="w-3.5 h-3.5 rounded-full"
          style={{ backgroundColor: category?.color ?? "#6366f1" }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground truncate pl-1">
          {transaction.description}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap pl-1">
          {category && (
            <CategoryBadge name={category.name} color={category.color} />
          )}
          <StatusBadge status={transaction.status} />
          {transaction.is_invoicable && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
              <Receipt className="h-3.5 w-3.5" />
              Billable
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <span className="text-[15px] font-bold font-mono text-foreground whitespace-nowrap">
          {formatCurrency(transaction.amount)}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
           {formatDate(transaction.date)}
        </span>
      </div>
    </div>
  );
});
