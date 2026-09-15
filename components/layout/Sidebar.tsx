'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Box, 
  ShoppingCart, 
  Users, 
  Receipt, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Inventory', href: '/inventory', icon: Box },
  { label: 'Sales & Billing', href: '/sales', icon: ShoppingCart },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Expenses', href: '/expenses', icon: Receipt },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between p-6 bg-transparent h-screen sticky top-0">
      <div>
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-10 group">
          <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V9s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <path d="M4 9c0 0 1-1 4-1s5 2 8 2 4-1 4-1" />
            </svg>
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-neutral-900 block leading-tight">
              Preston Retro
            </span>
            <span className="text-[10px] font-medium tracking-wider text-neutral-400 uppercase">
              FACTORY OS
            </span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-[14px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.04)] border border-neutral-200/50'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile */}
      <div className="space-y-3 pt-6">
        <Link
          href="/settings"
          className={`flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[14px] font-medium transition-colors ${
            pathname === '/settings' ? 'bg-white text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Settings className="w-4 h-4 text-neutral-400" />
          <span>Settings</span>
        </Link>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/70 border border-neutral-200/40 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-semibold text-xs text-neutral-700">
            AR
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-900 leading-tight">Aman Raj</span>
            <span className="text-[11px] text-neutral-400">Owner</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
