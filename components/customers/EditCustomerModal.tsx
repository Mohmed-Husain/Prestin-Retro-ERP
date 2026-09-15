'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Building2, User, Phone, Mail, MapPin, ShieldAlert, CreditCard } from 'lucide-react';
import { Customer } from '@/lib/types';
import { toast } from 'sonner';

interface EditCustomerModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onCustomerUpdated: (updated: Customer) => void;
}

export default function EditCustomerModal({
  customer,
  isOpen,
  onClose,
  onCustomerUpdated,
}: EditCustomerModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    gst: '',
    address: '',
    tier: 'Regular',
    credit_limit: 0,
    credit_days: 15,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        contact_person: customer.contact_person || '',
        phone: customer.phone || '',
        email: customer.email || '',
        gst: customer.gst || '',
        address: customer.address || '',
        tier: customer.tier || 'Regular',
        credit_limit: customer.credit_limit || 0,
        credit_days: customer.credit_days || 15,
      });
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Buyer name is required');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.customer_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          credit_limit: Number(formData.credit_limit) || 0,
          credit_days: Number(formData.credit_days) || 15,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update buyer');
      }

      toast.success(`Buyer "${formData.name}" updated successfully!`);
      onCustomerUpdated(data.customer);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Error updating buyer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-lg p-6 shadow-2xl border border-neutral-100 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Edit Buyer Account</h2>
              <p className="text-xs text-neutral-400">Update company, credit terms & dispatch address</p>
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
          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Company / Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Wholesale Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 bg-white"
              >
                <option value="Regular">Regular Wholesale</option>
                <option value="Tier 1 Wholesale">Tier 1 Wholesale</option>
                <option value="VIP Buyer">VIP Buyer</option>
                <option value="Semi-Wholesale">Semi-Wholesale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                GSTIN Number
              </label>
              <input
                type="text"
                value={formData.gst}
                onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
              Factory Dispatch Address
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 resize-none"
            />
          </div>

          {/* Customizable Credit Section */}
          <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-neutral-900 font-bold">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Customizable Credit & Khata Terms</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Credit Limit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-bold text-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 mb-1">
                  Payment Days Term
                </label>
                <select
                  value={formData.credit_days}
                  onChange={(e) => setFormData({ ...formData, credit_days: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-medium text-neutral-900 focus:outline-none"
                >
                  <option value={7}>Net 7 Days</option>
                  <option value={15}>Net 15 Days (Standard)</option>
                  <option value={30}>Net 30 Days (1 Month)</option>
                  <option value={45}>Net 45 Days</option>
                  <option value={60}>Net 60 Days</option>
                  <option value={90}>Net 90 Days</option>
                </select>
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
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
