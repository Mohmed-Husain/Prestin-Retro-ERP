'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Loader2, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { Customer, Payment } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface RecordPaymentModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: (payment: Payment) => void;
}

export default function RecordPaymentModal({ customer, isOpen, onClose, onPaymentRecorded }: RecordPaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(customer?.outstanding && customer.outstanding > 0 ? customer.outstanding : 0);
  const [method, setMethod] = useState('Bank NEFT');
  const [reference, setReference] = useState('NEFT' + Math.floor(1000000 + Math.random() * 9000000));
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('Bank NEFT Payment received');

  React.useEffect(() => {
    if (customer?.outstanding && customer.outstanding > 0) {
      setAmount(customer.outstanding);
    } else {
      setAmount(0);
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customer.customer_id,
          amount,
          method,
          reference,
          date,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to record payment');
      }

      toast.success(`Payment of ${formatCurrency(amount)} recorded in Google Sheets Khata!`);
      onPaymentRecorded(data.payment);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-md p-7 shadow-2xl border border-neutral-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Record Payment Received</h3>
            <p className="text-xs text-neutral-400 mt-0.5">{customer.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Outstanding Balance Pill */}
        <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Current Outstanding</span>
            <span className="text-xl font-bold text-neutral-900">
              {formatCurrency(customer.outstanding || 0)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-medium">Credit Limit</span>
            <span className="text-xs font-semibold text-neutral-700">
              {formatCurrency(customer.credit_limit)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Payment Amount (₹) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 font-bold">
                ₹
              </div>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-base font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white"
              >
                <option value="Bank NEFT">Bank NEFT</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Factory Cash Counter</option>
                <option value="Cheque">Cheque</option>
                <option value="Bank Transfer">Bank Transfer (IMPS/RTGS)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Settlement Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Txn / Cheque Reference *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ref #NEFT9812401 or Cheque #10294"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Part payment received against May bills"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-medium hover:bg-black transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Logging Payment...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Save Payment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
