'use client';

import React, { useState } from 'react';
import { Search, Bell, Calendar, ChevronDown, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function Header({ searchPlaceholder = 'Search products, customers, invoices...', onSearch }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const notifications = [
    { id: 1, title: 'Low Stock Alert', desc: 'Raw Selvedge Denim Jacket has only 12 Pcs left.', type: 'warning', link: '/inventory' },
    { id: 2, title: 'Khata Due', desc: 'UrbanThreads Apparel has ₹38,400 pending.', type: 'due', link: '/customers' },
    { id: 3, title: 'Google Sheets Live', desc: 'All 9 tabs connected & synced with cache.', type: 'info', link: '/settings' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      // Navigate or trigger search
      onSearch?.(searchValue);
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 py-5 px-8 relative">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={(e) => {
            setSearchValue(e.target.value);
            onSearch?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-4 py-2.5 bg-white/90 border border-neutral-200/70 rounded-full text-[13px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 transition-all shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)]"
        />
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-full bg-white border border-neutral-200/70 text-neutral-600 hover:text-neutral-900 shadow-sm transition-all hover:bg-neutral-50"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold text-neutral-900">Notifications</span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-neutral-400 hover:text-neutral-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2.5 mt-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      setShowNotifications(false);
                      router.push(n.link);
                    }}
                    className="p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors flex items-start gap-2.5 text-xs"
                  >
                    <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700 flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-bold text-neutral-900 block leading-tight">{n.title}</span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">{n.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-neutral-200/70 text-xs font-medium text-neutral-700 shadow-sm cursor-pointer hover:bg-neutral-50 transition-all">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
