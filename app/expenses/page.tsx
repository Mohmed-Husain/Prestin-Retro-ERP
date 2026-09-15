'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Receipt, 
  Wallet, 
  Calendar, 
  PieChart as PieIcon, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  MoreHorizontal, 
  Loader2, 
  TrendingDown, 
  TrendingUp,
  Zap,
  Users,
  Truck,
  Box,
  Wrench,
  ShoppingBag,
  DollarSign
} from 'lucide-react';
import { Expense, ExpenseKPIs } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import ExpenseTrendChart from '@/components/expenses/ExpenseTrendChart';
import ExpenseBreakdownDonut from '@/components/expenses/ExpenseBreakdownDonut';
import { toast } from 'sonner';

import AddCategoryModal from '@/components/expenses/AddCategoryModal';
import { ExpenseCategory } from '@/lib/types';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [kpis, setKpis] = useState<ExpenseKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Add expense form state
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Fabric',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: 'Bank Transfer',
    notes: '',
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        fetch('/api/expenses?kpis=true'),
        fetch('/api/expense-categories'),
      ]);
      const data = await expRes.json();
      const catData = await catRes.json();

      if (data.success) {
        setExpenses(data.expenses || []);
        setKpis(data.kpis || null);
      }
      if (catData.success && catData.categories) {
        setCategories(catData.categories);
        if (catData.categories.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: catData.categories[0].name }));
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load expenses from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== 'ALL' && e.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchCat = e.category.toLowerCase().includes(q);
        const matchMethod = e.payment_method.toLowerCase().includes(q);
        const matchNotes = (e.notes || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchMethod && !matchNotes) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      toast.error('Please enter expense title and amount');
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: Number(formData.amount),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save expense');
      }

      toast.success(`Expense "${data.expense.title}" saved to Google Sheets!`);
      // Reset form
      setFormData({
        title: '',
        category: 'Fabric',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payment_method: 'Bank Transfer',
        notes: '',
      });
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.message || 'Error saving expense');
    } finally {
      setFormLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('fabric')) return <ShoppingBag className="w-3.5 h-3.5 text-neutral-700" />;
    if (cat.includes('electr')) return <Zap className="w-3.5 h-3.5 text-neutral-700" />;
    if (cat.includes('salar') || cat.includes('wage')) return <Users className="w-3.5 h-3.5 text-neutral-700" />;
    if (cat.includes('transp') || cat.includes('freight')) return <Truck className="w-3.5 h-3.5 text-neutral-700" />;
    if (cat.includes('pack')) return <Box className="w-3.5 h-3.5 text-neutral-700" />;
    if (cat.includes('maint') || cat.includes('repair')) return <Wrench className="w-3.5 h-3.5 text-neutral-700" />;
    return <Receipt className="w-3.5 h-3.5 text-neutral-700" />;
  };

  return (
    <AppShell
      searchPlaceholder="Search expenses, categories, notes..."
      onSearch={(q) => setSearchQuery(q)}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 mb-6">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            EXPENSES
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
            Track and manage your business expenses.
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Record every expense to get accurate profit and loss insights.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ New Category</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const formEl = document.getElementById('quick-expense-form');
              formEl?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 4 Floating KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {/* KPI 1: Today's Expenses */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Today's Expenses</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.todayExpenses) : '₹ 12,450'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↓ 18% vs yesterday</span>
          </div>
        </div>

        {/* KPI 2: This Month */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">This Month</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.thisMonthExpenses) : '₹ 56,780'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-rose-500 font-medium mt-1">
            <span>↑ 12% vs last month</span>
          </div>
        </div>

        {/* KPI 3: Monthly Average */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Monthly Average</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <PieIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.monthlyAverage) : '₹ 45,200'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↓ 8% vs previous 3 months</span>
          </div>
        </div>

        {/* KPI 4: Total This Year */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total This Year</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.totalThisYear) : '₹ 4,82,300'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
            <span>↓ 6% vs last year</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Trend Chart, Donut Breakdown, Quick Add Expense Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-7 items-start">
        {/* Expense Trend Chart (4 cols) */}
        <div className="lg:col-span-4 floating-card p-5 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">Expense Trend</h3>
            </div>
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
              <span>This Month</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </div>
          </div>

          <div className="my-auto">
            {kpis?.trend ? (
              <ExpenseTrendChart data={kpis.trend} />
            ) : (
              <div className="h-56 flex items-center justify-center text-neutral-400 text-xs">
                Loading trend...
              </div>
            )}
          </div>

          <div className="text-right pt-2 border-t border-neutral-100">
            <span className="text-xs text-neutral-400">May Peak: </span>
            <span className="text-xs font-bold text-neutral-900">
              {formatCurrency(kpis?.thisMonthExpenses || 56780)}
            </span>
          </div>
        </div>

        {/* Expense Breakdown Donut (4 cols) */}
        <div className="lg:col-span-4 floating-card p-5 h-full flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                <PieIcon className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-sm text-neutral-900">Expense Breakdown</h3>
            </div>
            <div className="text-xs text-neutral-400 font-medium">This Month</div>
          </div>

          <div className="py-2">
            {kpis?.breakdown ? (
              <ExpenseBreakdownDonut
                data={kpis.breakdown}
                totalAmount={kpis.thisMonthExpenses || 56780}
              />
            ) : (
              <div className="h-56 flex items-center justify-center text-neutral-400 text-xs">
                Loading breakdown...
              </div>
            )}
          </div>

          <div className="text-center text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
            Raw material & factory operating overhead
          </div>
        </div>

        {/* Quick Add Expense Form (4 cols) */}
        <div id="quick-expense-form" className="lg:col-span-4 floating-card p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-neutral-100">
            <Plus className="w-4 h-4 text-neutral-900" />
            <h3 className="font-bold text-sm text-neutral-900">Add Expense</h3>
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Title / Description *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cotton Fabric Purchase"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat.category_id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">Payment Method</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white text-xs"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {formLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving to Sheets...
                </>
              ) : (
                'Save Expense'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Table: All Expenses */}
      <div className="floating-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">
              <Receipt className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-neutral-900">All Expenses</h3>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-full border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900/10 w-44"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none pl-7 pr-8 py-1.5 rounded-full bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category_id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs">Fetching expenses from Google Sheets...</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-xs">
              No matching expense logs found.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-semibold text-neutral-400 border-b border-neutral-100 tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Payment Method</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.expense_id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-neutral-100 flex-shrink-0">
                          {getCategoryIcon(exp.category)}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900">{exp.title}</div>
                          {exp.notes && (
                            <div className="text-[11px] text-neutral-400">{exp.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200/50">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-neutral-900">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-600 font-medium">
                      {exp.payment_method}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={(newCat) => {
          setCategories(prev => [...prev, newCat]);
          setFormData(prev => ({ ...prev, category: newCat.name }));
        }}
      />
    </AppShell>
  );
}
