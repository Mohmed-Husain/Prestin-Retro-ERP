'use client';

import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface ExpenseTrendChartProps {
  data: { month: string; amount: number }[];
}

export default function ExpenseTrendChart({ data }: ExpenseTrendChartProps) {
  const peakAmount = Math.max(...data.map(d => d.amount));

  return (
    <div className="w-full h-56 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 10, left: -15, bottom: 0 }}>
          <defs>
            <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#111315" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#111315" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="month" 
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
            formatter={(value: any) => [formatCurrency(Number(value)), 'Expense']}
            contentStyle={{
              backgroundColor: '#111315',
              borderRadius: '16px',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              padding: '8px 12px',
              boxShadow: '0 8px 24px -4px rgba(0,0,0,0.15)'
            }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#111315" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#expenseGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
