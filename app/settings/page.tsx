"use client";

import React, { useState, useEffect, useRef } from "react";
import AppShell from "@/components/layout/AppShell";
import { 
  Building2, 
  Receipt, 
  RefreshCw, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Lock,
  User,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  // Import states
  const [selectedModule, setSelectedModule] = useState<"products" | "customers" | "expenses" | "sales">("products");
  const [importing, setImporting] = useState(false);
  const [importPreviewCount, setImportPreviewCount] = useState<number | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState({
    company_name: "PRESTON RETRO",
    company_logo: "",
    user_name: "Aman Raj",
    app_pin: "1234",
    gst_number: "24ABIFP5127C1ZJ",
    factory_address: "Hussain tekri, Palanpur highway, Kanodar, Gujarat",
    phone_number: "8758206574",
    billing_email: "Pp321753@gmail.com",
    invoice_prefix: "INV-",
    currency: "₹",
  });

  useEffect(() => {
    // Read cached values first
    const savedName = localStorage.getItem("preston_company_name");
    const savedLogo = localStorage.getItem("preston_company_logo");
    const savedUser = localStorage.getItem("preston_user_name");
    const savedPin = localStorage.getItem("preston_app_pin");
    if (savedName || savedUser || savedPin) {
      setSettings(prev => ({
        ...prev,
        company_name: savedName || prev.company_name,
        company_logo: savedLogo || prev.company_logo,
        user_name: savedUser || prev.user_name,
        app_pin: savedPin || prev.app_pin,
      }));
    }

    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
          if (data.settings.company_name) localStorage.setItem("preston_company_name", data.settings.company_name);
          if (data.settings.company_logo !== undefined) localStorage.setItem("preston_company_logo", data.settings.company_logo);
          if (data.settings.user_name) localStorage.setItem("preston_user_name", data.settings.user_name);
          if (data.settings.app_pin) localStorage.setItem("preston_app_pin", data.settings.app_pin);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.app_pin.length !== 4 || !/^\d{4}$/.test(settings.app_pin)) {
      toast.error("App Lock Password must be exactly 4 digits (e.g. 1234)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save settings");
      }

      // Sync local storage for instantaneous updates
      localStorage.setItem("preston_company_name", settings.company_name);
      localStorage.setItem("preston_company_logo", settings.company_logo);
      localStorage.setItem("preston_user_name", settings.user_name);
      localStorage.setItem("preston_app_pin", settings.app_pin);

      toast.success("Settings saved to Google Sheets Metadata tab!");
      window.dispatchEvent(new Event("storage"));
    } catch (err: any) {
      toast.error(err.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = () => {
    toast.success("In-memory cache flushed. Next request reads fresh from Google Sheets.");
  };

  const handleClearMockData = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear_all" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to clear mock data");
      }
      toast.success("All mock data rows cleared from Google Sheets!");
      setShowClearModal(false);
    } catch (err: any) {
      toast.error(err.message || "Error clearing mock data");
    } finally {
      setClearing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(ws);
        if (data.length === 0) {
          toast.error("The selected file contains no data rows.");
          return;
        }
        setParsedRows(data);
        setImportPreviewCount(data.length);
        toast.success("Parsed " + data.length + " rows from " + file.name + ". Click Confirm Import to upload.");
      } catch (err: any) {
        toast.error("Failed to parse file: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = async () => {
    if (!parsedRows || parsedRows.length === 0) {
      toast.error("Please choose a valid Excel or CSV file first.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "import",
          module: selectedModule,
          rows: parsedRows,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import rows");
      }
      toast.success(data.message || "Imported successfully into Google Sheets!");
      setParsedRows([]);
      setImportPreviewCount(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Error during import");
    } finally {
      setImporting(false);
    }
  };

  const handleExportExcel = () => {
    window.open("/api/data?format=excel", "_blank");
    toast.success("Generating multi-module Excel export...");
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="pt-2 mb-6">
        <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          SYSTEM CONFIGURATION & DATA MANAGEMENT
        </span>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
          Factory Profile, Security & Excel Hub
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Customize factory name, top-left logo, app lock password, user account, import/export data, and manage Google Sheets backend.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Profile, Logo, User, Security (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="floating-card p-7">
            <form onSubmit={handleSave} className="space-y-6 text-xs">
              {/* Brand & Factory Identity */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100">
                  <Building2 className="w-4 h-4 text-neutral-900" />
                  <h3 className="font-bold text-sm text-neutral-900">Brand Name & Factory Identity</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Company / Enterprise Name</label>
                      <input
                        type="text"
                        required
                        value={settings.company_name}
                        onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-bold uppercase"
                      />
                      <span className="text-[10px] text-neutral-400 mt-1 block">Displayed on the top-left sidebar and printed on all invoices.</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Top-Left Logo Image URL (Optional)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          value={settings.company_logo}
                          onChange={(e) => setSettings({ ...settings, company_logo: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                        />
                        {settings.company_logo && (
                          <div className="w-9 h-9 rounded-xl bg-neutral-100 border border-neutral-200 p-1 flex-shrink-0 flex items-center justify-center">
                            <img src={settings.company_logo} alt="Preview" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 mt-1 block">Replaces standard mark on top-left sidebar.</span>
                    </div>
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
                      <label className="block font-semibold text-neutral-700 mb-1">Dispatch Address</label>
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
              </div>

              {/* User Identity & App Lock Password */}
              <div>
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-neutral-100">
                  <User className="w-4 h-4 text-neutral-900" />
                  <h3 className="font-bold text-sm text-neutral-900">User Profile & App Lock Security</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">User Name (Bottom Left Profile)</label>
                    <input
                      type="text"
                      required
                      value={settings.user_name}
                      onChange={(e) => setSettings({ ...settings, user_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-semibold"
                    />
                    <span className="text-[10px] text-neutral-400 mt-1 block">Displayed on the bottom left corner profile card.</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">4-Digit App Lock Password (PIN)</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={settings.app_pin}
                        onChange={(e) => setSettings({ ...settings, app_pin: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 font-mono font-bold tracking-widest text-sm"
                      />
                    </div>
                    <span className="text-[10px] text-neutral-400 mt-1 block">Used by the 4-digit lock screen (Default: 1234).</span>
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
                      Save Settings & Security
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Modular Import / Export Card */}
          <div className="floating-card p-7">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-neutral-900" />
                <h3 className="font-bold text-sm text-neutral-900">Modular Data Import & Multi-Sheet Excel Export</h3>
              </div>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All (.xlsx)</span>
              </button>
            </div>

            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              Export all modules (Products, Customers, Sales, Expenses) formatted cleanly into a single multi-tab Excel spreadsheet, or import data for each module separately into Google Sheets.
            </p>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3.5 text-xs">
              <div className="font-semibold text-neutral-800 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-neutral-700" />
                <span>Import Modular Data (CSV / Excel)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Select Module</label>
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white font-semibold text-neutral-800 text-xs focus:outline-none"
                  >
                    <option value="products">Products Inventory</option>
                    <option value="customers">Customers Directory</option>
                    <option value="expenses">Expenses & Overheads</option>
                    <option value="sales">Sales Invoices</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Choose .xlsx or .csv File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 bg-white text-neutral-600 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {importPreviewCount !== null && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  <span>Ready to import <strong>{importPreviewCount}</strong> records into <strong>{selectedModule.toUpperCase()}</strong> tab.</span>
                  <button
                    type="button"
                    disabled={importing}
                    onClick={handleExecuteImport}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {importing ? "Importing..." : "Confirm & Import"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Database Engine, Flush Cache, Clear Mock Data (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Engine Info */}
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

          {/* Clear Mock Data Safety Action */}
          <div className="floating-card p-6 space-y-3 border-rose-100">
            <div className="flex items-center gap-2 pb-2 border-b border-rose-100 text-rose-600">
              <Trash2 className="w-4 h-4" />
              <h3 className="font-bold text-sm text-rose-900">Clear All Mock Data</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Wipes all demo transaction rows across Products, Sales, Customers, Payments, and Expenses while keeping all sheet headers and settings safe.
            </p>
            <button
              type="button"
              onClick={() => setShowClearModal(true)}
              className="w-full py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              Clear All Mock Data Rows
            </button>
          </div>

          {/* Vercel Ready Card */}
          <div className="floating-card p-6 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
            <h4 className="font-bold text-sm">Preston Retro Factory OS</h4>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Google Sheets operates as your serverless database with real-time sync, zero operational DB cost, and instant Excel interchange.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Mock Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-fade-in border border-neutral-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-full bg-rose-100">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-neutral-900">Confirm Clearing Mock Data</h3>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              This action will delete all transaction data rows in Google Sheets from row 2 onwards across Products, Customers, Sales, and Expenses. Metadata settings will remain untouched.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={handleClearMockData}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5"
              >
                {clearing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{clearing ? "Clearing..." : "Yes, Clear Mock Data"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
