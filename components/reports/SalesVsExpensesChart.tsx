'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceDot
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface SalesVsExpensesChartProps {
  data: { date: string; sales: number; expenses: number }[];
}

export default function SalesVsExpensesChart({ data }: SalesVsExpensesChartProps) {
  const latestItem = data[data.length - 1];

  return (
    <div className="w-full h-64 pt-2 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 25, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="salesDualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#111315" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#111315" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="expenseDualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#71717a" stopOpacity={0.10} />
              <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888888', fontSize: 11 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888888', fontSize: 10 }}
            tickFormatter={(val) => `${val / 1000}K`}
            domain={[0, 'auto']}
          />
          <Tooltip 
            formatter={(value: any, name: any) => [
              formatCurrency(Number(value)),
              name === 'sales' ? 'Sales Revenue' : 'Expenses'
            ]}
            contentStyle={{
              backgroundColor: '#111315',
              borderRadius: '16px',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              padding: '10px 14px',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.2)'
            }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Area 
            type="monotone" 
            dataKey="sales" 
            name="sales"
            stroke="#111315" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#salesDualGradient)" 
          />
          <Area 
            type="monotone" 
            dataKey="expenses" 
            name="expenses"
            stroke="#9ca3af" 
            strokeWidth={2} 
            fillOpacity={1} 
            fill="url(#expenseDualGradient)" 
          />
          {latestItem && (
            <ReferenceDot
              x={latestItem.date}
              y={latestItem.sales}
              r={4}
              fill="#111315"
              stroke="#ffffff"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Hover/Peak Summary Badge matching reports.png */}
      {latestItem && (
        <div className="absolute top-2 right-4 p-2.5 rounded-2xl bg-white border border-neutral-200/90 shadow-floating text-[11px] pointer-events-none space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
            <span className="text-neutral-500">Sales:</span>
            <span className="font-bold text-neutral-900">{formatCurrency(latestItem.sales)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            <span className="text-neutral-500">Expenses:</span>
            <span className="font-bold text-neutral-900">{formatCurrency(latestItem.expenses)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
