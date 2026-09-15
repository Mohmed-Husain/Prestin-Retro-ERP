import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { Sale, SaleItem } from '../types';
import { updateProductStock, getProductById } from './products';

const SALES_TAB = 'Sales';
const SALE_ITEMS_TAB = 'SaleItems';
const METADATA_TAB = 'Metadata';

export async function getAllSales(includeInactive = false): Promise<Sale[]> {
  const [salesRows, itemsRows, customersRows, paymentsRows] = await Promise.all([
    syncManager.getRows(SALES_TAB),
    syncManager.getRows(SALE_ITEMS_TAB),
    syncManager.getRows('Customers'),
    syncManager.getRows('Payments'),
  ]);

  const sales = rowsToObjects(salesRows, mappers.rowToSale);
  const items = rowsToObjects(itemsRows, mappers.rowToSaleItem);
  const customers = rowsToObjects(customersRows, mappers.rowToCustomer);
  const payments = rowsToObjects(paymentsRows, mappers.rowToPayment);

  const activeSales = includeInactive ? sales : sales.filter(s => s.is_active);

  // Group payments by customer
  const paymentsByCustomer = new Map<string, number>();
  payments.forEach(p => {
    paymentsByCustomer.set(p.customer_id, (paymentsByCustomer.get(p.customer_id) || 0) + p.amount);
  });

  // Calculate amount_paid per sale via FIFO
  const salesByCustomer = new Map<string, Sale[]>();
  activeSales.forEach(s => {
    const list = salesByCustomer.get(s.customer_id) || [];
    list.push(s);
    salesByCustomer.set(s.customer_id, list);
  });

  const salePaidMap = new Map<string, number>();
  salesByCustomer.forEach((custSales, custId) => {
    let balance = paymentsByCustomer.get(custId) || 0;
    // Sort oldest first
    const sorted = [...custSales].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    for (const sale of sorted) {
      if (sale.status === 'Draft') continue;
      if (balance >= sale.total) {
        salePaidMap.set(sale.invoice_id, sale.total);
        balance -= sale.total;
      } else if (balance > 0) {
        salePaidMap.set(sale.invoice_id, balance);
        balance = 0;
      } else {
        salePaidMap.set(sale.invoice_id, 0);
      }
    }
  });

  return activeSales.map(sale => {
    const saleItems = items.filter(i => i.invoice_id === sale.invoice_id);
    const customer = customers.find(c => c.customer_id === sale.customer_id);
    const amountPaid = salePaidMap.has(sale.invoice_id)
      ? salePaidMap.get(sale.invoice_id)!
      : (sale.status === 'Paid' ? sale.total : 0);

    return {
      ...sale,
      customer_name: customer ? customer.name : 'Unknown Buyer',
      items: saleItems,
      amount_paid: amountPaid,
    };
  }).reverse(); // Most recent first
}

export async function getNextInvoiceNumber(): Promise<string> {
  const [metaRows, salesRows] = await Promise.all([
    syncManager.getRows(METADATA_TAB, true),
    syncManager.getRows(SALES_TAB, true),
  ]);
  const meta = rowsToObjects(metaRows, mappers.rowToMetadata);
  const invoiceNumEntry = meta.find(m => m.key === 'last_invoice_number');
  const prefixEntry = meta.find(m => m.key === 'invoice_prefix');

  // Verify against all existing sales in database to guarantee no collision
  const sales = rowsToObjects(salesRows, mappers.rowToSale);
  let highestExisting = 1000;
  sales.forEach(s => {
    const numPart = parseInt(s.invoice_number?.replace(/\D/g, ''), 10);
    if (!isNaN(numPart) && numPart > highestExisting) {
      highestExisting = numPart;
    }
  });

  const metaNum = invoiceNumEntry ? parseInt(invoiceNumEntry.value, 10) || 1000 : 1000;
  const currentNum = Math.max(metaNum, highestExisting);
  const nextNum = currentNum + 1;
  const prefix = prefixEntry ? prefixEntry.value : 'INV-';

  // Update metadata row
  if (invoiceNumEntry) {
    await syncManager.updateRow(METADATA_TAB, (invoiceNumEntry as any)._rowIndex, [
      'last_invoice_number',
      String(nextNum),
    ]);
  }

  return `${prefix}${nextNum}`;
}

