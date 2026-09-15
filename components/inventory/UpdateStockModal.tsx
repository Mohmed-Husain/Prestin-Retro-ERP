'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, RefreshCw, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Product, StockMovementType } from '@/lib/types';

interface UpdateStockModalProps {
  product: Product | null;
  products?: Product[];
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated: (updatedProduct: Product) => void;
}

export default function UpdateStockModal({
  product,
  products = [],
  isOpen,
  onClose,
  onStockUpdated,
}: UpdateStockModalProps) {
  const [activeProduct, setActiveProduct] = useState<Product | null>(product);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'IN' | 'ADJUST'>('IN');
  const [quantity, setQuantity] = useState<number>(20);
  const [reason, setReason] = useState('New Production Batch Arrival');

  useEffect(() => {
    if (product) {
      setActiveProduct(product);
    } else if (products.length > 0) {
      setActiveProduct(products[0]);
    }
  }, [product, products]);

  if (!isOpen || (!activeProduct && products.length === 0)) return null;

  const currentProd = activeProduct || (products.length > 0 ? products[0] : null);
  if (!currentProd) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${currentProd.product_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockAdjustment: true,
          quantity,
          movementType: mode as StockMovementType,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update stock');
      }

      toast.success(`Stock updated for ${currentProd.sku}! Live in Google Sheets.`);
      onStockUpdated(data.product);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error updating stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-md p-7 shadow-2xl border border-neutral-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Stock Adjustment</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Quick update warehouse floor count</p>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Product Selector Dropdown */}
          {products && products.length > 0 && (
            <div>
              <label className="block font-semibold text-neutral-700 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-neutral-500" />
                <span>Select Garment / Product to Update *</span>
              </label>
              <select
                value={currentProd.product_id}
                onChange={(e) => {
                  const selected = products.find(p => p.product_id === e.target.value);
                  if (selected) setActiveProduct(selected);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 bg-white font-medium text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 shadow-xs"
              >
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.product_name} ({p.sku}) • Stock: {p.stock} Pcs
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Current Stock Banner */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-neutral-400 block font-medium">Floor Stock</span>
              <span className="text-xl font-bold text-neutral-900">{currentProd.stock} Pcs</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-neutral-400 block font-medium">Reorder Trigger</span>
              <span className="text-xs font-semibold text-amber-600">{currentProd.min_stock} Pcs</span>
            </div>
          </div>

          {/* Action Mode Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('IN');
                setReason('New Production Batch Arrival');
              }}
              className={`py-2 rounded-lg font-medium text-center transition-all ${
                mode === 'IN' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              + Restock (Add Units)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('ADJUST');
                setReason('Floor Count Physical Audit');
              }}
              className={`py-2 rounded-lg font-medium text-center transition-all ${
                mode === 'ADJUST' ? 'bg-white text-neutral-900 shadow-sm font-semibold' : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Set Exact Count
            </button>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">
              {mode === 'IN' ? 'Quantity to Add (Pcs) *' : 'Exact Count (Pcs) *'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-base font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Audit Reason / Batch Ref *</label>
            <input
              type="text"
              required
              placeholder="e.g. Batch #B-44 completed"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
                  Syncing to Sheets...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Update Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
