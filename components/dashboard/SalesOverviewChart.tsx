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

interface SalesOverviewChartProps {
  data: { month: string; sales: number }[];
}

export default function SalesOverviewChart({ data }: SalesOverviewChartProps) {
  const peakIndex = data.length - 1;
  const peakItem = data[peakIndex];

  return (
    <div className="w-full h-56 pt-2 relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 25, right: 15, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#111315" stopOpacity={0.12} />
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
            domain={[0, 400000]}
          />
          <Tooltip 
            formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
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
            dataKey="sales" 
            stroke="#111315" 
            strokeWidth={2.5} 
            fillOpacity={1} 
            fill="url(#salesGradient)" 
          />
          {peakItem && (
            <ReferenceDot
              x={peakItem.month}
              y={peakItem.sales}
              r={4.5}
              fill="#111315"
              stroke="#ffffff"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Floating Callout at Peak */}
      {peakItem && (
        <div className="absolute top-1 right-3 px-3 py-1 rounded-full bg-white border border-neutral-200/80 shadow-subtle text-xs font-bold text-neutral-900 pointer-events-none">
          {formatCurrency(peakItem.sales)}
        </div>
      )}
    </div>
  );
}
