'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import Link from 'next/link';
import { 
  BarChart3, 
  FileText, 
  Coins, 
  PieChart as PieIcon, 
  Calendar, 
  Download, 
  ChevronDown, 
  TrendingUp, 
  ShoppingBag, 
  Award, 
  ArrowUpRight, 
  Shirt, 
  Loader2 
} from 'lucide-react';
import { MonthlyReportData } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import SalesVsExpensesChart from '@/components/reports/SalesVsExpensesChart';
import ExpenseDonutChart from '@/components/dashboard/ExpenseDonutChart';
import MonthlyProfitBarChart from '@/components/reports/MonthlyProfitBarChart';
import SalesCategoryBar from '@/components/reports/SalesCategoryBar';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    setLoading(true);
    fetch('/api/reports/monthly')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json);
        }
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load reports from Google Sheets');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleExportReport = () => {
    if (!data) return;
    const reportSummary = [
      ['Metric', 'Value'],
      ['Total Sales', String(data.totalSales)],
      ['Total Expenses', String(data.totalExpenses)],
      ['Gross Profit', String(data.grossProfit)],
      ['Net Profit', String(data.netProfit)],
      ['Total Invoices', String(data.totalInvoices)],
      ['Best Month', data.bestMonth.month],
      ['Best Month Net Profit', String(data.bestMonth.netProfit)],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + reportSummary.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PristineRetro_Factory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Factory financial report exported to CSV');
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="pt-2 mb-6">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          REPORTS
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
          Insights for a smarter tomorrow.
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Track sales, expenses, inventory and profits — all in one place.
        </p>
      </div>

      {/* Time Range Filters & Export Report */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200/80 rounded-full text-xs shadow-subtle overflow-x-auto">
          <button
            type="button"
            onClick={() => setTimeRange('today')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              timeRange === 'today' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('week')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              timeRange === 'week' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('month')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              timeRange === 'month' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('quarter')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              timeRange === 'quarter' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            This Quarter
          </button>
          <button
            type="button"
            onClick={() => setTimeRange('year')}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              timeRange === 'year' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            This Year
          </button>
          <button
            type="button"
            onClick={() => toast.info('Custom date range selector active')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-medium text-neutral-500 hover:text-neutral-900"
          >
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Custom Range</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5 text-neutral-500" />
          <span>Export Report</span>
        </button>
      </div>

      {/* 5 Floating KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        {/* KPI 1: Total Sales */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total Sales</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.totalSales) : '₹ 3,48,200'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↑ 8% vs last month</span>
          </div>
        </div>

        {/* KPI 2: Total Expenses */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total Expenses</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? formatCurrency(data.totalExpenses) : '₹ 56,780'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-500 font-medium mt-1">
            <span>↑ 5% vs last month</span>
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
            {data ? formatCurrency(data.grossProfit) : '₹ 1,24,300'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↑ 10% vs last month</span>
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
            {data ? formatCurrency(data.netProfit) : '₹ 92,450'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↑ 9% vs last month</span>
          </div>
        </div>

        {/* KPI 5: Total Invoices */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total Invoices</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {data ? data.totalInvoices : '186'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↑ 12% vs last month</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Sales vs Expenses Dual Curve & Expense Breakdown Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-7">
        {/* Sales vs Expenses (7 cols) */}
        <div className="lg:col-span-7 floating-card p-6 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-neutral-900">Sales vs Expenses</h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-900" />
                  <span className="text-neutral-600 font-medium">Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  <span className="text-neutral-600 font-medium">Expenses</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
          </div>

          <div className="my-auto py-2">
            {data?.salesVsExpenses ? (
              <SalesVsExpensesChart data={data.salesVsExpenses} />
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
                Loading sales vs expenses...
              </div>
            )}
          </div>
        </div>

        {/* Expense Breakdown Donut (5 cols) */}
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
            {data?.expenseBreakdown ? (
              <ExpenseDonutChart
                data={data.expenseBreakdown}
                totalAmount={data.totalExpenses}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
                Loading breakdown...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Products, Sales by Category, Monthly Profit Trend */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Top Selling Products */}
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
                href="/inventory"
                className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                View all
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase font-semibold text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="py-2.5 w-6 text-center">#</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-2 text-center">Units Sold</th>
                    <th className="py-2.5 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data?.topSellingProducts.map((p) => (
                    <tr key={p.rank} className="hover:bg-neutral-50/50">
                      <td className="py-3 text-center font-bold text-neutral-400">{p.rank}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600 flex-shrink-0">
                            <Shirt className="w-3.5 h-3.5 opacity-70" />
                          </div>
                          <span className="font-semibold text-neutral-900 truncate max-w-[120px]">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-medium text-neutral-700">
                        {p.units_sold}
                      </td>
                      <td className="py-3 text-right font-bold text-neutral-900">
                        {formatCurrency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Card 2: Sales by Category */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Sales by Category</h3>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-neutral-500">
                <span>This Month</span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
              </div>
            </div>

            <div className="mt-3">
              {data?.salesByCategory ? (
                <SalesCategoryBar categories={data.salesByCategory} />
              ) : (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  Loading categories...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Profit Trend & Best Month Callout */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-neutral-900">Monthly Profit Trend</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>Profit</span>
              </div>
            </div>

            {/* Profit Bar Chart */}
            <div className="my-2">
              {data?.monthlyProfitTrend ? (
                <MonthlyProfitBarChart data={data.monthlyProfitTrend} />
              ) : (
                <div className="h-44 flex items-center justify-center text-neutral-400 text-xs">
                  Loading profit trend...
                </div>
              )}
            </div>

            {/* Best Month Callout Card matching reports.png */}
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-subtle">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 block">Best Month</span>
                  <span className="text-xs font-bold text-neutral-900">
                    {data?.bestMonth.month || 'May 2025'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold text-neutral-400 block">Net Profit</span>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <span>{formatCurrency(data?.bestMonth.netProfit || 92450)}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
