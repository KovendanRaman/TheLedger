"use client";

import dynamic from "next/dynamic";
import type { Transaction } from "@/backend/lib/types/database.types";

const MoneyFlowChart = dynamic(
  () => import("@/frontend/components/money-flow-chart").then((m) => m.MoneyFlowChart),
  { ssr: false, loading: () => <div className="h-[280px] w-full mt-4 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" /> }
);

const SpendingCategoryChart = dynamic(
  () => import("@/frontend/components/budget-donut-chart").then((m) => m.SpendingCategoryChart),
  { ssr: false, loading: () => <div className="h-[220px] w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" /> }
);

export function LazyMoneyFlowChart({ transactions }: { transactions: Transaction[] }) {
  return <MoneyFlowChart transactions={transactions} />;
}

export function LazySpendingCategoryChart({ transactions }: { transactions: Transaction[] }) {
  return <SpendingCategoryChart transactions={transactions} />;
}
