import { Product, StockMovement, Customer, Payment, Sale, SaleItem, Expense, MetadataSetting, ExpenseCategory } from './types';

export function rowsToObjects<T>(rows: string[][], mapFn: (row: string[], index: number) => T | null): T[] {
  if (!rows || rows.length <= 1) return [];
  const dataRows = rows.slice(1);
  const results: T[] = [];
  dataRows.forEach((row, idx) => {
    const item = mapFn(row, idx + 2); // 1-indexed sheet row
    if (item !== null) {
      results.push(item);
    }
  });
  return results;
}

export const mappers = {
  rowToProduct(row: string[], rowIndex: number): (Product & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    const isActive = row[12] === undefined || row[12] === '' || String(row[12]).toUpperCase() === 'TRUE';
    return {
      _rowIndex: rowIndex,
      product_id: row[0] || '',
      sku: row[1] || '',
      product_name: row[2] || '',
      category: row[3] || 'General',
      color: row[4] || '',
      size: row[5] || '',
      cost_price: Number(row[6]) || 0,
      selling_price: Number(row[7]) || 0,
      stock: Number(row[8]) || 0,
      min_stock: Number(row[9]) || 0,
      fabric_gsm: row[10] || '',
      description: row[11] || '',
      is_active: isActive,
      created_at: row[13] || new Date().toISOString(),
      updated_at: row[14] || new Date().toISOString(),
    };
  },

  productToRow(product: Product): (string | number | boolean)[] {
    return [
      product.product_id,
      product.sku,
      product.product_name,
      product.category,
      product.color,
      product.size,
      product.cost_price,
      product.selling_price,
      product.stock,
      product.min_stock,
      product.fabric_gsm,
      product.description,
      product.is_active ? 'TRUE' : 'FALSE',
      product.created_at,
      product.updated_at,
    ];
  },

  rowToStockMovement(row: string[], rowIndex: number): (StockMovement & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    return {
      _rowIndex: rowIndex,
      movement_id: row[0] || '',
      product_id: row[1] || '',
      sku: row[2] || '',
      type: (row[3] as any) || 'ADJUST',
      qty: Number(row[4]) || 0,
      reason: row[5] || '',
      date: row[6] || '',
      created_at: row[7] || new Date().toISOString(),
    };
  },

  stockMovementToRow(movement: StockMovement): (string | number | boolean)[] {
    return [
      movement.movement_id,
      movement.product_id,
      movement.sku,
      movement.type,
      movement.qty,
      movement.reason,
      movement.date,
      movement.created_at,
    ];
  },

  rowToCustomer(row: string[], rowIndex: number): (Customer & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    const isActive = row[7] === undefined || row[7] === '' || String(row[7]).toUpperCase() === 'TRUE';
    return {
      _rowIndex: rowIndex,
      customer_id: row[0] || '',
      name: row[1] || '',
      phone: row[2] || '',
      gst: row[3] || '',
      address: row[4] || '',
      tier: row[5] || 'Regular',
      credit_limit: Number(row[6]) || 0,
      is_active: isActive,
      created_at: row[8] || new Date().toISOString(),
      updated_at: row[9] || new Date().toISOString(),
      contact_person: row[10] || '',
      email: row[11] || '',
      credit_days: Number(row[12]) || 15,
    };
  },

  customerToRow(customer: Customer): (string | number | boolean)[] {
    return [
      customer.customer_id,
      customer.name,
      customer.phone,
      customer.gst,
      customer.address,
      customer.tier,
      customer.credit_limit,
      customer.is_active ? 'TRUE' : 'FALSE',
      customer.created_at,
      customer.updated_at,
      customer.contact_person || '',
      customer.email || '',
      customer.credit_days || 15,
    ];
  },

  rowToPayment(row: string[], rowIndex: number): (Payment & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    return {
      _rowIndex: rowIndex,
      payment_id: row[0] || '',
      customer_id: row[1] || '',
      amount: Number(row[2]) || 0,
      method: row[3] || 'Cash',
      date: row[4] || '',
      notes: row[5] || '',
      reference: row[6] || '',
      created_at: row[7] || new Date().toISOString(),
    };
  },

  paymentToRow(payment: Payment): (string | number | boolean)[] {
    return [
      payment.payment_id,
      payment.customer_id,
      payment.amount,
      payment.method,
      payment.date,
      payment.notes,
      payment.reference,
      payment.created_at,
    ];
  },

  rowToSale(row: string[], rowIndex: number): (Sale & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    const isActive = row[8] === undefined || row[8] === '' || String(row[8]).toUpperCase() === 'TRUE';
    return {
      _rowIndex: rowIndex,
      invoice_id: row[0] || '',
      invoice_number: row[1] || '',
      customer_id: row[2] || '',
      date: row[3] || '',
      subtotal: Number(row[4]) || 0,
      gst: Number(row[5]) || 0,
      total: Number(row[6]) || 0,
      status: (row[7] as any) || 'Unpaid',
      is_active: isActive,
      created_at: row[9] || new Date().toISOString(),
      updated_at: row[10] || new Date().toISOString(),
    };
  },

  saleToRow(sale: Sale): (string | number | boolean)[] {
    return [
      sale.invoice_id,
      sale.invoice_number,
      sale.customer_id,
      sale.date,
      sale.subtotal,
      sale.gst,
      sale.total,
      sale.status,
      sale.is_active ? 'TRUE' : 'FALSE',
      sale.created_at,
      sale.updated_at,
    ];
  },

  rowToSaleItem(row: string[], rowIndex: number): (SaleItem & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    return {
      _rowIndex: rowIndex,
      item_id: row[0] || '',
      invoice_id: row[1] || '',
      product_id: row[2] || '',
      sku: row[3] || '',
      quantity: Number(row[4]) || 0,
      cost_price: Number(row[5]) || 0,
      selling_price: Number(row[6]) || 0,
      created_at: row[7] || new Date().toISOString(),
    };
  },

  saleItemToRow(item: SaleItem): (string | number | boolean)[] {
    return [
      item.item_id,
      item.invoice_id,
      item.product_id,
      item.sku,
      item.quantity,
      item.cost_price,
      item.selling_price,
      item.created_at,
    ];
  },

  rowToExpense(row: string[], rowIndex: number): (Expense & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    const isActive = row[7] === undefined || row[7] === '' || String(row[7]).toUpperCase() === 'TRUE';
    return {
      _rowIndex: rowIndex,
      expense_id: row[0] || '',
      title: row[1] || '',
      category: row[2] || 'Other',
      amount: Number(row[3]) || 0,
      payment_method: row[4] || 'Cash',
      date: row[5] || '',
      notes: row[6] || '',
      is_active: isActive,
      created_at: row[8] || new Date().toISOString(),
      updated_at: row[9] || new Date().toISOString(),
      type: (row[10] as any) === 'INCOMING' ? 'INCOMING' : 'OUTGOING',
    };
  },

  expenseToRow(expense: Expense): (string | number | boolean)[] {
    return [
      expense.expense_id,
      expense.title,
      expense.category,
      expense.amount,
      expense.payment_method,
      expense.date,
      expense.notes,
      expense.is_active ? 'TRUE' : 'FALSE',
      expense.created_at,
      expense.updated_at,
      expense.type || 'OUTGOING',
    ];
  },

  rowToMetadata(row: string[], rowIndex: number): (MetadataSetting & { _rowIndex: number }) | null {
    if (!row[0]) return null;
    return {
      _rowIndex: rowIndex,
      key: row[0] || '',
      value: row[1] || '',
    };
  },

  rowToExpenseCategory(row: string[], rowIndex: number): (ExpenseCategory & { _rowIndex: number }) | null {
    if (!row[0] && !row[1]) return null;
    const isActive = row[3] === undefined || row[3] === '' || String(row[3]).toUpperCase() === 'TRUE';
    return {
      _rowIndex: rowIndex,
      category_id: row[0] || '',
      name: row[1] || '',
      icon: row[2] || 'DollarSign',
      is_active: isActive,
      created_at: row[4] || new Date().toISOString(),
    };
  },

  expenseCategoryToRow(category: ExpenseCategory): (string | number | boolean)[] {
    return [
      category.category_id,
      category.name,
      category.icon,
      category.is_active ? 'TRUE' : 'FALSE',
      category.created_at,
    ];
  },
};
