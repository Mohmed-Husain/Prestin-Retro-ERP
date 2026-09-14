'use client';

import React, { useEffect, useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, History, Loader2, Calendar } from 'lucide-react';
import { Product, StockMovement } from '@/lib/types';

interface StockHistoryModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StockHistoryModal({ product, isOpen, onClose }: StockHistoryModalProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setLoading(true);
      fetch(`/api/stock-movements?productId=${product.product_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setMovements(data.movements || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[28px] w-full max-w-lg p-7 shadow-2xl border border-neutral-100 relative">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-neutral-100 text-neutral-800">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 tracking-tight">Movement History</h3>
              <p className="text-xs text-neutral-400 mt-0.5">{product.product_name} • {product.sku}</p>
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

        {/* Current Stock Banner */}
        <div className="mt-4 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-xs">
          <span className="text-neutral-500">Current Floor Balance:</span>
          <span className="font-bold text-neutral-900">{product.stock} Units</span>
        </div>

        {/* Timeline Log */}
        <div className="mt-4 max-h-72 overflow-y-auto pr-1 space-y-2.5">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-neutral-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Fetching Google Sheets log...</span>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No previous movement records found for this item.
            </div>
          ) : (
            movements.map((mov) => {
              const isIncoming = mov.type === 'IN';
              return (
                <div
                  key={mov.movement_id}
                  className="p-3 rounded-2xl border border-neutral-100 bg-white hover:border-neutral-200 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isIncoming ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {isIncoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-900">
                          {isIncoming ? `+${mov.qty} Pcs Received` : `-${mov.qty} Pcs Dispatched`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 font-medium">
                          {mov.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{mov.reason}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <Calendar className="w-3 h-3" />
                      <span>{mov.date || 'Recent'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-black transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
