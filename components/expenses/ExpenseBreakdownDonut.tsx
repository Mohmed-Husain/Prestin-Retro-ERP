'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/calculations';

interface ExpenseBreakdownDonutProps {
  data: { name: string; amount: number; percentage: number }[];
  totalAmount: number;
}

const COLORS = [
  '#27272a', // Fabric (dark zinc)
  '#52525b', // Electricity
  '#71717a', // Salary
  '#a1a1aa', // Transport
  '#d4d4d8', // Packaging
  '#e4e4e7', // Others
];

export default function ExpenseBreakdownDonut({ data, totalAmount }: ExpenseBreakdownDonutProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
      {/* Donut Chart with Center Text */}
      <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              dataKey="amount"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-sm font-bold text-neutral-900 leading-tight">
            {formatCurrency(totalAmount)}
          </span>
          <span className="text-[10px] font-medium text-neutral-400">
            This Month
          </span>
        </div>
      </div>

      {/* Categories Legend */}
      <div className="flex-1 space-y-2 text-xs w-full">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-neutral-700 font-medium">{item.name}</span>
            </div>
            <span className="text-neutral-500 font-bold">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