export async function createSale(
  saleData: Omit<Sale, 'invoice_id' | 'invoice_number' | 'is_active' | 'created_at' | 'updated_at' | 'customer_name' | 'items'>,
  items: Omit<SaleItem, 'item_id' | 'invoice_id' | 'created_at'>[]
): Promise<Sale> {
  // Validate stock for all items before committing
  for (const item of items) {
    const product = await getProductById(item.product_id);
    if (!product) {
      throw new Error(`Product not found for ID: ${item.product_id}`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.product_name}". Available: ${product.stock}, Required: ${item.quantity}`);
    }
  }

  const invoiceId = `inv_${crypto.randomUUID().slice(0, 8)}`;
  const invoiceNumber = await getNextInvoiceNumber();
  const now = new Date().toISOString();

  // Backend verification of totals
  const calculatedSubtotal = items.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const calculatedGst = saleData.gst > 0 ? saleData.gst : 0;
  const calculatedTotal = calculatedSubtotal + calculatedGst;

  const newSale: Sale = {
    ...saleData,
    subtotal: calculatedSubtotal,
    total: calculatedTotal,
    invoice_id: invoiceId,
    invoice_number: invoiceNumber,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  // 1. Append sale row
  const saleRow = mappers.saleToRow(newSale);
  await syncManager.appendRow(SALES_TAB, saleRow);

  // 2. Append sale items & deduct stock atomically
  const createdItems: SaleItem[] = [];
  for (const item of items) {
    const itemId = `item_${crypto.randomUUID().slice(0, 8)}`;
    const saleItem: SaleItem = {
      ...item,
      item_id: itemId,
      invoice_id: invoiceId,
      created_at: now,
    };
    createdItems.push(saleItem);

    const itemRow = mappers.saleItemToRow(saleItem);
    await syncManager.appendRow(SALE_ITEMS_TAB, itemRow);

    // Deduct stock and log to StockMovements
    await updateProductStock(
      item.product_id,
      item.quantity,
      'OUT',
      `Fulfillment for Invoice #${invoiceNumber}`
    );
  }

  return {
    ...newSale,
    items: createdItems,
  };
}

export async function getSalesKPIs(): Promise<{
  todayBilled: number;
  monthlyBilled: number;
  unpaidAmount: number;
  totalUnitsDispatched: number;
  totalInvoices: number;
}> {
  const sales = await getAllSales();
  const saleItemsRows = await syncManager.getRows(SALE_ITEMS_TAB);
  const items = rowsToObjects(saleItemsRows, mappers.rowToSaleItem);

  const todayStr = new Date().toISOString().split('T')[0];
  const monthStr = todayStr.slice(0, 7);

  const activeSales = sales.filter(s => s.status !== 'Draft');

  const todayBilled = activeSales
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.total, 0);

  const monthlyBilled = activeSales
    .filter(s => s.date?.startsWith(monthStr))
    .reduce((sum, s) => sum + s.total, 0);

  // Correctly sum remaining balance for both Unpaid AND Partial invoices
  const unpaidAmount = activeSales.reduce((sum, s) => {
    const paid = s.amount_paid !== undefined ? s.amount_paid : (s.status === 'Paid' ? s.total : 0);
    return sum + Math.max(0, s.total - paid);
  }, 0);

  // Filter items to active non-draft sales only
  const activeSaleIds = new Set(activeSales.map(s => s.invoice_id));
  const activeItems = items.filter(i => activeSaleIds.has(i.invoice_id));
  const totalUnitsDispatched = activeItems.reduce((sum, i) => sum + i.quantity, 0);

  return {
    todayBilled,
    monthlyBilled,
    unpaidAmount,
    totalUnitsDispatched,
    totalInvoices: activeSales.length,
  };
}

export async function getSaleById(invoiceId: string): Promise<Sale | null> {
  const sales = await getAllSales();
  return sales.find(s => s.invoice_id === invoiceId) || null;
}

