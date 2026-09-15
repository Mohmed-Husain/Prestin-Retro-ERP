'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { 
  Download, 
  Plus, 
  RefreshCw, 
  LayoutGrid, 
  AlertCircle, 
  XCircle, 
  Shirt, 
  IndianRupee, 
  ChevronDown, 
  List, 
  Grid2X2,
  TrendingUp,
  Loader2,
  Trash2
} from 'lucide-react';
import { Product, InventoryKPIs } from '@/lib/types';
import { formatCurrency, calculateGrossMargin } from '@/lib/calculations';
import AddProductModal from '@/components/inventory/AddProductModal';
import EditProductModal from '@/components/inventory/EditProductModal';
import UpdateStockModal from '@/components/inventory/UpdateStockModal';
import StockHistoryModal from '@/components/inventory/StockHistoryModal';
import { toast } from 'sonner';

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [kpis, setKpis] = useState<InventoryKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sizeFilter, setSizeFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editModalProduct, setEditModalProduct] = useState<Product | null>(null);
  const [updateModalProduct, setUpdateModalProduct] = useState<Product | null>(null);
  const [historyModalProduct, setHistoryModalProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?kpis=true');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setKpis(data.kpis || null);
      } else {
        toast.error('Could not load inventory: ' + data.error);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Network or server error while connecting to Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && !p.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
      // Status filter
      if (statusFilter === 'LOW' && !(p.stock > 0 && p.stock <= p.min_stock)) return false;
      if (statusFilter === 'OUT' && p.stock !== 0) return false;
      if (statusFilter === 'HEALTHY' && p.stock <= p.min_stock) return false;

      // Size filter
      if (sizeFilter !== 'ALL' && !p.size.includes(sizeFilter)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSku = p.sku.toLowerCase().includes(q);
        const matchName = p.product_name.toLowerCase().includes(q);
        const matchDesc = p.description.toLowerCase().includes(q);
        const matchColor = p.color.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchDesc && !matchColor) return false;
      }

      return true;
    });
  }, [products, selectedCategory, statusFilter, sizeFilter, searchQuery]);

  // Handle product creation

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.product_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to archive product');
      }
      toast.success(`Product "${deletingProduct.product_name}" archived successfully`);
      setProducts(prev => prev.filter(p => p.product_id !== deletingProduct.product_id));
      setDeletingProduct(null);
      fetchInventory();
    } catch (err: any) {
      toast.error(err.message || 'Error archiving product');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleProductCreated = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    fetchInventory();
  };

  // Handle stock update
  const handleStockUpdated = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.product_id === updatedProd.product_id ? updatedProd : p))
    );
    fetchInventory();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (products.length === 0) {
      toast.error('No inventory to export');
      return;
    }
    const headers = ['SKU', 'Product Name', 'Category', 'Color', 'Size', 'Cost Price', 'Selling Price', 'Stock', 'Min Stock', 'Fabric GSM'];
    const rows = products.map(p => [
      p.sku,
      `"${p.product_name}"`,
      p.category,
      p.color,
      `"${p.size}"`,
      p.cost_price,
      p.selling_price,
      p.stock,
      p.min_stock,
      p.fabric_gsm,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PristineRetro_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported to CSV successfully');
  };

  // Category counts for pill buttons
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'All': products.length,
      'T-Shirts': 0,
      'Hoodies': 0,
      'Denim & Jackets': 0,
    };
    products.forEach((p) => {
      if (p.category.includes('T-Shirt')) counts['T-Shirts'] = (counts['T-Shirts'] || 0) + 1;
      else if (p.category.includes('Hoodie')) counts['Hoodies'] = (counts['Hoodies'] || 0) + 1;
      else if (p.category.includes('Denim') || p.category.includes('Jacket')) counts['Denim & Jackets'] = (counts['Denim & Jackets'] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <AppShell
      searchPlaceholder="Search garments, SKUs, fabric codes, categories..."
      onSearch={(q) => setSearchQuery(q)}
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 mb-6">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
            STOCK & WAREHOUSING
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 mt-0.5">
            Garments & Fabric Stock
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Export Stock Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-neutral-500" />
            <span>Export Stock</span>
          </button>

          {/* Update Stock Button */}
          <button
            type="button"
            onClick={() => {
              if (products.length > 0) {
                setUpdateModalProduct(products[0]);
              } else {
                toast.error('Add a product first');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Update Stock</span>
          </button>

          {/* + Add Product Button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-neutral-900 text-white hover:bg-black text-xs font-medium shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* 5 Floating KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
        {/* KPI 1: Total Garments & SKUs */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total Garments & SKUs</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <LayoutGrid className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? kpis.totalSkus.toLocaleString('en-IN') : (loading ? '—' : '0')}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-medium mt-1">
            <span>Catalog Items</span>
          </div>
        </div>

        {/* KPI 2: In-Stock Valuation */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">In-Stock Valuation</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600 font-semibold text-xs">
              ₹
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? formatCurrency(kpis.inventoryValuation) : (loading ? '—' : '₹ 0')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            At factory cost
          </div>
        </div>

        {/* KPI 3: Low Stock Alert */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Low Stock Alert</span>
            <div className="p-1 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? `${kpis.lowStockCount} Items` : (loading ? '—' : '0 Items')}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">
            Requires Reorder
          </div>
        </div>

        {/* KPI 4: Out of Stock */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Out of Stock</span>
            <div className="p-1 rounded-lg bg-rose-50 text-rose-600">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {kpis ? `${kpis.outOfStockCount} SKUs` : (loading ? '—' : '0 SKUs')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            0 units on floor
          </div>
        </div>

        {/* KPI 5: Total Ready Units */}
        <div className="floating-card p-5">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium text-neutral-500">Total Ready Units</span>
            <div className="p-1 rounded-lg bg-neutral-100 text-neutral-600">
              <Shirt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 tracking-tight">
            {kpis ? `${kpis.totalUnits.toLocaleString('en-IN')} Pcs` : (loading ? '—' : '0 Pcs')}
          </div>
          <div className="text-[11px] text-neutral-400 font-medium mt-1">
            Warehouse Stock
          </div>
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'All'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200/70 hover:bg-neutral-50'
            }`}
          >
            All Garments ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('T-Shirts')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'T-Shirts'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200/70 hover:bg-neutral-50'
            }`}
          >
            T-Shirts ({categoryCounts['T-Shirts'] || 0})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('Hoodies')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'Hoodies'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200/70 hover:bg-neutral-50'
            }`}
          >
            Hoodies ({categoryCounts['Hoodies'] || 0})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('Denim')}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'Denim'
                ? 'bg-neutral-900 text-white shadow-sm'
                : 'bg-white text-neutral-600 border border-neutral-200/70 hover:bg-neutral-50'
            }`}
          >
            Denim & Jackets ({categoryCounts['Denim & Jackets'] || 0})
          </button>
        </div>

        {/* Right Filter Dropdowns & View Toggle */}
        <div className="flex items-center gap-2.5">
          {/* Sizes Dropdown */}
          <div className="relative">
            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">All Sizes (XS - 3XL)</option>
              <option value="S">Size S</option>
              <option value="M">Size M</option>
              <option value="L">Size L</option>
              <option value="XL">Size XL</option>
              <option value="38">Size 38</option>
              <option value="40">Size 40</option>
              <option value="42">Size 42</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="ALL">Status: All Status</option>
              <option value="HEALTHY">In Stock (Healthy)</option>
              <option value="LOW">Low Stock Alert</option>
              <option value="OUT">Out of Stock</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Grid / List Toggle */}
          <div className="flex items-center bg-white border border-neutral-200/80 rounded-full p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`p-1.5 rounded-full transition-colors ${
                viewMode === 'list' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          <p className="text-xs text-neutral-400 font-medium">Syncing inventory with Google Sheets...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="floating-card p-12 text-center text-neutral-400">
          <Shirt className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
          <p className="text-sm font-semibold text-neutral-700">No matching garments found</p>
          <p className="text-xs mt-1">Try adjusting your category filter or search keywords</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout (3 Columns on desktop, exactly like mockup) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((product) => {
            const margin = calculateGrossMargin(product.cost_price, product.selling_price);
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= product.min_stock;
            const isHealthy = product.stock > product.min_stock;

            // Status label & color
            let statusText = 'Stock level healthy';
            let statusDot = 'bg-emerald-500';
            let actionLabel = 'Update';
            let actionClass = 'bg-neutral-900 text-white hover:bg-black';

            if (isOutOfStock) {
              statusText = 'Pending production batch #B-42';
              statusDot = 'bg-rose-500';
              actionLabel = 'Start Cut';
              actionClass = 'bg-rose-600 text-white hover:bg-rose-700';
            } else if (product.stock <= 5) {
              statusText = 'Reorder trigger hit';
              statusDot = 'bg-amber-500';
              actionLabel = '+ Restock';
              actionClass = 'bg-neutral-900 text-white hover:bg-black';
            } else if (product.stock <= 15) {
              statusText = 'Fast moving stock';
              statusDot = 'bg-amber-500';
              actionLabel = '+ Restock';
              actionClass = 'bg-neutral-900 text-white hover:bg-black';
            }

            return (
              <div
                key={product.product_id}
                className="floating-card p-6 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Row: Fabric icon with GSM tag + Details */}
                  <div className="flex items-start gap-4">
                    {/* Fabric Spec Badge / Icon */}
                    <div className="w-20 h-24 rounded-2xl bg-neutral-100/90 border border-neutral-200/50 flex flex-col items-center justify-between p-2 flex-shrink-0 group-hover:bg-neutral-200/60 transition-colors">
                      <div className="flex-1 flex items-center justify-center text-neutral-500">
                        <Shirt className="w-8 h-8 opacity-70" />
                      </div>
                      <span className="w-full text-center text-[10px] font-bold text-neutral-700 bg-white/90 py-0.5 rounded-lg shadow-subtle">
                        {product.fabric_gsm || '—'}
                      </span>
                    </div>

                    {/* Product Basic Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-mono font-medium text-neutral-400">
                          SKU: {product.sku}
                        </span>

                        {/* Stock Badge */}
                        {isOutOfStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                            0 left (Out)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                            {product.stock} left
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {product.stock} in stock
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-[15px] text-neutral-900 tracking-tight truncate">
                        {product.product_name}
                      </h3>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">
                        {product.description || 'Standard factory garment'}
                      </p>

                      {/* Specs: Color & Sizes */}
                      <div className="flex items-center gap-3 text-[11px] text-neutral-600 mt-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-neutral-800" />
                          <span>{product.color || 'Standard'}</span>
                        </div>
                        <span className="text-neutral-300">•</span>
                        <div className="truncate">
                          <span className="text-neutral-400">Sizes: </span>
                          <span>{product.size || 'Free Size'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-5 p-3 rounded-2xl bg-neutral-50/80 border border-neutral-100 text-center">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-medium block">Selling Price</span>
                      <span className="text-xs font-bold text-neutral-900 mt-0.5 block">
                        {formatCurrency(product.selling_price)}
                      </span>
                    </div>
                    <div className="border-x border-neutral-200/60">
                      <span className="text-[10px] text-neutral-400 font-medium block">Mfg Cost</span>
                      <span className="text-xs font-bold text-neutral-900 mt-0.5 block">
                        {formatCurrency(product.cost_price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 font-medium block">Gross Margin</span>
                      <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
                        {margin}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-5 mt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                    <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                    <span className="truncate max-w-[140px] text-[11px]">{statusText}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditModalProduct(product)}
                      className="px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryModalProduct(product)}
                      className="px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
                    >
                      History
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdateModalProduct(product)}
                      className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium shadow-sm transition-all ${actionClass}`}
                    >
                      {actionLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(product)}
                      className="p-1.5 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-all"
                      title="Archive Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="floating-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-6">SKU / Garment</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Color & Size</th>
                  <th className="py-3.5 px-4 text-right">Cost Price</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-right">Margin</th>
                  <th className="py-3.5 px-4 text-center">Stock</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => {
                  const margin = calculateGrossMargin(p.cost_price, p.selling_price);
                  return (
                    <tr key={p.product_id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-neutral-900">{p.product_name}</div>
                        <div className="font-mono text-[11px] text-neutral-400">{p.sku} • {p.fabric_gsm}</div>
                      </td>
                      <td className="py-4 px-4 text-neutral-600 font-medium">{p.category}</td>
                      <td className="py-4 px-4 text-neutral-600">
                        <div>{p.color}</div>
                        <div className="text-[11px] text-neutral-400">{p.size}</div>
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-neutral-900">{formatCurrency(p.cost_price)}</td>
                      <td className="py-4 px-4 text-right font-semibold text-neutral-900">{formatCurrency(p.selling_price)}</td>
                      <td className="py-4 px-4 text-right font-bold text-emerald-600">{margin}%</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] ${
                          p.stock === 0 ? 'bg-rose-50 text-rose-600' : p.stock <= p.min_stock ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {p.stock} Pcs
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditModalProduct(p)}
                            className="px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setHistoryModalProduct(p)}
                            className="px-3 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                          >
                            History
                          </button>
                          <button
                            type="button"
                            onClick={() => setUpdateModalProduct(p)}
                            className="px-3.5 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-medium hover:bg-black"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(p)}
                            className="p-1.5 rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-all"
                            title="Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductCreated={handleProductCreated}
      />

      <EditProductModal
        product={editModalProduct}
        isOpen={!!editModalProduct}
        onClose={() => setEditModalProduct(null)}
        onProductUpdated={(updatedProd) => {
          setProducts(prev => prev.map(p => p.product_id === updatedProd.product_id ? updatedProd : p));
          fetchInventory();
        }}
      />

      <UpdateStockModal
        product={updateModalProduct}
        products={products}
        isOpen={!!updateModalProduct}
        onClose={() => setUpdateModalProduct(null)}
        onStockUpdated={handleStockUpdated}
      />


      {/* Delete Product Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-neutral-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Archive Garment?</h3>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              Are you sure you want to archive <span className="font-semibold text-neutral-800">{deletingProduct.product_name}</span> ({deletingProduct.sku})? It will be safely archived from active warehouse stock.
            </p>
            <div className="flex items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 shadow-sm transition-all disabled:opacity-50"
              >
                {deleteLoading ? 'Archiving...' : 'Yes, Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      <StockHistoryModal
        product={historyModalProduct}
        isOpen={!!historyModalProduct}
        onClose={() => setHistoryModalProduct(null)}
      />
    </AppShell>
  );
}
