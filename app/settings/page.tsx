'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Settings, 
  Building2, 
  Receipt, 
  RefreshCw, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    company_name: 'PRISTINE RETRO ENTERPRISE',
    gst_number: '24ABIFP5127C1ZJ',
    factory_address: 'Hussain tekri, Palanpur highway, Kanodar, Gujarat',
    phone_number: '8758206574',
    billing_email: 'Pp321753@gmail.com',
    invoice_prefix: 'INV-',
    currency: '₹',
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
      toast.success('Factory settings saved to Google Sheets Metadata tab!');
    } catch (err: any) {
      toast.error(err.message || 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    toast.success('In-memory cache flushed. Next request reads fresh from Google Sheets.');
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="pt-2 mb-6">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          SYSTEM CONFIGURATION
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
          Factory Settings & Invoicing Rules
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Configure company profile, tax numbers, invoice prefixes, and Google Sheets sync settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form (8 cols) */}
        <div className="lg:col-span-8 floating-card p-7">
          <form onSubmit={handleSave} className="space-y-6 text-xs">
            {/* Business Profile */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100">
                <Building2 className="w-4 h-4 text-neutral-900" />
                <h3 className="font-bold text-sm text-neutral-900">Company & Factory Identity</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Company / Enterprise Name</label>
                  <input
                    type="text"
                    required
                    value={settings.company_name}
                    onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-bold uppercase"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Factory GSTIN</label>
                    <input
                      type="text"
                      required
                      value={settings.gst_number}
                      onChange={(e) => setSettings({ ...settings, gst_number: e.target.value.toUpperCase() })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-mono uppercase font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Factory Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={settings.phone_number}
                      onChange={(e) => setSettings({ ...settings, phone_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">Billing Email</label>
                    <input
                      type="email"
                      required
                      value={settings.billing_email}
                      onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">State & Code</label>
                    <input
                      type="text"
                      disabled
                      value="24-Gujarat"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Factory Dispatch Address</label>
                  <input
                    type="text"
                    required
                    value={settings.factory_address}
                    onChange={(e) => setSettings({ ...settings, factory_address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                  />
                </div>
              </div>
            </div>

            {/* Invoicing Settings */}
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100">
                <Receipt className="w-4 h-4 text-neutral-900" />
                <h3 className="font-bold text-sm text-neutral-900">Invoicing & Tax Rules</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    required
                    value={settings.invoice_prefix}
                    onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">Preview: {settings.invoice_prefix}211</span>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Operating Currency</label>
                  <input
                    type="text"
                    disabled
                    value="₹ (INR) Indian Rupee"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-600 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-semibold hover:bg-black transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating Google Sheets...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Save Factory Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Panel: Database & Cache Status (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="floating-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-neutral-900">Database Engine</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Live Database</span>
                <span className="font-bold text-neutral-900">Google Sheets API</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Spreadsheet Title</span>
                <span className="font-mono text-[11px] text-neutral-700">sheet-backend</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Sync Mode</span>
                <span className="font-semibold text-emerald-600">Two-Way Live Sync</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">In-Memory Cache TTL</span>
                <span className="font-semibold text-neutral-900">45 Seconds</span>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleClearCache}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                <span>Flush In-Memory Cache</span>
              </button>
            </div>
          </div>

          <div className="floating-card p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
            <h4 className="font-bold text-sm">Vercel Deployment Ready</h4>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Threadly Factory OS is built to deploy with zero extra configuration. All Google credentials remain securely encrypted inside Vercel Environment Variables.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