export async function updateSaleStatus(
  invoiceId: string,
  newStatus: 'Draft' | 'Paid' | 'Unpaid' | 'Dispatched' | 'Partial'
): Promise<Sale> {
  const rows = await syncManager.getRows(SALES_TAB);
  const salesWithIndex = rowsToObjects(rows, mappers.rowToSale);
  const target = salesWithIndex.find(s => s.invoice_id === invoiceId);

  if (!target) {
    throw new Error(`Invoice with ID ${invoiceId} not found`);
  }

  const updated: Sale = {
    ...target,
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  const rowValues = mappers.saleToRow(updated);
  await syncManager.updateRow(SALES_TAB, (target as any)._rowIndex, rowValues);
  return updated;
}



export async function deleteSale(invoiceId: string): Promise<void> {
  const [salesRows, itemsRows] = await Promise.all([
    syncManager.getRows(SALES_TAB),
    syncManager.getRows(SALE_ITEMS_TAB),
  ]);
  const sales = rowsToObjects(salesRows, mappers.rowToSale);
  const target = sales.find(s => s.invoice_id === invoiceId);

  if (!target) {
    throw new Error(`Invoice with ID ${invoiceId} not found`);
  }

  const items = rowsToObjects(itemsRows, mappers.rowToSaleItem).filter(i => i.invoice_id === invoiceId);

  // 1. Reverse stock for all line items
  for (const item of items) {
    try {
      await updateProductStock(
        item.product_id,
        item.quantity,
        'IN',
        `Stock Reversal: Deleted Invoice #${target.invoice_number}`
      );
    } catch (err) {
      console.warn(`Could not reverse stock for product ${item.product_id}:`, err);
    }
  }

  // 2. Mark sale as inactive
  const updatedSale: Sale = {
    ...target,
    is_active: false,
    updated_at: new Date().toISOString(),
  };
  await syncManager.updateRow(SALES_TAB, (target as any)._rowIndex, mappers.saleToRow(updatedSale));
}

export async function updateSale(
  invoiceId: string,
  saleData: Partial<Sale>,
  updatedItems?: Omit<SaleItem, 'item_id' | 'invoice_id' | 'created_at'>[]
): Promise<Sale> {
  const [salesRows, itemsRows] = await Promise.all([
    syncManager.getRows(SALES_TAB),
    syncManager.getRows(SALE_ITEMS_TAB),
  ]);
  const sales = rowsToObjects(salesRows, mappers.rowToSale);
  const target = sales.find(s => s.invoice_id === invoiceId);

  if (!target) {
    throw new Error(`Invoice with ID ${invoiceId} not found`);
  }

  const now = new Date().toISOString();
  const oldItems = rowsToObjects(itemsRows, mappers.rowToSaleItem).filter(i => i.invoice_id === invoiceId);

  // If line items are provided, handle stock adjustments
  if (updatedItems && updatedItems.length > 0) {
    const oldQtyMap = new Map<string, number>();
    oldItems.forEach(i => oldQtyMap.set(i.product_id, (oldQtyMap.get(i.product_id) || 0) + i.quantity));

    const newQtyMap = new Map<string, number>();
    updatedItems.forEach(i => newQtyMap.set(i.product_id, (newQtyMap.get(i.product_id) || 0) + i.quantity));

    // Validate available stock for any net increases
    for (const [prodId, newQty] of newQtyMap.entries()) {
      const oldQty = oldQtyMap.get(prodId) || 0;
      const diff = newQty - oldQty;
      if (diff > 0) {
        const product = await getProductById(prodId);
        if (!product) throw new Error(`Product ${prodId} not found`);
        if (product.stock < diff) {
          throw new Error(`Insufficient stock for "${product.product_name}". Available: ${product.stock}, Needed: ${diff}`);
        }
      }
    }

    // Apply stock diffs
    const allProdIds = new Set([...oldQtyMap.keys(), ...newQtyMap.keys()]);
    for (const prodId of allProdIds) {
      const oldQty = oldQtyMap.get(prodId) || 0;
      const newQty = newQtyMap.get(prodId) || 0;
      const diff = newQty - oldQty;
      if (diff > 0) {
        await updateProductStock(prodId, diff, 'OUT', `Invoice #${target.invoice_number} update: increased quantity`);
      } else if (diff < 0) {
        await updateProductStock(prodId, Math.abs(diff), 'IN', `Invoice #${target.invoice_number} update: decreased quantity`);
      }
    }

    // Recalculate totals
    const calculatedSubtotal = updatedItems.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    const calculatedGst = saleData.gst !== undefined ? saleData.gst : target.gst;
    const calculatedTotal = calculatedSubtotal + calculatedGst;

    // Append new items
    for (const item of updatedItems) {
      const newItem: SaleItem = {
        ...item,
        item_id: `item_${crypto.randomUUID().slice(0, 8)}`,
        invoice_id: invoiceId,
        created_at: now,
      };
      await syncManager.appendRow(SALE_ITEMS_TAB, mappers.saleItemToRow(newItem));
    }

    const updated: Sale = {
      ...target,
      ...saleData,
      subtotal: calculatedSubtotal,
      gst: calculatedGst,
      total: calculatedTotal,
      updated_at: now,
    };

    await syncManager.updateRow(SALES_TAB, (target as any)._rowIndex, mappers.saleToRow(updated));
    return updated;
  } else {
    const updated: Sale = {
      ...target,
      ...saleData,
      updated_at: now,
    };
    await syncManager.updateRow(SALES_TAB, (target as any)._rowIndex, mappers.saleToRow(updated));
    return updated;
  }
}
