"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "@/backend/lib/types/database.types";

export function SpendingCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    // Group by category using the joined `categories` object on each transaction
    const totals: Record<string, { name: string; color: string; value: number }> = {};

    transactions.forEach((t) => {
      const id = t.category_id;
      if (!id) return;
      const name = t.categories?.name ?? "Unknown";
      const color = t.categories?.color ?? "#cbd5e1";
      if (!totals[id]) {
        totals[id] = { name, color, value: 0 };
      }
      totals[id].value += t.amount;
    });

    return Object.values(totals)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions]);

  const totalAmount = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { name, value, color } = payload[0].payload;
      return (
        <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-border/50 text-center">
          <p className="text-xs font-semibold text-muted-foreground mb-1">{name}</p>
          <p className="text-sm font-bold text-foreground" style={{ color: color }}>
            R {value.toLocaleString("en-ZA")}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-row items-center gap-4">
      {/* Legend */}
      <div className="flex-1 space-y-2.5 min-w-0">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[13px] font-semibold text-muted-foreground truncate">{entry.name}</span>
          </div>
        ))}
      </div>

      {/* Donut Chart */}
      <div className="relative w-[140px] h-[140px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
            Total
          </span>
          <span className="text-[15px] font-bold text-foreground leading-none">
            R {totalAmount.toLocaleString("en-ZA")}
          </span>
        </div>
      </div>
    </div>
  );
}
