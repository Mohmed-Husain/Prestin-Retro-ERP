import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { Product, InventoryKPIs, StockMovementType } from '../types';
import { recordStockMovement } from './stockMovements';

const TAB_NAME = 'Products';

export async function getAllProducts(includeInactive = false): Promise<Product[]> {
  const rows = await syncManager.getRows(TAB_NAME);
  const products = rowsToObjects(rows, mappers.rowToProduct);
  if (includeInactive) return products;
  return products.filter(p => p.is_active);
}

export async function getProductById(productId: string): Promise<Product | null> {
  const products = await getAllProducts(true);
  return products.find(p => p.product_id === productId) || null;
}

export async function getProductBySku(sku: string): Promise<Product | null> {
  const products = await getAllProducts(true);
  return products.find(p => p.sku.toLowerCase() === sku.toLowerCase()) || null;
}

export async function createProduct(data: Omit<Product, 'product_id' | 'is_active' | 'created_at' | 'updated_at'>): Promise<Product> {
  const productId = `prod_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newProduct: Product = {
    ...data,
    product_id: productId,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const row = mappers.productToRow(newProduct);
  await syncManager.appendRow(TAB_NAME, row);

  // If initial stock is greater than 0, record initial stock movement
  if (newProduct.stock > 0) {
    await recordStockMovement({
      product_id: newProduct.product_id,
      sku: newProduct.sku,
      type: 'IN',
      qty: newProduct.stock,
      reason: 'Initial Product Creation Stock',
      date: new Date().toISOString().split('T')[0],
    });
  }

  return newProduct;
}

export async function updateProductStock(
  productId: string,
  stockDiffOrNewStock: number,
  movementType: StockMovementType,
  reason: string
): Promise<Product> {
  const rows = await syncManager.getRows(TAB_NAME);
  const productsWithIndex = rowsToObjects(rows, mappers.rowToProduct);
  const target = productsWithIndex.find(p => p.product_id === productId);

  if (!target) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  let finalStock = target.stock;
  let moveQty = stockDiffOrNewStock;

  if (movementType === 'IN') {
    finalStock += stockDiffOrNewStock;
  } else if (movementType === 'OUT') {
    if (target.stock < stockDiffOrNewStock) {
      throw new Error(`Insufficient stock for ${target.product_name}. Available: ${target.stock}, Requested: ${stockDiffOrNewStock}`);
    }
    finalStock -= stockDiffOrNewStock;
  } else if (movementType === 'ADJUST') {
    moveQty = Math.abs(stockDiffOrNewStock - target.stock);
    finalStock = stockDiffOrNewStock;
  }

  const updatedProduct: Product = {
    ...target,
    stock: Math.max(0, finalStock),
    updated_at: new Date().toISOString(),
  };

  const rowValues = mappers.productToRow(updatedProduct);
  await syncManager.updateRow(TAB_NAME, (target as any)._rowIndex, rowValues);

  // Audit stock movement
  await recordStockMovement({
    product_id: target.product_id,
    sku: target.sku,
    type: movementType,
    qty: moveQty,
    reason,
    date: new Date().toISOString().split('T')[0],
  });

  return updatedProduct;
}

export async function updateProduct(productId: string, updates: Partial<Product>): Promise<Product> {
  const rows = await syncManager.getRows(TAB_NAME);
  const productsWithIndex = rowsToObjects(rows, mappers.rowToProduct);
  const target = productsWithIndex.find(p => p.product_id === productId);

  if (!target) {
    throw new Error(`Product with ID ${productId} not found`);
  }

  const updated: Product = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const rowValues = mappers.productToRow(updated);
  await syncManager.updateRow(TAB_NAME, (target as any)._rowIndex, rowValues);
  return updated;
}

export async function softDeleteProduct(productId: string): Promise<void> {
  await updateProduct(productId, { is_active: false });
}

export async function getInventoryKPIs(): Promise<InventoryKPIs> {
  const products = await getAllProducts();

  const totalSkus = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const inventoryValuation = products.reduce((sum, p) => sum + p.stock * p.cost_price, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.min_stock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Category counts
  const catMap = new Map<string, number>();
  products.forEach(p => {
    catMap.set(p.category, (catMap.get(p.category) || 0) + 1);
  });

  const categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count }));

  return {
    totalSkus,
    totalUnits,
    inventoryValuation,
    lowStockCount,
    outOfStockCount,
    categories,
  };
}
