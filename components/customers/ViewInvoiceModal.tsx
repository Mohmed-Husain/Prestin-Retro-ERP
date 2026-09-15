'use client';

import React, { useState, useEffect } from 'react';
import { X, Printer, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { Sale, Customer } from '@/lib/types';
import PristineRetroInvoice, { InvoiceCustomization } from '@/components/invoice/PristineRetroInvoice';
import { toast } from 'sonner';

interface ViewInvoiceModalProps {
  invoice: Sale | null;
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_CUSTOMIZATION: InvoiceCustomization = {
  companyName: 'PRISTINE RETRO ENTERPRISE',
  companyAddress: 'Hussain tekri, Palanpur highway, Kanodar, Gujarat',
  companyPhone: '8758206574',
  companyEmail: 'Pp321753@gmail.com',
  companyGst: '24ABIFP5127C1ZJ',
  companyState: '24-Gujarat',
  transportCarrier: '',
  vehicleNo: '',
  poNumber: '',
  destination: '',
  termsAndConditions: '1. Goods once sold will not be taken back.\n2. Subject to Gujarat jurisdiction.\n3. Thank you for doing business with us.',
  notes: '',
  showBankDetails: false,
  bankName: 'HDFC Bank',
  accountNumber: '',
  ifscCode: '',
  branchName: 'Kanodar',
  signatoryTitle: 'Authorized Signatory',
};

export default function ViewInvoiceModal({ invoice, customer, isOpen, onClose }: ViewInvoiceModalProps) {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customization, setCustomization] = useState<InvoiceCustomization>(DEFAULT_CUSTOMIZATION);

  // Load saved default customization if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pristine_invoice_customization');
      if (saved) {
        setCustomization({ ...DEFAULT_CUSTOMIZATION, ...JSON.parse(saved) });
      }
    } catch (e) {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSaveAsDefault = () => {
    try {
      localStorage.setItem('pristine_invoice_customization', JSON.stringify(customization));
      toast.success('Invoice template saved as default for future prints!');
    } catch (e) {
      toast.error('Could not save template preferences');
    }
  };

  const handleResetDefaults = () => {
    setCustomization(DEFAULT_CUSTOMIZATION);
    localStorage.removeItem('pristine_invoice_customization');
    toast.info('Reset invoice customizations to factory default.');
  };

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
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                showCustomizer ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCustomizer ? 'Close Customizer' : 'Customize PDF'}</span>
            </button>

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

        {/* Live Invoice Customization Panel (Hidden in print) */}
        {showCustomizer && (
          <div className="mb-6 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 text-xs space-y-4 print:hidden animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
              <span className="font-bold text-neutral-900">
                Live PDF Customizer • Add Vehicle, Bank Details & Custom Terms
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveAsDefault}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold hover:bg-emerald-700 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  <span>Save as Default</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-neutral-200 text-neutral-600 text-[11px] font-semibold hover:bg-neutral-100"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Vehicle / Transport No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. GJ-01-AB-1234"
                  value={customization.vehicleNo || ''}
                  onChange={(e) => setCustomization({ ...customization, vehicleNo: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Transport / Carrier Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat Roadways"
                  value={customization.transportCarrier || ''}
                  onChange={(e) => setCustomization({ ...customization, transportCarrier: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Buyer PO Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-8910"
                  value={customization.poNumber || ''}
                  onChange={(e) => setCustomization({ ...customization, poNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white font-mono"
                />
              </div>
            </div>

            {/* Bank Details Toggle & Inputs */}
            <div className="p-3 rounded-xl bg-white border border-neutral-200 space-y-2.5">
              <label className="flex items-center gap-2 font-semibold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={customization.showBankDetails || false}
                  onChange={(e) => setCustomization({ ...customization, showBankDetails: e.target.checked })}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4"
                />
                <span>Include Bank Account Details on Invoice</span>
              </label>

              {customization.showBankDetails && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      value={customization.bankName || ''}
                      onChange={(e) => setCustomization({ ...customization, bankName: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-neutral-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-0.5">A/C Number</label>
                    <input
                      type="text"
                      value={customization.accountNumber || ''}
                      onChange={(e) => setCustomization({ ...customization, accountNumber: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-neutral-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-0.5">IFSC Code</label>
                    <input
                      type="text"
                      value={customization.ifscCode || ''}
                      onChange={(e) => setCustomization({ ...customization, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full px-2 py-1 rounded-lg border border-neutral-200 font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-0.5">Branch</label>
                    <input
                      type="text"
                      value={customization.branchName || ''}
                      onChange={(e) => setCustomization({ ...customization, branchName: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-neutral-200"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  rows={2}
                  value={customization.termsAndConditions || ''}
                  onChange={(e) => setCustomization({ ...customization, termsAndConditions: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Special Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional delivery notes..."
                  value={customization.notes || ''}
                  onChange={(e) => setCustomization({ ...customization, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* The Exact Pristine Retro Enterprise Tax Invoice with Live Customization */}
        <div className="print:m-0">
          <PristineRetroInvoice
            invoice={invoice}
            customer={customer}
            customization={customization}
          />
        </div>
      </div>
    </div>
  );
}
