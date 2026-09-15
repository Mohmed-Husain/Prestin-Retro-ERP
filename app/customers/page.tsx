'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Users, 
  Download, 
  Send, 
  Plus, 
  AlertCircle, 
  TrendingUp, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  CreditCard,
  Loader2,
  FileText
} from 'lucide-react';
import { Customer, CustomerKPIs, Sale, Payment } from '@/lib/types';
import { formatCurrency, formatCompactCurrency } from '@/lib/calculations';
import AddCustomerModal from '@/components/customers/AddCustomerModal';
import RecordPaymentModal from '@/components/customers/RecordPaymentModal';
import ViewInvoiceModal from '@/components/customers/ViewInvoiceModal';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [kpis, setKpis] = useState<CustomerKPIs | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSales, setCustomerSales] = useState<Sale[]>([]);
  const [customerPayments, setCustomerPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'DUE' | 'OVERDUE' | 'TOP'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);

  // Fetch all customers & KPIs
  const fetchCustomers = async (retainSelectedId?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/customers?kpis=true');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
        setKpis(data.kpis || null);
        const nextSelected = retainSelectedId || selectedCustomerId || (data.customers?.[0]?.customer_id ?? null);
        setSelectedCustomerId(nextSelected);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load customers from Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  // Fetch individual customer ledger (sales + payments)
  const fetchCustomerLedger = async (customerId: string) => {
    try {
      setLedgerLoading(true);
      const res = await fetch(`/api/customers/${customerId}?ledger=true`);
      const data = await res.json();
      if (data.success) {
        setCustomerSales(data.sales || []);
        setCustomerPayments(data.payments || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerLedger(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.customer_id === selectedCustomerId) || customers[0] || null;
  }, [customers, selectedCustomerId]);

  // Filtered customer directory list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Tab filter
      if (filterTab === 'DUE' && (c.outstanding || 0) <= 0) return false;
      if (filterTab === 'OVERDUE' && c.overdue_status !== 'overdue') return false;
      if (filterTab === 'TOP' && (c.credit_limit || 0) < 150000) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchGst = c.gst.toLowerCase().includes(q);
        const matchPhone = c.phone.toLowerCase().includes(q);
        const matchAddr = c.address.toLowerCase().includes(q);
        if (!matchName && !matchGst && !matchPhone && !matchAddr) return false;
      }

      return true;
    });
  }, [customers, filterTab, searchQuery]);

  const handleCustomerCreated = (newCust: Customer) => {
    setCustomers(prev => [newCust, ...prev]);
    setSelectedCustomerId(newCust.customer_id);
    fetchCustomers(newCust.customer_id);
  };

  const handlePaymentRecorded = (payment: Payment) => {
    if (selectedCustomerId) {
      fetchCustomerLedger(selectedCustomerId);
      fetchCustomers(selectedCustomerId);
    }
  };

  const handleExportStatement = () => {
    if (!selectedCustomer) {
      toast.error('No customer selected');
      return;
    }
    const headers = ['Type', 'Ref/Invoice', 'Date', 'Amount', 'Status/Method'];
    const rows: string[][] = [];

    customerSales.forEach(s => {
      rows.push(['Invoice', s.invoice_number, s.date, String(s.total), s.status]);
    });
    customerPayments.forEach(p => {
      rows.push(['Payment Received', p.reference || p.payment_id, p.date, String(p.amount), p.method]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Statement_${selectedCustomer.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Statement exported for ${selectedCustomer.name}`);
  };

  const handleSendReminder = () => {
    if (!selectedCustomer) return;
    const cleanPhone = selectedCustomer.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${selectedCustomer.name}, this is a friendly reminder from Preston Retro regarding your outstanding balance of ${formatCurrency(selectedCustomer.outstanding || 0)}. Please arrange payment at your earliest convenience. Thank you!`
    );
    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${message}`, '_blank');
    }
    toast.success(`Payment reminder opened for ${selectedCustomer.name} (${selectedCustomer.phone})`);
  };

  // Helper for customer avatar initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AppShell
      searchPlaceholder="Search customers, GSTIN, phone, buyer name..."
      onSearch={(q) => setSearchQuery(q)}
    >
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
              BUYER LEDGER & CREDIT MANAGEMENT
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Real-time Balance Sync
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900">
            Customer Accounts & Khata
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage wholesale buyers, track credit limits, payment status & customer ledger history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export Statement */}
          <button
            type="button"
            onClick={handleExportStatement}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export Statement</span>
          </button>

          {/* Send Reminder */}
          <button
            type="button"
            onClick={handleSendReminder}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5 text-neutral-500" />
            <span>Send Reminder</span>
          </button>

          {/* + Add Customer Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 5 Floating KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        {/* KPI 1: TOTAL BUYERS */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">TOTAL BUYERS</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? kpis.totalBuyers : (loading ? '—' : 0)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Active accounts</span>
          </div>
          <div className="text-[10px] text-neutral-400 mt-0.5">Verified garment retailers</div>
        </div>

        {/* KPI 2: TOTAL OUTSTANDING */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">TOTAL OUTSTANDING</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
              {kpis ? `${kpis.overdueCount} Overdue` : '0 Overdue'}
            </span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.totalOutstanding) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Pending factory collection
          </div>
        </div>

        {/* KPI 3: COLLECTED THIS MONTH */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">COLLECTED (MAY)</span>
            <span className="text-[11px] text-emerald-600 font-medium">↑ 14%</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.collectedThisMonth) : '₹ 12,40,000'}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Via Bank NEFT & Cash
          </div>
        </div>

        {/* KPI 4: CREDIT EXTENDED */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">CREDIT EXTENDED</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.creditExtended) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Buyer credit limits
          </div>
        </div>

        {/* KPI 5: AVG SETTLEMENT */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">AVG SETTLEMENT</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? `${kpis.avgSettlementDays} Days` : (loading ? '—' : '0 Days')}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            Healthy credit rotation
          </div>
        </div>
      </div>

      {/* Split View Layout: Left Panel (Directory) + Right Panel (Ledger Profile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Khata Directory (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Directory Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/70 border border-neutral-200/60 rounded-full shadow-subtle text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                filterTab === 'ALL' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              All Buyers ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('DUE')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                filterTab === 'DUE' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Pending Due
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('OVERDUE')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                filterTab === 'OVERDUE' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Overdue
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('TOP')}
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
                filterTab === 'TOP' ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Top Spenders
            </button>
          </div>

          {/* Customer Cards List */}
          <div className="space-y-3 max-h-[820px] overflow-y-auto pr-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs">Connecting to Google Sheets Khata...</span>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="floating-card p-8 text-center text-neutral-400 text-xs">
                No buyers match the current filter.
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = cust.customer_id === selectedCustomer?.customer_id;
                const outstanding = cust.outstanding || 0;
                const creditLimit = cust.credit_limit || 0;
                const available = Math.max(0, creditLimit - outstanding);
                const utilPercent = Math.min(100, Math.round((outstanding / creditLimit) * 100));

                return (
                  <div
                    key={cust.customer_id}
                    onClick={() => setSelectedCustomerId(cust.customer_id)}
                    className={`floating-card p-4 cursor-pointer transition-all duration-200 relative ${
                      isSelected
                        ? 'border-neutral-900 shadow-floating-hover ring-1 ring-neutral-900/10'
                        : 'hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                          {getInitials(cust.name)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-neutral-900 tracking-tight leading-tight">
                              {cust.name}
                            </h4>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                              {cust.tier || 'Regular'}
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-1">
                            {cust.address.split(',')[0]} • GSTIN: {cust.gst || 'Pending'}
                          </div>
                          <div className="text-[11px] text-neutral-400 mt-0.5">
                            {cust.phone}
                          </div>
                        </div>
                      </div>

                      {/* Right Balance Badge */}
                      <div className="text-right flex-shrink-0">
                        {outstanding > 50000 ? (
                          <div>
                            <div className="text-sm font-bold text-rose-600">
                              {formatCurrency(outstanding)}
                            </div>
                            <span className="inline-block text-[9px] font-bold text-rose-600 uppercase tracking-wider">
                              IMMEDIATE ACTION
                            </span>
                          </div>
                        ) : outstanding > 0 ? (
                          <div>
                            <div className="text-sm font-bold text-neutral-900">
                              {formatCurrency(outstanding)}
                            </div>
                            <span className="inline-block text-[9px] font-bold text-amber-600 uppercase tracking-wider">
                              BALANCE DUE
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              ₹ 0 Due (All Paid)
                            </span>
                            <div className="text-[9px] text-neutral-400 mt-0.5">Sanctioned ₹ 2.0L</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Progress Bar */}
                    <div className="mt-3.5 pt-3 border-t border-neutral-100">
                      <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            utilPercent > 80 ? 'bg-rose-500' : 'bg-neutral-900'
                          }`}
                          style={{ width: `${utilPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1.5 font-medium">
                        <span>Credit Limit:</span>
                        <span>{formatCompactCurrency(available)} / {formatCompactCurrency(creditLimit)} Avail</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Selected Customer Ledger Profile (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="space-y-5">
              {/* Profile Header Card */}
              <div className="floating-card p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-neutral-100">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                      {selectedCustomer.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white">
                        {selectedCustomer.tier || 'Wholesale'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        GST Verified
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-5 py-2.5 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Record Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info('Edit customer modal ready')}
                      className="px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 shadow-sm transition-all"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Contact & Dispatch Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs text-neutral-600">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-semibold text-neutral-900">
                        {selectedCustomer.contact_person || selectedCustomer.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 pl-5">
                      <Phone className="w-3 h-3 text-neutral-400" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500 pl-5">
                      <Mail className="w-3 h-3 text-neutral-400" />
                      <span>{selectedCustomer.email || 'No email registered'}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">
                      Factory Dispatch Address
                    </span>
                    <div className="flex items-start gap-2 text-neutral-500">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  </div>
                </div>

                {/* 4 Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-neutral-100">
                  <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      CURRENT DUE
                    </span>
                    <span className="text-base font-bold text-neutral-900 mt-1 block">
                      {formatCurrency(selectedCustomer.outstanding || 0)}
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">{selectedCustomer.outstanding && selectedCustomer.outstanding > 0 ? 'Payment Pending' : 'Settled in Full'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      LIFETIME VOLUME
                    </span>
                    <span className="text-base font-bold text-neutral-900 mt-1 block">
                      {formatCompactCurrency(selectedCustomer.total_billed || 0)}
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      {customerSales.length} Orders to date
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      CREDIT AVAILABLE
                    </span>
                    <span className="text-base font-bold text-emerald-600 mt-1 block">
                      {formatCurrency(Math.max(0, (selectedCustomer.credit_limit || 0) - (selectedCustomer.outstanding || 0)))}
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      Limit: {formatCompactCurrency(selectedCustomer.credit_limit || 0)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-neutral-50/80 border border-neutral-100 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                      PAYMENT TRUST
                    </span>
                    <span className="text-base font-bold text-neutral-900 mt-1 block">
                      {selectedCustomer.overdue_status === 'healthy' ? 'Good Standing' : 'Overdue Alert'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-medium mt-0.5 block">Wholesale Khata</span>
                  </div>
                </div>

                {/* Credit Limit Utilization Bar */}
                <div className="mt-5 pt-4 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-neutral-700">
                      Credit Limit Utilization ({formatCurrency(selectedCustomer.outstanding || 0)} / {formatCurrency(selectedCustomer.credit_limit || 0)})
                    </span>
                    <span className="font-bold text-neutral-900">
                      {(selectedCustomer.credit_limit && selectedCustomer.credit_limit > 0) ? Math.min(100, Math.round(((selectedCustomer.outstanding || 0) / selectedCustomer.credit_limit) * 100)) : 0}% Utilized
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all duration-500"
                      style={{
                        width: `${(selectedCustomer.credit_limit && selectedCustomer.credit_limit > 0) ? Math.min(100, Math.round(((selectedCustomer.outstanding || 0) / selectedCustomer.credit_limit) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Purchase History & Bills Card */}
              <div className="floating-card p-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div>
                    <h3 className="text-base font-bold text-neutral-900 tracking-tight">
                      Purchase History & Bills
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Complete record of invoices, items shipped & settlement logs
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                      All Time
                    </span>
                    <button
                      type="button"
                      onClick={handleExportStatement}
                      className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 px-3 py-1.5 rounded-full hover:bg-neutral-100 transition-colors"
                    >
                      Download All
                    </button>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="mt-4 divide-y divide-neutral-100">
                  {ledgerLoading ? (
                    <div className="flex items-center justify-center py-10 text-neutral-400 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-xs">Loading ledger invoices...</span>
                    </div>
                  ) : customerSales.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-400">
                      No invoices recorded yet for this buyer.
                    </div>
                  ) : (
                    customerSales.map((sale) => {
                      const isUnpaid = sale.status === 'Unpaid';
                      const itemsText = sale.items && sale.items.length > 0
                        ? `${sale.items.reduce((sum, i) => sum + i.quantity, 0)} Pcs • ${sale.items.map(i => `${i.sku} (${i.quantity})`).join(', ')}`
                        : (sale.subtotal ? `Total: ${formatCurrency(sale.subtotal)}` : 'Wholesale shipment');

                      return (
                        <div key={sale.invoice_id} className="py-4 flex items-center justify-between gap-4 group">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-sm text-neutral-900">
                                #{sale.invoice_number}
                              </span>
                              {isUnpaid ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                                  Unpaid - Due in 15d
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Paid (Bank NEFT)
                                </span>
                              )}
                              <span className="text-xs text-neutral-400">
                                {sale.date || 'Recent'}
                              </span>
                            </div>

                            <p className="text-xs text-neutral-500 mt-1 font-medium">
                              {itemsText}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-2">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(sale)}
                                className="font-semibold text-neutral-700 hover:text-neutral-900 underline underline-offset-2"
                              >
                                View Bill
                              </button>
                              <span>•</span>
                              <span className="hover:text-neutral-700 cursor-pointer">Dispatch Memo</span>
                              {!isUnpaid && (
                                <>
                                  <span>•</span>
                                  <span className="text-neutral-400">Settled in full</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-bold text-neutral-900">
                              {formatCurrency(sale.total)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RECENT PAYMENT & CREDIT LEDGER NOTES */}
              <div className="floating-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
                  RECENT PAYMENT & CREDIT LEDGER NOTES
                </h3>

                <div className="space-y-3">
                  {customerPayments.length === 0 ? (
                    <div className="text-xs text-neutral-400 py-4 text-center">
                      No payments recorded yet. Click "Record Payment" to log settlements.
                    </div>
                  ) : (
                    customerPayments.map((pay) => (
                      <div
                        key={pay.payment_id}
                        className="p-3.5 rounded-2xl bg-neutral-50/70 border border-neutral-100 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div className="text-xs font-medium text-neutral-800">
                            <span>{pay.date} • {pay.method} Payment received</span>
                            {pay.reference && (
                              <span className="text-neutral-400 ml-1 font-mono text-[11px]">(Ref #{pay.reference})</span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          + {formatCurrency(pay.amount)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="floating-card p-12 text-center text-neutral-400">
              Select a customer from the left directory to view ledger and invoices.
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      <RecordPaymentModal
        customer={selectedCustomer}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentRecorded={handlePaymentRecorded}
      />

      <ViewInvoiceModal
        invoice={selectedInvoice}
        customer={selectedCustomer}
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
      />
    </AppShell>
  );
}
