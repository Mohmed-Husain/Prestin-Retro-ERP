'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface MonthlyProfitBarChartProps {
  data: { month: string; profit: number }[];
}

export default function MonthlyProfitBarChart({ data }: MonthlyProfitBarChartProps) {
  return (
    <div className="w-full h-44 pt-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888888', fontSize: 10 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#888888', fontSize: 9 }}
            tickFormatter={(val) => `${val / 1000}K`}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            formatter={(value: any) => [formatCurrency(Number(value)), 'Net Profit']}
            contentStyle={{
              backgroundColor: '#111315',
              borderRadius: '12px',
              border: 'none',
              color: '#ffffff',
              fontSize: '11px',
              padding: '6px 10px',
            }}
            itemStyle={{ color: '#ffffff' }}
          />
          <Bar 
            dataKey="profit" 
            fill="#a1a1aa" 
            radius={[6, 6, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
