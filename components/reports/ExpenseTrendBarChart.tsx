'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface ExpenseTrendBarChartProps {
  data: { date: string; amount: number; outgoing?: number; incoming?: number }[];
}

export default function ExpenseTrendBarChart({ data }: ExpenseTrendBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
        No expense data available for this range.
      </div>
    );
  }

  const chartData = data.map(d => ({
    date: d.date,
    amount: d.amount,
    outgoing: d.outgoing !== undefined ? d.outgoing : d.amount,
    incoming: d.incoming !== undefined ? d.incoming : 0,
  }));

  const totalOutgoing = chartData.reduce((s, c) => s + c.outgoing, 0);
  const totalIncoming = chartData.reduce((s, c) => s + c.incoming, 0);
  const netSpend = totalOutgoing - totalIncoming;

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center justify-between text-xs pb-2 border-b border-neutral-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-neutral-500 font-medium">Outgoing:</span>
            <span className="font-bold text-neutral-900">{formatCurrency(totalOutgoing)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-neutral-500 font-medium">Incoming:</span>
            <span className="font-bold text-neutral-900">{formatCurrency(totalIncoming)}</span>
          </div>
        </div>
        <div className="text-[11px] text-neutral-500">
          Net Spend: <span className="font-bold text-neutral-900">{formatCurrency(netSpend)}</span>
        </div>
      </div>

      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  const outVal = Number(payload[0]?.value || 0);
                  const inVal = Number(payload[1]?.value || 0);
                  return (
                    <div className="bg-neutral-900 text-white p-3 rounded-2xl text-xs shadow-xl border border-neutral-800 space-y-1">
                      <p className="font-semibold text-neutral-400 text-[10px] pb-1 border-b border-neutral-800">{label}</p>
                      <div className="flex items-center justify-between gap-4 text-rose-400">
                        <span>Outgoing:</span>
                        <span className="font-bold">{formatCurrency(outVal)}</span>
                      </div>
                      {inVal > 0 && (
                        <div className="flex items-center justify-between gap-4 text-emerald-400">
                          <span>Incoming:</span>
                          <span className="font-bold">+{formatCurrency(inVal)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4 pt-1 border-t border-neutral-800 font-bold text-white">
                        <span>Net:</span>
                        <span>{formatCurrency(outVal - inVal)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="outgoing"
              name="Outgoing Expense"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="incoming"
              name="Incoming (Refunds)"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
