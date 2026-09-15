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
  const [companyName, setCompanyName] = React.useState('Pristine Retro');
  const [companyLogo, setCompanyLogo] = React.useState('');
  const [userName, setUserName] = React.useState('Aman Raj');

  React.useEffect(() => {
    // Load from localStorage if present for immediate display
    const savedName = localStorage.getItem('pristine_company_name');
    const savedLogo = localStorage.getItem('pristine_company_logo');
    const savedUser = localStorage.getItem('pristine_user_name');
    if (savedName) setCompanyName(savedName);
    if (savedLogo) setCompanyLogo(savedLogo);
    if (savedUser) setUserName(savedUser);

    // Fetch from settings API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          if (data.settings.company_name) {
            setCompanyName(data.settings.company_name);
            localStorage.setItem('pristine_company_name', data.settings.company_name);
          }
          if (data.settings.company_logo !== undefined) {
            setCompanyLogo(data.settings.company_logo);
            localStorage.setItem('pristine_company_logo', data.settings.company_logo);
          }
          if (data.settings.user_name) {
            setUserName(data.settings.user_name);
            localStorage.setItem('pristine_user_name', data.settings.user_name);
          }
        }
      })
      .catch(console.error);
  }, []);

  const userInitials = (userName || 'PR')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between p-6 bg-transparent h-screen sticky top-0">
      <div>
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-10 group">
          <div className="w-9 h-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 overflow-hidden flex-shrink-0">
            <img
              src="/logo.jpg"
              alt={companyName}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div className="overflow-hidden">
            <span className="text-base font-bold tracking-tight text-neutral-900 block leading-tight truncate">
              {companyName}
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
          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center font-semibold text-xs text-neutral-700 flex-shrink-0">
            {userInitials || 'PR'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-neutral-900 leading-tight truncate">{userName}</span>
            <span className="text-[11px] text-neutral-400">User / Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
