'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, CheckCircle2, Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Customer, Product, Sale } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: (sale: Sale) => void;
  customers: Customer[];
  products: Product[];
}

interface InvoiceLineItem {
  product_id: string;
  sku: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  max_stock: number;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  onInvoiceCreated,
  customers,
  products,
}: CreateInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Unpaid' | 'Paid' | 'Draft'>('Unpaid');
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [gstEnabled, setGstEnabled] = useState<boolean>(true);
  const [gstRate, setGstRate] = useState<number>(5);

  // Initialize with first customer and first in-stock product
  useEffect(() => {
    if (isOpen) {
      if (customers.length > 0 && !customerId) {
        setCustomerId(customers[0].customer_id);
      }
      if (lineItems.length === 0 && products.length > 0) {
        const availableProd = products.find(p => p.stock > 0) || products[0];
        setLineItems([
          {
            product_id: availableProd.product_id,
            sku: availableProd.sku,
            product_name: availableProd.product_name,
            quantity: Math.min(10, availableProd.stock > 0 ? availableProd.stock : 1),
            cost_price: availableProd.cost_price,
            selling_price: availableProd.selling_price,
            max_stock: availableProd.stock,
          },
        ]);
      }
    }
  }, [isOpen, customers, products]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.customer_id === customerId) || null;
  }, [customers, customerId]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  }, [lineItems]);

  const gst = useMemo(() => {
    if (!gstEnabled) return 0;
    return Math.round(subtotal * (gstRate / 100));
  }, [subtotal, gstEnabled, gstRate]);

  const grandTotal = subtotal + gst;

  // Validation
  const stockErrors = useMemo(() => {
    const errors: Record<number, string> = {};
    lineItems.forEach((item, index) => {
      const prod = products.find(p => p.product_id === item.product_id);
      const available = prod ? prod.stock : item.max_stock;
      if (item.quantity > available) {
        errors[index] = `Only ${available} Pcs available in warehouse`;
      }
      if (item.quantity <= 0) {
        errors[index] = `Quantity must be greater than 0`;
      }
    });
    return errors;
  }, [lineItems, products]);

  const hasErrors = Object.keys(stockErrors).length > 0;

  if (!isOpen) return null;

  const handleAddItem = () => {
    const availableProd = products.find(p => p.stock > 0 && !lineItems.some(item => item.product_id === p.product_id)) || products[0];
    if (!availableProd) {
      toast.error('No more garments available to add');
      return;
    }
    setLineItems(prev => [
      ...prev,
      {
        product_id: availableProd.product_id,
        sku: availableProd.sku,
        product_name: availableProd.product_name,
        quantity: Math.min(5, availableProd.stock > 0 ? availableProd.stock : 1),
        cost_price: availableProd.cost_price,
        selling_price: availableProd.selling_price,
        max_stock: availableProd.stock,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length === 1) {
      toast.error('Invoice must contain at least 1 line item');
      return;
    }
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, newProductId: string) => {
    const prod = products.find(p => p.product_id === newProductId);
    if (!prod) return;

    setLineItems(prev => {
      const copy = [...prev];
      copy[index] = {
        product_id: prod.product_id,
        sku: prod.sku,
        product_name: prod.product_name,
        quantity: Math.min(copy[index].quantity || 5, prod.stock > 0 ? prod.stock : 1),
        cost_price: prod.cost_price,
        selling_price: prod.selling_price,
        max_stock: prod.stock,
      };
      return copy;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setLineItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantity: qty };
      return copy;
    });
  };

  const handleRateChange = (index: number, rate: number) => {
    setLineItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], selling_price: rate };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Please select a wholesale buyer');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Add at least one garment line item');
      return;
    }
    if (hasErrors) {
      toast.error('Please resolve stock validation warnings');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customer_id: customerId,
        date,
        subtotal,
        gst,
        total: grandTotal,
        status,
        items: lineItems.map(item => ({
          product_id: item.product_id,
          sku: item.sku,
          quantity: Number(item.quantity),
          cost_price: Number(item.cost_price),
          selling_price: Number(item.selling_price),
        })),
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      toast.success(`Invoice #${data.sale.invoice_number} created & stock deducted!`);
      onInvoiceCreated(data.sale);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error generating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-2xl p-7 shadow-2xl border border-neutral-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">
              Create Dispatch Invoice & Bill
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Auto-numbers invoice, deducts warehouse stock & updates buyer Khata
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Customer & Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="md:col-span-2">
              <label className="block font-semibold text-neutral-700 mb-1">
                Wholesale Buyer Account *
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white font-medium"
              >
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name} ({c.tier || 'Wholesale'} • Outstanding: {formatCurrency(c.outstanding || 0)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Dispatch Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-neutral-800 text-xs uppercase tracking-wider">
                Garment Line Items & Stock Check
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] font-semibold text-neutral-900 hover:text-black py-1 px-3 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Add Garment Lot</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => {
                const prod = products.find(p => p.product_id === item.product_id);
                const currentStock = prod ? prod.stock : item.max_stock;
                const error = stockErrors[index];

                return (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl border border-neutral-200/80 bg-white space-y-2.5 hover:border-neutral-300 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      {/* Product Selector (6 cols) */}
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-[10px] text-neutral-400 font-semibold mb-0.5">
                          Garment SKU / Style
                        </label>
                        <select
                          value={item.product_id}
                          onChange={(e) => handleProductChange(index, e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white text-xs font-semibold"
                        >
                          {products.map((p) => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.sku} — {p.product_name} ({p.stock} Pcs in stock)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity (2 cols) */}
                      <div className="col-span-4 sm:col-span-2">
                        <label className="block text-[10px] text-neutral-400 font-semibold mb-0.5">
                          Quantity (Pcs)
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                          className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-xs font-bold text-center ${
                            error ? 'border-rose-400 bg-rose-50/50 text-rose-700' : 'border-neutral-200'
                          }`}
                        />
                      </div>

                      {/* Selling Rate (3 cols) */}
                      <div className="col-span-6 sm:col-span-3">
                        <label className="block text-[10px] text-neutral-400 font-semibold mb-0.5">
                          Unit Rate (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.selling_price}
                          onChange={(e) => handleRateChange(index, Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-xs font-bold text-right"
                        />
                      </div>

                      {/* Delete Button (1 col) */}
                      <div className="col-span-2 sm:col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove line item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Stock Validation Pill / Line Total */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <div>
                        {error ? (
                          <span className="flex items-center gap-1 text-rose-600 font-semibold">
                            <AlertCircle className="w-3 h-3" />
                            <span>{error}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">
                            ✓ {currentStock} Pcs ready in warehouse (Lot OK)
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-neutral-900">
                        Total: {formatCurrency(item.selling_price * item.quantity)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GST Calculation & Payment Terms Box */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 mt-4 space-y-4">
            {/* GST Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/60">
              <div>
                <label className="block font-semibold text-neutral-800 text-xs">GST Applicable</label>
                <p className="text-[11px] text-neutral-400">Toggle whether this invoice includes Goods & Services Tax</p>
              </div>

              <div className="flex items-center gap-3">
                {/* GST Toggle */}
                <div className="flex items-center p-0.5 bg-neutral-200/80 rounded-full">
                  <button
                    type="button"
                    onClick={() => setGstEnabled(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      !gstEnabled ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    No (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstEnabled(true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                      gstEnabled ? 'bg-neutral-900 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Yes (GST)
                  </button>
                </div>

                {/* GST Rate Selector */}
                {gstEnabled && (
                  <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-xl p-1 text-xs font-medium">
                    {[0, 5, 12, 18, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setGstRate(rate)}
                        className={`px-2 py-0.5 rounded-lg transition-all font-mono ${
                          gstRate === rate ? 'bg-neutral-900 text-white font-bold' : 'text-neutral-600 hover:bg-neutral-100'
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Billing Settlement Status & Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1.5">Payment Terms</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('Unpaid')}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      status === 'Unpaid'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Unpaid
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Paid')}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      status === 'Paid'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('Draft')}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${
                      status === 'Draft'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    Draft
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 mt-2">
                  {status === 'Unpaid'
                    ? `Adds ${formatCurrency(grandTotal)} to ${selectedCustomer?.name || 'buyer'}'s ledger balance.`
                    : status === 'Draft'
                    ? 'Saves invoice without marking as active dispatch.'
                    : 'Marks invoice as settled immediately.'}
                </p>
              </div>

              {/* Calculations Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal (Σ price × qty)</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>GST ({gstEnabled ? `${gstRate}%` : '0% Exempt'})</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(gst)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200/80">
                  <span>Grand Total</span>
                  <span className="text-base text-neutral-900">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
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
              type="button"
              onClick={(e) => {
                setStatus('Draft');
                // Allow state update then submit
                setTimeout(() => {
                  const form = (e.target as HTMLElement).closest('form');
                  if (form) form.requestSubmit();
                }, 50);
              }}
              disabled={loading || hasErrors}
              className="px-4 py-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 font-semibold hover:bg-neutral-50 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-black transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Generating & Deducting Stock...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  {status === 'Draft' ? 'Save Draft' : 'Generate Invoice & Dispatch'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
