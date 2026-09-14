'use client';

import React from 'react';
import { X, Printer } from 'lucide-react';
import { Sale, Customer } from '@/lib/types';
import PristineRetroInvoice from '@/components/invoice/PristineRetroInvoice';

interface ViewInvoiceModalProps {
  invoice: Sale | null;
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewInvoiceModal({ invoice, customer, isOpen, onClose }: ViewInvoiceModalProps) {
  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-[28px] w-full max-w-4xl p-6 shadow-2xl border border-neutral-100 relative max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:p-0">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-100 print:hidden">
          <div className="text-xs text-neutral-500 font-medium">
            Invoice Preview • #{invoice.invoice_number}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Exact Pristine Retro Enterprise Tax Invoice */}
        <div className="print:m-0">
          <PristineRetroInvoice invoice={invoice} customer={customer} />
        </div>
      </div>
    </div>
  );
}
