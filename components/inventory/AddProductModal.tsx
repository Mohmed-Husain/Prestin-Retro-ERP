'use client';

import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Product } from '@/lib/types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (product: Product) => void;
}

export default function AddProductModal({ isOpen, onClose, onProductCreated }: AddProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: '',
    product_name: '',
    category: 'T-Shirts',
    fabric_gsm: '220 GSM',
    description: '',
    color: 'Matte Black',
    size: 'S, M, L, XL',
    cost_price: 350,
    selling_price: 999,
    stock: 50,
    min_stock: 20,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sku || !formData.product_name) {
      toast.error('Please enter SKU and Product Name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create product');
      }

      toast.success(`Product ${data.product.sku} created in Google Sheets!`);
      onProductCreated(data.product);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-xl p-7 shadow-2xl border border-neutral-100 relative">
        <div className="flex items-center justify-between pb-5 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Add New Garment / SKU</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Saves directly to Google Sheets database</p>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">SKU Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. CT-008"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 uppercase font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 bg-white"
              >
                <option value="T-Shirts">T-Shirts</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Denim & Jackets">Denim & Jackets</option>
                <option value="Shirts">Shirts</option>
                <option value="Track Pants">Track Pants</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Vintage Wash Boxy Tee"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Fabric Specification / GSM</label>
              <input
                type="text"
                placeholder="e.g. 240 GSM or 14.5 Oz"
                value={formData.fabric_gsm}
                onChange={(e) => setFormData({ ...formData, fabric_gsm: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Material Description</label>
              <input
                type="text"
                placeholder="e.g. 100% Combed Cotton"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Color</label>
              <input
                type="text"
                placeholder="e.g. Olive Drab"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Available Sizes</label>
              <input
                type="text"
                placeholder="e.g. S, M, L, XL"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Mfg Cost (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Selling Price (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Initial Stock (Pcs)</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">Low Stock Alert Level</label>
              <input
                type="number"
                min="1"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-semibold"
              />
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
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-medium hover:bg-black transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving to Sheets...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Save Garment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
