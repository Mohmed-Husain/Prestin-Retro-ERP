'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface SalesTrendLineChartProps {
  data: { date: string; sales: number }[];
}

export default function SalesTrendLineChart({ data }: SalesTrendLineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
        No sales data available for this range.
      </div>
    );
  }

  const totalSales = data.reduce((s, d) => s + (d.sales || 0), 0);
  const peakDay = [...data].sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 font-medium">Period Total:</span>
          <span className="font-bold text-neutral-900">{formatCurrency(totalSales)}</span>
        </div>
        {peakDay && (
          <div className="text-[11px] text-neutral-500">
            Peak: <span className="font-semibold text-neutral-900">{peakDay.date} ({formatCurrency(peakDay.sales)})</span>
          </div>
        )}
      </div>

      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#171717" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#171717" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#737373' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#737373' }}
              tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = Number(payload[0].value);
                  const pct = totalSales > 0 ? Math.round((val / totalSales) * 100) : 0;
                  return (
                    <div className="bg-neutral-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-neutral-800 space-y-1">
                      <p className="font-semibold text-neutral-400 text-[10px] pb-1 border-b border-neutral-800">{label}</p>
                      <div className="flex items-center justify-between gap-4 text-white">
                        <span>Revenue:</span>
                        <span className="font-bold">{formatCurrency(val)}</span>
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {pct}% of period total
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#171717"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#salesGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
