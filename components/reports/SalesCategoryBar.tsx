'use client';

import React from 'react';

interface SalesCategoryBarProps {
  categories: { category: string; percentage: number }[];
}

export default function SalesCategoryBar({ categories }: SalesCategoryBarProps) {
  return (
    <div className="space-y-3.5 py-1">
      {categories.map((item) => (
        <div key={item.category} className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-neutral-800">{item.category}</span>
            <span className="font-bold text-neutral-900">{item.percentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-neutral-900 transition-all duration-500"
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
