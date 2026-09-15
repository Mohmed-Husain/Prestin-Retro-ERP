'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Loader2,
  Printer
} from 'lucide-react';
import { MonthlyReportData } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import SalesTrendLineChart from '@/components/reports/SalesTrendLineChart';
import ExpenseTrendBarChart from '@/components/reports/ExpenseTrendBarChart';
import MonthlyProfitBarChart from '@/components/reports/MonthlyProfitBarChart';
import SalesCategoryBar from '@/components/reports/SalesCategoryBar';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [data, setData] = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

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

  // Filtered calculations based on selected time filter
  const filteredMetrics = useMemo(() => {
    if (!data) {
      return {
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
        salesTrend: [],
        expenseTrend: [],
      };
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nowTime = now.getTime();
    const weekAgoTime = nowTime - 7 * 24 * 60 * 60 * 1000;

    const salesTrend = (data.salesTrend || []).filter(item => {
      if (timeFilter === 'today') return item.date === todayStr || item.date === todayStr.slice(5);
      if (timeFilter === 'week') {
        const itemTime = new Date(item.date).getTime();
        return isNaN(itemTime) || itemTime >= weekAgoTime;
      }
      if (timeFilter === 'custom' && customStartDate && customEndDate) {
        return item.date >= customStartDate && item.date <= customEndDate;
      }
      return true;
    });

    const expenseTrend = (data.expenseTrend || []).filter(item => {
      if (timeFilter === 'today') return item.date === todayStr || item.date === todayStr.slice(5);
      if (timeFilter === 'week') {
        const itemTime = new Date(item.date).getTime();
        return isNaN(itemTime) || itemTime >= weekAgoTime;
      }
      if (timeFilter === 'custom' && customStartDate && customEndDate) {
        return item.date >= customStartDate && item.date <= customEndDate;
      }
      return true;
    });

    // Real dynamic totals from filtered periods
    const isFullPeriod = timeFilter === 'month';
    const revenue = isFullPeriod ? data.totalSales : salesTrend.reduce((s, i) => s + i.sales, 0);
    const expenses = isFullPeriod ? data.totalExpenses : expenseTrend.reduce((s, i) => s + i.amount, 0);
    const cogsRatio = data.totalSales > 0 ? data.cogs / data.totalSales : 0;
    const cogs = isFullPeriod ? data.cogs : Math.round(revenue * cogsRatio);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expenses;

    return {
      revenue,
      cogs,
      grossProfit,
      expenses,
      netProfit,
      salesTrend,
      expenseTrend,
    };
  }, [data, timeFilter, customStartDate, customEndDate]);

  const handleExportReport = () => {
    if (!data) return;
    const reportSummary = [
      ['Metric', 'Formula / Source', 'Value (₹)'],
      ['Revenue', 'Sales Total', String(filteredMetrics.revenue)],
      ['COGS', 'SaleItems Cost', String(filteredMetrics.cogs)],
      ['Gross Profit', 'Revenue - COGS', String(filteredMetrics.grossProfit)],
      ['Expenses', 'Expense Total', String(filteredMetrics.expenses)],
      ['Net Profit', 'Gross Profit - Expenses', String(filteredMetrics.netProfit)],
      ['Total Invoices', 'Sales Count', String(data.totalInvoices)],
      ['Best Performing Month', data?.bestMonth?.month || 'Current', String(data?.bestMonth?.netProfit || 0)],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + reportSummary.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PrestonRetro_Financial_Report_${timeFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Financial report exported to CSV');
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="pt-2 mb-6">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          REPORTS & PROFITABILITY
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
          Dynamic Financial Performance & P&L
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Track sales, manufacturing COGS, operational overheads, and net profit live from Google Sheets.
        </p>
      </div>

      {/* Time Range Filters & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1.5 p-1 bg-white border border-neutral-200/80 rounded-full text-xs shadow-subtle overflow-x-auto">
          <button
            type="button"
            onClick={() => setTimeFilter('today')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
              timeFilter === 'today' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('week')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
              timeFilter === 'week' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setTimeFilter('month')}
            className={`px-4 py-1.5 rounded-full font-medium transition-all ${
              timeFilter === 'month' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full font-medium transition-all ${
              timeFilter === 'custom' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Custom Range</span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Dropdown Modal */}
      {showCustomPicker && (
        <div className="mb-6 p-4 rounded-2xl bg-white border border-neutral-200 shadow-sm flex flex-wrap items-center gap-4 text-xs animate-fade-in">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Start Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">End Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-neutral-200 focus:outline-none"
            />
          </div>
          <div className="self-end">
            <button
              type="button"
              onClick={() => {
                setTimeFilter('custom');
                setShowCustomPicker(false);
                toast.success('Applied custom date range filters');
              }}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-white font-medium hover:bg-black transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}

      {/* Profit Section - 5 Dynamic Cards with Formulas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        {/* Metric 1: Revenue (Sales Total) */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase">Revenue</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Formula: Sales Total</div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {formatCurrency(filteredMetrics.revenue)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Total Invoices: {data?.totalInvoices || 0}
          </div>
        </div>

        {/* Metric 2: COGS (SaleItems Cost) */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase">COGS</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Shirt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Formula: SaleItems Cost</div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {formatCurrency(filteredMetrics.cogs)}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Raw materials + manufacturing
          </div>
        </div>

        {/* Metric 3: Gross Profit (Revenue - COGS) */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase">Gross Profit</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Revenue − COGS</div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {formatCurrency(filteredMetrics.grossProfit)}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Margin: {Math.round((filteredMetrics.grossProfit / (filteredMetrics.revenue || 1)) * 100)}%
          </div>
        </div>

        {/* Metric 4: Expenses (Expense Total) */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase">Expenses</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Formula: Expense Total</div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">
            {formatCurrency(filteredMetrics.expenses)}
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-1">
            Factory overheads & utilities
          </div>
        </div>

        {/* Metric 5: Net Profit (PRIMARY HIGHLIGHT CARD) */}
        <div className="floating-card p-5 bg-neutral-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-neutral-400 mb-1">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              Net Profit ★
            </span>
            <div className="p-1 rounded-lg bg-white/10 text-white">
              <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">Gross Profit − Expenses</div>
          <div className="text-2xl font-extrabold text-white tracking-tight mt-1">
            {formatCurrency(filteredMetrics.netProfit)}
          </div>
          <div className="text-[11px] text-emerald-400 font-semibold mt-1">
            Net Margin: {Math.round((filteredMetrics.netProfit / (filteredMetrics.revenue || 1)) * 100)}%
          </div>
        </div>
      </div>

      {/* Two Separate Distinct Graphs: Graph 1 (Sales Trend Line) and Graph 2 (Expense Trend Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-7">
        {/* Graph 1: Sales Trend (Smooth line/area chart) */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Graph 1 — Sales Trend</h3>
              <p className="text-xs text-neutral-400">Live wholesale transactions from Sales sheet</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-700 capitalize">
              {timeFilter}
            </span>
          </div>
          <div className="my-auto py-2">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading sales trend...
              </div>
            ) : (
              <SalesTrendLineChart data={filteredMetrics.salesTrend} />
            )}
          </div>
        </div>

        {/* Graph 2: Expense Trend (Bar chart) */}
        <div className="floating-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Graph 2 — Expense Trend</h3>
              <p className="text-xs text-neutral-400">Live overheads from Expenses sheet</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-neutral-100 text-[11px] font-semibold text-neutral-700 capitalize">
              {timeFilter}
            </span>
          </div>
          <div className="my-auto py-2">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading expense trend...
              </div>
            ) : (
              <ExpenseTrendBarChart data={filteredMetrics.expenseTrend} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Operational Row: Top Selling Products, Category Distribution, Best Month */}
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
                  {(!data?.topSellingProducts || data.topSellingProducts.length === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-neutral-400 text-xs">
                        No product sales recorded yet.
                      </td>
                    </tr>
                  ) : data.topSellingProducts.map((p) => (
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
              <span className="text-xs font-semibold text-neutral-500">Live Breakdown</span>
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

            {/* Best Month Callout Card */}
            <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between mt-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-neutral-200/80 flex items-center justify-center text-neutral-700 shadow-subtle">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-neutral-400 block">Best Month</span>
                  <span className="text-xs font-bold text-neutral-900">
                    {data?.bestMonth?.month || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold text-neutral-400 block">Net Profit</span>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <span>{formatCurrency(filteredMetrics.netProfit)}</span>
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
