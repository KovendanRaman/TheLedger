"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Transaction } from "@/backend/lib/types/database.types";
import { format, subDays, parseISO } from "date-fns";

export function MoneyFlowChart({ transactions }: { transactions: Transaction[] }) {
  const data = useMemo(() => {
    // Find the most recent transaction date; fall back to today if no transactions
    const mostRecentDate =
      transactions.length > 0
        ? transactions.reduce((latest, t) => {
            const d = (t.date || t.created_at).split("T")[0];
            return d > latest ? d : latest;
          }, "0000-00-00")
        : format(new Date(), "yyyy-MM-dd");

    const anchor = parseISO(mostRecentDate);

    // Generate 7 days ending on the most recent transaction date
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(anchor, 6 - i);
      return {
        dateStr: format(d, "yyyy-MM-dd"),
        displayLabel: format(d, "MMM d"),
        personal: 0,
        invoicable: 0,
      };
    });

    transactions.forEach((t) => {
      const txnDateStr = (t.date || t.created_at).split("T")[0];
      const dayBucket = days.find((d) => d.dateStr === txnDateStr);
      if (dayBucket) {
        if (t.is_invoicable) {
          dayBucket.invoicable += t.amount;
        } else {
          dayBucket.personal += t.amount;
        }
      }
    });

    return days;
  }, [transactions]);

  // Custom styled tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1a1a2e] px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-border/40 dark:border-white/10">
          <p className="text-sm font-semibold text-muted-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-foreground flex-1 pr-6">{entry.name}</span>
              <span className="text-sm font-bold text-foreground font-mono">
                R{entry.value.toLocaleString("en-ZA")}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLegend = (props: any) => {
    const { payload } = props;
    return (
      <div className="flex justify-center gap-6 mt-2">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-semibold text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[280px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="displayLabel" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94A3B8", fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `R${value}`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F8FAFC" }} />
          <Legend content={renderLegend} verticalAlign="top" align="center" wrapperStyle={{ top: -40 }} />
          
          {/* Main primary "Personal" spend */}
          <Bar 
            dataKey="personal" 
            name="Personal Spend" 
            fill="#8B5CF6" 
            radius={[4, 4, 4, 4]} 
            barSize={12} 
          />
          {/* Lighter secondary "Invoicable" spend */}
          <Bar 
            dataKey="invoicable" 
            name="Billable (Parent)" 
            fill="#C4B5FD" 
            radius={[4, 4, 4, 4]} 
            barSize={12} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
