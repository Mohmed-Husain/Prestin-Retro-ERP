'use client';

import React from 'react';
import { Sale, Customer } from '@/lib/types';
import { numberToIndianRupees } from '@/lib/numberToWords';

export interface InvoiceCustomization {
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyGst?: string;
  companyState?: string;
  transportCarrier?: string;
  vehicleNo?: string;
  poNumber?: string;
  destination?: string;
  termsAndConditions?: string;
  notes?: string;
  showBankDetails?: boolean;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchName?: string;
  signatoryTitle?: string;
}

interface PristineRetroInvoiceProps {
  invoice: Sale;
  customer?: Customer | null;
  customization?: InvoiceCustomization;
}

export default function PristineRetroInvoice({ invoice, customer, customization }: PristineRetroInvoiceProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const invoiceNum = invoice.invoice_number?.replace(/^INV-/, '') || invoice.invoice_id || '—';
  const totalQty = invoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subTotal = invoice.subtotal || invoice.total;
  const grandTotal = invoice.total;
  const isPaid = invoice.status === 'Paid';
  const receivedAmount = invoice.amount_paid !== undefined
    ? invoice.amount_paid
    : (isPaid ? grandTotal : 0);
  const balanceAmount = Math.max(0, grandTotal - receivedAmount);
  const amountInWords = numberToIndianRupees(grandTotal);

  // Customization Overrides
  const companyName = customization?.companyName || 'PRISTINE RETRO ENTERPRISE';
  const companyAddress = customization?.companyAddress || 'Hussain tekri, Palanpur highway, Kanodar, Gujarat';
  const companyPhone = customization?.companyPhone || '8758206574';
  const companyEmail = customization?.companyEmail || 'Pp321753@gmail.com';
  const companyGst = customization?.companyGst || '24ABIFP5127C1ZJ';
  const companyState = customization?.companyState || '24-Gujarat';
  const signatoryTitle = customization?.signatoryTitle || 'Authorized Signatory';
  const termsText = customization?.termsAndConditions || 'Thank you for doing business with us.';

  return (
    <div className="bg-white text-black p-8 max-w-3xl mx-auto font-sans leading-normal select-text print:p-0 print:max-w-none print:shadow-none border border-neutral-200/80 rounded-2xl shadow-sm">
      {/* Header Section */}
      <div className="flex items-start justify-between pb-3">
        {/* Company Info (Left) */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 uppercase">
            {companyName}
          </h1>
          <div className="text-xs text-neutral-800 space-y-0.5 mt-1 font-medium">
            <p>{companyAddress}</p>
            <p>Phone no.: {companyPhone}</p>
            <p>Email: {companyEmail}</p>
            <p className="font-semibold">GSTIN: {companyGst}</p>
            <p>State: {companyState}</p>
          </div>
        </div>

        {/* Official Seal Stamp Logo (Right) */}
        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center p-0.5 border border-neutral-200 shadow-xs flex-shrink-0">
          <img
            src="/logo.jpg"
            alt="Pristine Retro Enterprise Logo"
            className="w-full h-full object-contain rounded-full"
          />
        </div>
      </div>

      {/* Purple Accent Divider */}
      <div className="w-full h-1 bg-[#818cf8] mt-1" />

      {/* Tax Invoice Heading */}
      <div className="text-center py-3">
        <h2 className="text-xl font-bold text-[#818cf8] tracking-wide font-serif">
          Tax Invoice
        </h2>
      </div>

      {/* Bill To & Invoice Details Row */}
      <div className="flex justify-between items-start text-xs pt-1 pb-4">
        <div>
          <span className="font-bold text-neutral-900 block mb-1 text-[13px]">Bill To</span>
          <p className="font-medium text-neutral-800 capitalize">
            {customer?.tier ? `( ${customer.tier.toLowerCase()} ) ` : '( wholesale ) '}
            {customer?.name || invoice.customer_name}
          </p>
          {customer?.address && (
            <p className="text-neutral-500 text-[11px] mt-0.5">{customer.address}</p>
          )}
          {customer?.gst && (
            <p className="font-mono text-[11px] text-neutral-600 mt-0.5">GSTIN: {customer.gst}</p>
          )}
        </div>

        <div className="text-right space-y-0.5">
          <span className="font-bold text-neutral-900 block mb-1 text-[13px]">Invoice Details</span>
          <p className="text-neutral-800 font-medium">Invoice No.: {invoiceNum}</p>
          <p className="text-neutral-800 font-medium">Date: {formatDate(invoice.date)}</p>
          {customization?.poNumber && (
            <p className="text-neutral-600 font-mono text-[11px]">PO No: {customization.poNumber}</p>
          )}
          {customization?.vehicleNo && (
            <p className="text-neutral-600 font-mono text-[11px]">Vehicle: {customization.vehicleNo}</p>
          )}
          {customization?.transportCarrier && (
            <p className="text-neutral-600 text-[11px]">Transport: {customization.transportCarrier}</p>
          )}
        </div>
      </div>

      {/* Items Table with Purple Header */}
      <div className="overflow-hidden mb-3">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#818cf8] text-white font-semibold">
              <th className="py-2 px-2 text-center w-8 border-r border-[#6366f1]/40">#</th>
              <th className="py-2 px-3 border-r border-[#6366f1]/40">Item Name</th>
              <th className="py-2 px-3 text-center border-r border-[#6366f1]/40">HSN/ SAC</th>
              <th className="py-2 px-3 text-center border-r border-[#6366f1]/40">Quantity</th>
              <th className="py-2 px-3 text-center border-r border-[#6366f1]/40">Unit</th>
              <th className="py-2 px-3 text-right border-r border-[#6366f1]/40">Price/ Unit</th>
              <th className="py-2 px-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-800">
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, index) => (
                <tr key={item.item_id || index} className="hover:bg-neutral-50/50">
                  <td className="py-2.5 px-2 text-center text-neutral-500">{index + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-neutral-900">
                    {item.product_name || item.sku}
                  </td>
                  <td className="py-2.5 px-3 text-center text-neutral-400 font-mono text-[11px]">
                    6203
                  </td>
                  <td className="py-2.5 px-3 text-center font-medium">{item.quantity}</td>
                  <td className="py-2.5 px-3 text-center text-neutral-600">Pcs</td>
                  <td className="py-2.5 px-3 text-right">₹ {item.selling_price.toFixed(1)}</td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    ₹ {(item.selling_price * item.quantity).toFixed(1)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-neutral-400 text-xs italic">
                  No line items on this invoice
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-b-2 border-neutral-300 font-bold text-neutral-900">
              <td colSpan={2} className="py-2 px-3">Total</td>
              <td className="py-2 px-3"></td>
              <td className="py-2 px-3 text-center">{totalQty}</td>
              <td colSpan={2}></td>
              <td className="py-2 px-3 text-right">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Section (2 Columns) */}
      <div className="grid grid-cols-2 gap-8 pt-3 text-xs">
        {/* Left: Words & Terms & Optional Bank Details */}
        <div className="space-y-4">
          <div>
            <span className="font-bold text-neutral-900 block mb-1">Invoice Amount In Words</span>
            <p className="italic text-neutral-700 font-serif capitalize">
              {amountInWords}
            </p>
          </div>

          {/* Optional Bank Details Box */}
          {customization?.showBankDetails && (
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] space-y-0.5">
              <span className="font-bold text-neutral-900 block mb-1">Bank Payment Details:</span>
              <p><span className="text-neutral-500">Bank:</span> <span className="font-semibold">{customization.bankName || 'HDFC Bank'}</span></p>
              <p><span className="text-neutral-500">A/C No:</span> <span className="font-mono font-bold">{customization.accountNumber || '50200084920194'}</span></p>
              <p><span className="text-neutral-500">IFSC:</span> <span className="font-mono">{customization.ifscCode || 'HDFC0000241'}</span></p>
              {customization.branchName && (
                <p><span className="text-neutral-500">Branch:</span> <span>{customization.branchName}</span></p>
              )}
            </div>
          )}

          {customization?.notes && (
            <div>
              <span className="font-bold text-neutral-900 block mb-0.5">Notes</span>
              <p className="text-neutral-600">{customization.notes}</p>
            </div>
          )}

          <div className="pt-1">
            <span className="font-bold text-neutral-900 block mb-1">Terms And Conditions</span>
            <p className="text-neutral-700 whitespace-pre-line">{termsText}</p>
          </div>
        </div>

        {/* Right: Calculations & Signature */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-neutral-800 font-medium px-2 py-0.5">
            <span>Sub Total</span>
            <span>₹ {subTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
          </div>

          {invoice.gst > 0 && (
            <div className="flex justify-between text-neutral-600 px-2 py-0.5">
              <span>GST (Tax)</span>
              <span>₹ {invoice.gst.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
            </div>
          )}

          {/* Purple Total Highlight Bar */}
          <div className="flex justify-between font-bold bg-[#818cf8] text-white px-3 py-1.5 rounded-sm">
            <span>Total</span>
            <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
          </div>

          <div className="flex justify-between text-neutral-700 px-2 py-0.5">
            <span>Received</span>
            <span>₹ {receivedAmount.toFixed(1)}</span>
          </div>

          <div className="flex justify-between font-semibold text-neutral-900 border-t border-neutral-300 px-2 pt-1">
            <span>Balance</span>
            <span>₹ {balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
          </div>

          {/* Signature Block */}
          <div className="pt-8 text-center sm:text-right">
            <p className="text-[11px] font-bold text-neutral-900">
              For: {companyName}
            </p>
            <div className="h-12" />
            <p className="text-xs font-bold text-neutral-900 border-t border-neutral-300 pt-1 inline-block min-w-[160px] text-center">
              {signatoryTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
