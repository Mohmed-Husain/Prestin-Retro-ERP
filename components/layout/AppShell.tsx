'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'sonner';

interface AppShellProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function AppShell({ children, searchPlaceholder, onSearch }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F4F5F7] text-neutral-900 selection:bg-neutral-900 selection:text-white">
      <Toaster position="top-right" richColors closeButton />
      
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header searchPlaceholder={searchPlaceholder} onSearch={onSearch} />
        
        <main className="flex-1 px-8 pb-10 max-w-[1550px] w-full">
          {children}
        </main>

        {/* Global Footer Tagline */}
        <footer className="px-8 py-5 border-t border-neutral-200/50 flex items-center justify-between text-xs text-neutral-400">
          <p className="italic font-serif">“Better systems. Smoother manufacturing.”</p>
          <p className="font-medium tracking-wide">
            Preston Retro <span className="mx-1">·</span> Factory Management System v1.0
          </p>
        </footer>
      </div>
    </div>
  );
}
