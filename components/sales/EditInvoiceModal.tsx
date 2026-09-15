'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Save, ShoppingCart, AlertCircle, Percent } from 'lucide-react';
import { Sale, Customer, Product, SaleItem } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { toast } from 'sonner';

interface EditInvoiceModalProps {
  invoice: Sale | null;
  customers: Customer[];
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onInvoiceUpdated: (updated: Sale) => void;
}

export default function EditInvoiceModal({
  invoice,
  customers,
  products,
  isOpen,
  onClose,
  onInvoiceUpdated,
}: EditInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Paid' | 'Unpaid' | 'Dispatched' | 'Partial'>('Unpaid');
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstRate, setGstRate] = useState<number>(5);

  const [lineItems, setLineItems] = useState<{
    product_id: string;
    sku: string;
    product_name: string;
    quantity: number;
    selling_price: number;
    cost_price: number;
  }[]>([]);

  useEffect(() => {
    if (invoice) {
      setCustomerId(invoice.customer_id || '');
      setDate(invoice.date || new Date().toISOString().split('T')[0]);
      setStatus(invoice.status || 'Unpaid');
      setGstEnabled(invoice.gst > 0);

      // Estimate rate if gst present
      if (invoice.gst > 0 && invoice.subtotal > 0) {
        const estRate = Math.round((invoice.gst / invoice.subtotal) * 100);
        setGstRate(estRate || 5);
      }

      if (invoice.items && invoice.items.length > 0) {
        setLineItems(
          invoice.items.map(i => ({
            product_id: i.product_id,
            sku: i.sku,
            product_name: i.product_name || i.sku,
            quantity: i.quantity,
            selling_price: i.selling_price,
            cost_price: i.cost_price || 0,
          }))
        );
      } else {
        setLineItems([]);
      }
    }
  }, [invoice]);

  const subtotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);
  }, [lineItems]);

  const calculatedGst = useMemo(() => {
    if (!gstEnabled) return 0;
    return Math.round((subtotal * gstRate) / 100);
  }, [subtotal, gstEnabled, gstRate]);

  const grandTotal = useMemo(() => {
    return subtotal + calculatedGst;
  }, [subtotal, calculatedGst]);

  if (!isOpen || !invoice) return null;

  const handleAddItem = () => {
    if (products.length === 0) return;
    const first = products[0];
    setLineItems([
      ...lineItems,
      {
        product_id: first.product_id,
        sku: first.sku,
        product_name: first.product_name,
        quantity: 1,
        selling_price: first.selling_price,
        cost_price: first.cost_price,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find(p => p.product_id === productId);
    if (!prod) return;
    const copy = [...lineItems];
    copy[index] = {
      product_id: prod.product_id,
      sku: prod.sku,
      product_name: prod.product_name,
      quantity: 1,
      selling_price: prod.selling_price,
      cost_price: prod.cost_price,
    };
    setLineItems(copy);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const copy = [...lineItems];
    copy[index].quantity = Math.max(1, qty);
    setLineItems(copy);
  };

  const handlePriceChange = (index: number, price: number) => {
    const copy = [...lineItems];
    copy[index].selling_price = Math.max(0, price);
    setLineItems(copy);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.length === 0) {
      toast.error('At least one item is required on invoice');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/${invoice.invoice_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          date,
          status,
          subtotal,
          gst: calculatedGst,
          total: grandTotal,
          items: lineItems.map(i => ({
            product_id: i.product_id,
            sku: i.sku,
            product_name: i.product_name,
            quantity: i.quantity,
            cost_price: i.cost_price,
            selling_price: i.selling_price,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update invoice');
      }

      toast.success(`Invoice #${invoice.invoice_number} updated successfully!`);
      onInvoiceUpdated(data.sale);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error updating invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-3xl p-6 shadow-2xl border border-neutral-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Edit Invoice #{invoice.invoice_number}
              </h2>
              <p className="text-xs text-neutral-400">
                Modify line items, quantities, pricing, GST & settlement status
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Wholesale Buyer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-medium text-neutral-800"
              >
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Invoice Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-semibold"
              >
                <option value="Unpaid">Unpaid (Khata Due)</option>
                <option value="Paid">Paid (Settled)</option>
                <option value="Partial">Partial Payment</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">Garment Line Items</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-semibold hover:bg-black transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-neutral-200"
                >
                  <div className="col-span-5">
                    <select
                      value={item.product_id}
                      onChange={(e) => handleProductChange(idx, e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-800 font-medium text-xs"
                    >
                      {products.map(p => (
                        <option key={p.product_id} value={p.product_id}>
                          {p.product_name} ({p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 text-center font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="Rate ₹"
                      value={item.selling_price}
                      onChange={(e) => handlePriceChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 rounded-lg border border-neutral-200 text-right font-medium"
                    />
                  </div>

                  <div className="col-span-2 text-right font-bold text-neutral-900">
                    {formatCurrency(item.quantity * item.selling_price)}
                  </div>

                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GST Controls & Summary */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 font-semibold text-neutral-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gstEnabled}
                  onChange={(e) => setGstEnabled(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-0 w-4 h-4"
                />
                <span>Apply GST Tax</span>
              </label>

              {gstEnabled && (
                <div className="flex items-center gap-1.5 pl-3 border-l border-neutral-200">
                  <span className="text-neutral-500 font-medium">Rate:</span>
                  {[0, 5, 12, 18, 28].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setGstRate(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        gstRate === r ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-600 border border-neutral-200'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-neutral-500 text-[11px]">
                Subtotal: <span className="font-semibold text-neutral-800">{formatCurrency(subtotal)}</span>
              </div>
              {gstEnabled && (
                <div className="text-neutral-500 text-[11px]">
                  GST ({gstRate}%): <span className="font-semibold text-neutral-800">{formatCurrency(calculatedGst)}</span>
                </div>
              )}
              <div className="text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-200">
                Grand Total: <span className="text-emerald-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-neutral-900 text-white font-semibold hover:bg-black transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Save Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
