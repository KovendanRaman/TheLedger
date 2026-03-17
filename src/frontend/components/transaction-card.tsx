"use client";

import { memo, useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/backend/lib/utils";
import { StatusBadge } from "@/frontend/components/status-badge";
import { CategoryBadge } from "@/frontend/components/category-badge";
import type { Transaction } from "@/backend/lib/types/database.types";
import { Receipt, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion, useMotionValue, type PanInfo } from "framer-motion";

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
  const [swiped, setSwiped] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const actionWidth = onDelete ? -128 : -64;
  const showActions = dragging || swiped;

  function handleDragStart() {
    setDragging(true);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    setDragging(false);
    if (info.offset.x < SWIPE_THRESHOLD) {
      setSwiped(true);
    } else {
      setSwiped(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] bg-white dark:bg-[#1a1a2e]">
      {/* Actions revealed behind the card — only when actively swiping */}
      {isMobile && showActions && (
        <div className="absolute inset-y-0 right-0 flex items-stretch z-0">
          <Link
            href={`/expenses/${transaction.id}/edit`}
            className="flex items-center justify-center w-16 bg-primary text-white transition-colors hover:bg-primary/90"
          >
            <Pencil className="h-5 w-5" />
          </Link>
          {onDelete && (
            <button
              onClick={() => onDelete(transaction.id)}
              className="flex items-center justify-center w-16 bg-red-500 text-white transition-colors hover:bg-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Swipeable card surface */}
      <motion.div
        drag={isMobile ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: actionWidth, right: 0 }}
        dragElastic={0.15}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={{ x: swiped ? actionWidth : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 35 }}
        style={{ x }}
        onTap={() => swiped && setSwiped(false)}
        className="relative z-10 flex items-center gap-4 p-4 bg-white dark:bg-[#1a1a2e] border border-white dark:border-[#1a1a2e] shadow-sm hover:shadow-md transition-shadow group touch-pan-y md:border-border/40 md:dark:border-white/10"
      >
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
              <CategoryBadge
                name={category.name}
                color={category.color}
                size="sm"
                className="shadow-none"
              />
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

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-[15px] font-bold font-mono text-foreground whitespace-nowrap">
            {formatCurrency(transaction.amount)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {formatDate(transaction.date)}
          </span>
          {/* Desktop-only edit button */}
          <Link
            href={`/expenses/${transaction.id}/edit`}
            className="mt-0.5 hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border border-border/60 dark:border-white/10 text-muted-foreground bg-white dark:bg-[#1a1a2e] shadow-sm hover:border-primary hover:text-primary hover:shadow-primary/20 hover:shadow-md transition-all"
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
