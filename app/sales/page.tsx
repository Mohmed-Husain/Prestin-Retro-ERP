'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  ShoppingCart, 
  Download, 
  Plus, 
  CheckCircle, 
  Clock, 
  FileText, 
  Search, 
  TrendingUp, 
  Package, 
  Printer, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { Sale, Customer, Product, SalesKPIs } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import CreateInvoiceModal from '@/components/sales/CreateInvoiceModal';
import EditInvoiceModal from '@/components/sales/EditInvoiceModal';
import ViewInvoiceModal from '@/components/customers/ViewInvoiceModal';
import { toast } from 'sonner';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kpis, setKpis] = useState<SalesKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'DISPATCHED' | 'DRAFT'>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Sale | null>(null);
  const [deletingInvoice, setDeletingInvoice] = useState<Sale | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, customersRes, productsRes] = await Promise.all([
        fetch('/api/sales?kpis=true'),
        fetch('/api/customers'),
        fetch('/api/products'),
      ]);

      const [salesData, customersData, productsData] = await Promise.all([
        salesRes.json(),
        customersRes.json(),
        productsRes.json(),
      ]);

      if (salesData.success) {
        setSales(salesData.sales || []);
        setKpis(salesData.kpis || null);
      }
      if (customersData.success) {
        setCustomers(customersData.customers || []);
      }
      if (productsData.success) {
        setProducts(productsData.products || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load sales data from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      // Status filter
      if (statusFilter === 'UNPAID' && s.status !== 'Unpaid') return false;
      if (statusFilter === 'PAID' && s.status !== 'Paid') return false;
      if (statusFilter === 'DISPATCHED' && s.status !== 'Dispatched') return false;
      if (statusFilter === 'DRAFT' && s.status !== 'Draft') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchInv = s.invoice_number.toLowerCase().includes(q);
        const matchCust = (s.customer_name || '').toLowerCase().includes(q);
        const matchDate = s.date.includes(q);
        if (!matchInv && !matchCust && !matchDate) return false;
      }

      return true;
    });
  }, [sales, statusFilter, searchQuery]);

  const handleMarkDispatched = async (invoiceId: string) => {
    try {
      const res = await fetch(`/api/sales/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Dispatched' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update dispatch status');
      }
      toast.success('Invoice marked as Dispatched in Google Sheets!');
      setSales(prev => prev.map(s => s.invoice_id === invoiceId ? { ...s, status: 'Dispatched' } : s));
      if (selectedInvoice && selectedInvoice.invoice_id === invoiceId) {
        setSelectedInvoice(prev => prev ? { ...prev, status: 'Dispatched' } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating status');
    }
  };

  const handleMarkPaid = async (sale: Sale) => {
    try {
      // Record payment for this specific invoice
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: sale.customer_id,
          amount: sale.total,
          method: 'Bank Transfer',
          reference: `INV-${sale.invoice_number}`,
          date: new Date().toISOString().split('T')[0],
          notes: `Settlement for Invoice #${sale.invoice_number}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }

      toast.success(`Invoice #${sale.invoice_number} settled & logged to Customer Khata!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error recording payment');
    }
  };


  const handleInvoiceUpdated = (updated: Sale) => {
    setSales(sales.map(s => s.invoice_id === updated.invoice_id ? { ...s, ...updated } : s));
    fetchData();
  };

  const handleDeleteInvoice = async () => {
    if (!deletingInvoice) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/sales/${deletingInvoice.invoice_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete invoice');
      }
      toast.success(`Invoice #${deletingInvoice.invoice_number} deleted and stock restored!`);
      setSales(sales.filter(s => s.invoice_id !== deletingInvoice.invoice_id));
      setDeletingInvoice(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting invoice');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleInvoiceCreated = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    fetchData();
  };

  const handleExportCSV = () => {
    if (sales.length === 0) {
      toast.error('No sales data to export');
      return;
    }
    const headers = ['Invoice Number', 'Date', 'Customer', 'Subtotal', 'GST', 'Total', 'Status'];
    const rows = sales.map(s => [
      s.invoice_number,
      s.date,
      `"${s.customer_name || 'Buyer'}"`,
      String(s.subtotal),
      String(s.gst),
      String(s.total),
      s.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PristineRetro_Sales_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales ledger exported to CSV successfully');
  };

  const customerForInvoice = useMemo(() => {
    if (!selectedInvoice) return null;
    return customers.find(c => c.customer_id === selectedInvoice.customer_id) || null;
  }, [selectedInvoice, customers]);

  return (
    <AppShell
      searchPlaceholder="Search invoices, buyer names, amounts, dates..."
      onSearch={(q) => setSearchQuery(q)}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 mb-6">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            SALES & INVOICING
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
            Factory Sales & Invoicing
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Generate wholesale dispatch invoices, validate stock availability, and update buyer ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export All Sales</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* 4 Floating KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        {/* KPI 1: TODAY'S BILLED */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">TODAY'S BILLED</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.todayBilled) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Live from Sales</span>
          </div>
        </div>

        {/* KPI 2: MONTHLY BILLED */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">MONTHLY BILLED</span>
            <span className="text-[11px] text-neutral-400 font-medium">Month Total</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.monthlyBilled) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Fulfilled factory orders
          </div>
        </div>

        {/* KPI 3: UNPAID / KHATA DUE */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">UNPAID / KHATA DUE</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
              Action Req.
            </span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.unpaidAmount) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Pending buyer settlement
          </div>
        </div>

        {/* KPI 4: TOTAL UNITS DISPATCHED */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">UNITS DISPATCHED</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? `${kpis.totalUnitsDispatched} Pcs` : (loading ? '—' : '0 Pcs')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Across {sales.length} fulfilled batches
          </div>
        </div>
      </div>

      {/* Filter Tabs & Invoices List */}
      <div className="floating-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-100/70 rounded-full text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Invoices ({sales.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                statusFilter === 'UNPAID' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Unpaid (Khata Due)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                statusFilter === 'PAID' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISPATCHED')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                statusFilter === 'DISPATCHED' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Dispatched
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DRAFT')}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                statusFilter === 'DRAFT' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Drafts
            </button>
          </div>

          <div className="text-xs text-neutral-400">
            Showing <span className="font-semibold text-neutral-700">{filteredSales.length}</span> invoices
          </div>
        </div>

        {/* Invoices Table */}
        <div className="overflow-x-auto mt-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-xs font-medium">Loading invoices from Google Sheets...</span>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              No invoices match your search or filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-neutral-400 uppercase tracking-wider text-[10px] font-semibold border-b border-neutral-100">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Wholesale Buyer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredSales.map((sale) => {
                  const isUnpaid = sale.status === 'Unpaid';
                  const isDispatched = sale.status === 'Dispatched';
                  const isDraft = sale.status === 'Draft';
                  const totalUnits = sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  const itemSummary = sale.items && sale.items.length > 0
                    ? `${totalUnits} Pcs (${sale.items.map(i => `${i.sku}`).join(', ')})`
                    : 'Garment Dispatch Lot';

                  return (
                    <tr key={sale.invoice_id} className="hover:bg-neutral-50/60 transition-colors group">
                      <td className="py-4 px-4 font-bold font-mono text-neutral-900">
                        #{sale.invoice_number}
                      </td>
                      <td className="py-4 px-4 text-neutral-500 whitespace-nowrap">
                        {sale.date}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-neutral-900">{sale.customer_name}</div>
                        <div className="text-[11px] text-neutral-400">Net 15 Days Term</div>
                      </td>
                      <td className="py-4 px-4 text-neutral-600">
                        <div className="font-medium text-neutral-800">{itemSummary}</div>
                      </td>
                      <td className="py-4 px-4 text-right text-neutral-500 font-medium">
                        {formatCurrency(sale.gst)}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-neutral-900 text-sm">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {isDraft ? (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 whitespace-nowrap">
                            Draft
                          </span>
                        ) : isDispatched ? (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                            ✓ Dispatched
                          </span>
                        ) : isUnpaid ? (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">
                            Unpaid - Due in 15d
                          </span>
                        ) : (
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">
                            Paid (Settled)
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUnpaid && (
                            <button
                              type="button"
                              onClick={() => handleMarkPaid(sale)}
                              className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 shadow-sm transition-all whitespace-nowrap"
                            >
                              Mark Paid
                            </button>
                          )}
                          {!isDispatched && (
                            <button
                              type="button"
                              onClick={() => handleMarkDispatched(sale.invoice_id)}
                              className="px-3 py-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-medium hover:bg-black shadow-sm transition-all whitespace-nowrap"
                            >
                              Dispatch
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(sale)}
                            className="px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all whitespace-nowrap"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingInvoice(sale)}
                            className="p-1.5 rounded-full bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 shadow-sm transition-all"
                            title="Edit Invoice"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingInvoice(sale)}
                            className="p-1.5 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-all"
                            title="Delete Invoice & Restore Stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        invoice={editingInvoice}
        customers={customers}
        products={products}
        isOpen={!!editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onInvoiceUpdated={handleInvoiceUpdated}
      />

      {/* Delete Invoice Confirmation Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-neutral-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">
              Delete Invoice #{deletingInvoice.invoice_number}?
            </h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              This invoice will be removed and its garment quantities will be <span className="font-semibold text-emerald-600">automatically restored into warehouse inventory</span>.
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingInvoice(null)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteInvoice}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Restoring Stock...' : 'Delete & Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onInvoiceCreated={handleInvoiceCreated}
        customers={customers}
        products={products}
      />

      <ViewInvoiceModal
        invoice={selectedInvoice}
        customer={customerForInvoice}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </AppShell>
  );
}
