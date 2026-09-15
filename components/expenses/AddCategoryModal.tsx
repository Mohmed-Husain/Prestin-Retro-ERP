'use client';

import React, { useState } from 'react';
import { X, Plus, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { ExpenseCategory } from '@/lib/types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: (category: ExpenseCategory) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Shirt', label: 'Fabric / Apparel' },
  { name: 'Box', label: 'Packaging / Thread' },
  { name: 'Zap', label: 'Electricity / Utility' },
  { name: 'Users', label: 'Salary / Labor' },
  { name: 'Truck', label: 'Transport / Freight' },
  { name: 'Wrench', label: 'Maintenance / Repairs' },
  { name: 'DollarSign', label: 'Finance / General' },
  { name: 'ShoppingBag', label: 'Purchases / Raw' },
];

export default function AddCategoryModal({ isOpen, onClose, onCategoryCreated }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Shirt');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/expense-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create category');
      }

      toast.success(`Category "${data.category.name}" added to Google Sheets!`);
      onCategoryCreated(data.category);
      setName('');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error creating category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-md p-6 shadow-2xl border border-neutral-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900 tracking-tight">Add Expense Category</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Saves to Google Sheets ExpenseCategories</p>
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
          <div>
            <label className="block font-semibold text-neutral-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Embroidery, Printing, Buttons"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 text-neutral-900 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-neutral-700 mb-2">Category Icon / Type</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {AVAILABLE_ICONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    icon === item.name
                      ? 'border-neutral-900 bg-neutral-900 text-white font-semibold'
                      : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate text-[11px]">{item.label}</span>
                </button>
              ))}
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
                  Saving Category...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Create Category
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
