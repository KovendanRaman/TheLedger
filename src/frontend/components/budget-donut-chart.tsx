"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Transaction } from "@/backend/lib/types/database.types";
import { MOCK_CATEGORIES } from "@/backend/lib/mock-data";

export function SpendingCategoryChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    const totals: Record<string, number> = {};
    
    transactions.forEach((t) => {
      if (t.category_id) {
        totals[t.category_id] = (totals[t.category_id] || 0) + t.amount;
      }
    });

    return Object.entries(totals)
      .map(([id, amount]) => {
        const cat = MOCK_CATEGORIES.find((c) => c.id === id);
        return {
          name: cat?.name || "Unknown",
          value: amount,
          color: cat?.color || "#cbd5e1",
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categories
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
    <div className="flex flex-col xl:flex-row items-center justify-between gap-6 h-[220px]">
      {/* Legend on the Left */}
      <div className="flex-1 space-y-3 w-full max-w-[160px]">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-[13px] font-semibold text-muted-foreground truncate">{entry.name}</span>
          </div>
        ))}
      </div>

      {/* Donut Chart on the Right */}
      <div className="relative w-[150px] h-[150px] flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
            Total for month
          </span>
          <span className="text-lg font-bold text-foreground leading-none">
            R {totalAmount.toLocaleString("en-ZA")}
          </span>
        </div>
      </div>
    </div>
  );
}
