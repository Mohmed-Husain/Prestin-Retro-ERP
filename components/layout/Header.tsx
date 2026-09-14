'use client';

import React from 'react';
import { Search, Bell, Calendar, ChevronDown } from 'lucide-react';

interface HeaderProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function Header({ searchPlaceholder = 'Search products, customers, invoices...', onSearch }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 py-5 px-8">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-neutral-200/70 rounded-full text-[13px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]"
        />
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2.5 rounded-full bg-white border border-neutral-200/70 text-neutral-600 hover:text-neutral-900 shadow-sm transition-all hover:bg-neutral-50"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-neutral-200/70 text-xs font-medium text-neutral-700 shadow-sm cursor-pointer hover:bg-neutral-50 transition-all">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>Mon, 26 May 2025</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
