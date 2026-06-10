"use client";

import { memo, useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/backend/lib/utils";
import { StatusBadge } from "@/frontend/components/status-badge";
import { CategoryBadge } from "@/frontend/components/category-badge";
import { CategoryIcon } from "@/frontend/components/category-icon";
import type { Transaction } from "@/backend/lib/types/database.types";
import { Receipt, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

const SWIPE_THRESHOLD = -60;

export const TransactionCard = memo(function TransactionCard({
  transaction,
  onDelete,
}: TransactionCardProps) {
  const category = transaction.categories;
  const x = useMotionValue(0);
  const actionOpacity = useTransform(x, [0, -20], [0, 1], { clamp: true });
  const [swiped, setSwiped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const actionWidth = onDelete ? -128 : -64;

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < SWIPE_THRESHOLD || info.velocity.x < -300) {
      setSwiped(true);
    } else {
      setSwiped(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] bg-white dark:bg-[#1a1a2e]">
      {/* Actions — opacity driven by x motion value, invisible at rest */}
      {isMobile && (
        <motion.div
          style={{ opacity: actionOpacity }}
          className="absolute inset-y-0 right-0 flex items-stretch z-0"
        >
          <Link
            href={`/expenses/${transaction.id}/edit`}
            className="flex items-center justify-center w-16 bg-primary text-white transition-[filter,transform] duration-150 active:brightness-90 active:scale-[0.97]"
          >
            <Pencil className="h-5 w-5" />
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(transaction.id)}
              className="flex items-center justify-center w-16 bg-red-500 text-white transition-[filter,transform] duration-150 active:brightness-90 active:scale-[0.97]"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </motion.div>
      )}

      {/* Swipeable card surface */}
      <motion.div
        drag={isMobile ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: actionWidth, right: 0 }}
        dragElastic={0.08}
        onDragEnd={handleDragEnd}
        animate={{ x: swiped ? actionWidth : 0 }}
        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        style={{ x }}
        onTap={() => swiped && setSwiped(false)}
        className="relative z-10 flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a2e] border border-white dark:border-[#1a1a2e] shadow-sm hover:shadow-md transition-shadow group touch-pan-y md:border-border/40 md:dark:border-white/10"
      >
        {/* Category icon */}
        <CategoryIcon name={category?.name} color={category?.color} size="lg" />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-foreground truncate pl-1">
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap pl-1">
            {category && (
              <CategoryBadge
                name={category.name}
                color={category.color}
                size="sm"
                className="shadow-none"
              />
            )}
            <StatusBadge status={transaction.status} isInvoicable={transaction.is_invoicable} />
            {transaction.is_invoicable && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <Receipt className="h-3.5 w-3.5" />
                Billable
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[15px] font-bold font-mono text-foreground whitespace-nowrap">
            {formatCurrency(transaction.amount)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {formatDate(transaction.date)}
          </span>
          <Link
            href={`/expenses/${transaction.id}/edit`}
            className="mt-0.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border border-border/60 dark:border-white/10 text-muted-foreground bg-white dark:bg-[#1a1a2e] shadow-sm hover:border-primary hover:text-primary hover:shadow-primary/20 hover:shadow-md transition-[color,border-color,box-shadow] duration-150"
            title="Edit transaction"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
        </div>
      </motion.div>
    </div>
  );
});
