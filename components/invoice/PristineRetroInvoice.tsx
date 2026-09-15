'use client';

import React from 'react';
import { Sale, Customer } from '@/lib/types';
import { numberToIndianRupees } from '@/lib/numberToWords';

interface PristineRetroInvoiceProps {
  invoice: Sale;
  customer?: Customer | null;
}

export default function PristineRetroInvoice({ invoice, customer }: PristineRetroInvoiceProps) {
  // Format date to DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const invoiceNum = invoice.invoice_number?.replace(/^INV-/, '') || '210';
  const totalQty = invoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subTotal = invoice.subtotal || invoice.total;
  const grandTotal = invoice.total;
  const isPaid = invoice.status === 'Paid';
  const receivedAmount = isPaid ? grandTotal : 0;
  const balanceAmount = grandTotal - receivedAmount;
  const amountInWords = numberToIndianRupees(grandTotal);

  return (
    <div className="bg-white text-black p-8 max-w-3xl mx-auto font-sans leading-normal select-text print:p-0 print:max-w-none print:shadow-none border border-neutral-200/80 rounded-2xl shadow-sm">
      {/* Header Section */}
      <div className="flex items-start justify-between pb-3">
        {/* Company Info (Left) */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 uppercase">
            PRESTON RETRO ENTERPRISE
          </h1>
          <div className="text-xs text-neutral-800 space-y-0.5 mt-1 font-medium">
            <p>Hussain tekri, Palanpur highway, Kanodar, Gujarat</p>
            <p>Phone no.: 8758206574</p>
            <p>Email: Pp321753@gmail.com</p>
            <p className="font-semibold">GSTIN: 24ABIFP5127C1ZJ</p>
            <p>State: 24-Gujarat</p>
          </div>
        </div>

        {/* Vintage Seal Stamp Logo (Right) */}
        <div className="w-20 h-20 rounded-full border-2 border-neutral-900 flex flex-col items-center justify-center text-center p-1 flex-shrink-0 relative">
          <span className="text-[7px] font-bold uppercase tracking-wider text-neutral-800 leading-tight">
            PRESTON RETRO ENTERPRISE
          </span>
          {/* Sewing Machine Icon Representation */}
          <div className="my-0.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-neutral-900 stroke-[1.8]">
              <path d="M4 19h16M4 15h12a3 3 0 003-3V7H7v4M7 7V5h6v2M16 11v4" />
              <circle cx="16" cy="11" r="1.5" />
            </svg>
          </div>
          <span className="text-[6px] font-bold italic text-neutral-600">
            "Wear The Best, Feel The Best"
          </span>
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

        <div className="text-right">
          <span className="font-bold text-neutral-900 block mb-1 text-[13px]">Invoice Details</span>
          <p className="text-neutral-800 font-medium">Invoice No.: {invoiceNum}</p>
          <p className="text-neutral-800 font-medium mt-0.5">Date: {formatDate(invoice.date)}</p>
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
                <td className="py-2.5 px-2 text-center text-neutral-500">1</td>
                <td className="py-2.5 px-3 font-medium text-neutral-900">Garment Batch Lot</td>
                <td className="py-2.5 px-3 text-center text-neutral-400">6203</td>
                <td className="py-2.5 px-3 text-center font-medium">1</td>
                <td className="py-2.5 px-3 text-center text-neutral-600">Pcs</td>
                <td className="py-2.5 px-3 text-right">₹ {grandTotal.toFixed(1)}</td>
                <td className="py-2.5 px-3 text-right font-medium">₹ {grandTotal.toFixed(1)}</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-b-2 border-neutral-300 font-bold text-neutral-900">
              <td colSpan={2} className="py-2 px-3">Total</td>
              <td className="py-2 px-3"></td>
              <td className="py-2 px-3 text-center">{totalQty || 1}</td>
              <td colSpan={2}></td>
              <td className="py-2 px-3 text-right">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Section (2 Columns) */}
      <div className="grid grid-cols-2 gap-8 pt-3 text-xs">
        {/* Left: Words & Terms */}
        <div className="space-y-4">
          <div>
            <span className="font-bold text-neutral-900 block mb-1">Invoice Amount In Words</span>
            <p className="italic text-neutral-700 font-serif capitalize">
              {amountInWords}
            </p>
          </div>

          <div className="pt-2">
            <span className="font-bold text-neutral-900 block mb-1">Terms And Conditions</span>
            <p className="text-neutral-700">Thank you for doing business with us.</p>
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
              For: PRESTON RETRO ENTERPRISE
            </p>
            <div className="h-12" /> {/* Space for signature stamp */}
            <p className="text-xs font-bold text-neutral-900 border-t border-neutral-300 pt-1 inline-block min-w-[160px] text-center">
              Authorized Signatory
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
