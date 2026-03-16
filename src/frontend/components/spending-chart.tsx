"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const data = [
  { month: "Jan", spend: 1200 },
  { month: "Feb", spend: 2800 },
  { month: "Mar", spend: 1900 },
  { month: "Apr", spend: 3200 },
  { month: "May", spend: 2100 },
  { month: "Jun", spend: 4375 },
];

export function SpendingChart() {
  return (
    <div className="h-[180px] w-full mt-2 -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
            dy={10}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
            labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
            itemStyle={{ color: '#111827', fontWeight: 600 }}
            formatter={(value: any) => [`R ${Number(value).toLocaleString()}`, "Spend"]}
          />
          <Area 
            type="monotone" 
            dataKey="spend" 
            stroke="#6366f1" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorSpend)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
