'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';
import { 
  BarChart3, 
  ShoppingBag, 
  Coins, 
  PieChart as PieIcon, 
  Wallet, 
  ChevronDown, 
  Box, 
  TrendingUp, 
  FileText, 
  ChevronRight, 
  Shirt, 
  Loader2,
  TrendingDown
} from 'lucide-react';
import { DashboardKPIs } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import SalesOverviewChart from '@/components/dashboard/SalesOverviewChart';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load dashboard metrics from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <AppShell>
      {/* Header Greeting */}
      <div className="pt-2 mb-6">
        <p className="text-sm font-medium text-neutral-500">Good morning,</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
          Here's your business at a glance.
        </h1>
      </div>

      {/* 5 Floating KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        {/* KPI 1: Today's Sales */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Today's Sales</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.todaySales) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Live from Sales</span>
          </div>
        </div>

        {/* KPI 2: Monthly Sales */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Monthly Sales</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.monthlySales) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Current Month</span>
          </div>
        </div>

        {/* KPI 3: Gross Profit */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Gross Profit</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.grossProfit) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Revenue − COGS</span>
          </div>
        </div>

        {/* KPI 4: Net Profit */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Net Profit</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <PieIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.netProfit) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Gross Profit − Expenses</span>
          </div>
        </div>

        {/* KPI 5: Total Expenses */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total Expenses</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.totalExpenses) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Factory Overheads</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Overview & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-7">
        {/* Sales Overview (7 cols) */}
        <div className="lg:col-span-7 floating-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Sales Overview</h3>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
          </div>

          <div className="my-auto py-2">
            {data?.salesTrend ? (
              <SalesOverviewChart data={data.salesTrend} />
            ) : (
              <div className="h-56 flex items-center justify-center text-neutral-400 text-xs">
                Loading sales trend...
              </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown (5 cols) */}
        <div className="lg:col-span-5 floating-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Expense Breakdown</h3>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
          </div>

          <div className="my-auto py-2">
            {data ? (
              <ExpenseDonutChart
                data={data.expenseBreakdown}
                totalAmount={data.totalExpenses}
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-neutral-400 text-xs">
                Loading breakdown...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Low Stock Items, Top Selling Products, Recent Sales (3 equal cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Low Stock Items */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Low Stock Items</h3>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 mt-2">
              {data?.lowStockItems && data.lowStockItems.length > 0 ? (
                data.lowStockItems.map((prod) => (
                  <div key={prod.product_id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 flex-shrink-0">
                        <Shirt className="w-4 h-4 opacity-70" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                          {prod.product_name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          SKU: {prod.sku} | Size: {prod.size.split(',')[0]} | {prod.color}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 whitespace-nowrap">
                      {prod.stock} left
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  All floor inventory is healthy!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Top Selling Products */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Top Selling Products</h3>
              </div>
              <Link
                href="/reports"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 mt-2">
              {data?.topSellingProducts && data.topSellingProducts.length > 0 ? (
                data.topSellingProducts.map((prod, index) => (
                  <div key={prod.product_id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-5 text-xs font-bold text-neutral-400 text-center">
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 flex-shrink-0">
                        <Shirt className="w-4 h-4 opacity-70" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900 leading-tight">
                          {prod.product_name}
                        </h4>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500 whitespace-nowrap">
                      {prod.units_sold} sold
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  No sales recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Recent Sales */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Recent Sales</h3>
              </div>
              <Link
                href="/sales"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="divide-y divide-neutral-100 mt-2">
              {data?.recentSales && data.recentSales.length > 0 ? (
                data.recentSales.map((sale) => (
                  <Link
                    key={sale.invoice_id}
                    href="/sales"
                    className="py-3 flex items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors rounded-xl px-2 -mx-2 group"
                  >
                    <div>
                      <div className="text-xs font-mono font-bold text-neutral-900">
                        #{sale.invoice_number}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        {sale.customer_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-xs font-bold text-neutral-900">
                        {formatCurrency(sale.total)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  No recent sales yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
