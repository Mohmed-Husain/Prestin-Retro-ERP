import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { Sale, SaleItem } from '../types';
import { updateProductStock, getProductById } from './products';

const SALES_TAB = 'Sales';
const SALE_ITEMS_TAB = 'SaleItems';
const METADATA_TAB = 'Metadata';

export async function getAllSales(includeInactive = false): Promise<Sale[]> {
  const [salesRows, itemsRows, customersRows] = await Promise.all([
    syncManager.getRows(SALES_TAB),
    syncManager.getRows(SALE_ITEMS_TAB),
    syncManager.getRows('Customers'),
  ]);

  const sales = rowsToObjects(salesRows, mappers.rowToSale);
  const items = rowsToObjects(itemsRows, mappers.rowToSaleItem);
  const customers = rowsToObjects(customersRows, mappers.rowToCustomer);

  const activeSales = includeInactive ? sales : sales.filter(s => s.is_active);

  return activeSales.map(sale => {
    const saleItems = items.filter(i => i.invoice_id === sale.invoice_id);
    const customer = customers.find(c => c.customer_id === sale.customer_id);

    return {
      ...sale,
      customer_name: customer ? customer.name : 'Unknown Buyer',
      items: saleItems,
    };
  }).reverse(); // Most recent first
}

export async function getNextInvoiceNumber(): Promise<string> {
  const rows = await syncManager.getRows(METADATA_TAB);
  const meta = rowsToObjects(rows, mappers.rowToMetadata);
  const invoiceNumEntry = meta.find(m => m.key === 'last_invoice_number');
  const prefixEntry = meta.find(m => m.key === 'invoice_prefix');

  const currentNum = invoiceNumEntry ? parseInt(invoiceNumEntry.value, 10) || 1000 : 1000;
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

  const newSale: Sale = {
    ...saleData,
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

  const todayBilled = sales
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.total, 0);

  const monthlyBilled = sales
    .filter(s => s.date?.startsWith(monthStr))
    .reduce((sum, s) => sum + s.total, 0);

  const unpaidAmount = sales
    .filter(s => s.status === 'Unpaid')
    .reduce((sum, s) => sum + s.total, 0);

  const totalUnitsDispatched = items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    todayBilled,
    monthlyBilled,
    unpaidAmount,
    totalUnitsDispatched,
    totalInvoices: sales.length,
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

