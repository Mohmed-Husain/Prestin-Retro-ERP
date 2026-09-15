import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { Payment } from '../types';

const TAB_NAME = 'Payments';

export async function getAllPayments(customerId?: string): Promise<Payment[]> {
  const rows = await syncManager.getRows(TAB_NAME);
  const payments = rowsToObjects(rows, mappers.rowToPayment);
  if (customerId) {
    return payments.filter(p => p.customer_id === customerId);
  }
  return payments;
}

export async function recordPayment(
  data: Omit<Payment, 'payment_id' | 'created_at'>
): Promise<Payment> {
  const paymentId = `pay_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newPayment: Payment = {
    ...data,
    payment_id: paymentId,
    created_at: now,
  };

  const row = mappers.paymentToRow(newPayment);
  await syncManager.appendRow(TAB_NAME, row);

  // Auto-settle oldest unpaid sales for this customer
  try {
    const salesRows = await syncManager.getRows('Sales');
    const salesWithIndex = rowsToObjects(salesRows, mappers.rowToSale);
    const customerSales = salesWithIndex
      .filter(s => s.customer_id === data.customer_id && s.is_active && s.status !== 'Draft')
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Total cumulative payments for this customer
    const allPayments = await getAllPayments(data.customer_id);
    let remainingPaidBalance = allPayments.reduce((sum, p) => sum + p.amount, 0);

    for (const sale of customerSales) {
      if (remainingPaidBalance >= sale.total) {
        if (sale.status !== 'Paid') {
          const updatedSale = { ...sale, status: 'Paid' as const, updated_at: now };
          await syncManager.updateRow('Sales', (sale as any)._rowIndex, mappers.saleToRow(updatedSale));
        }
        remainingPaidBalance -= sale.total;
      } else if (remainingPaidBalance > 0) {
        if (sale.status !== 'Partial') {
          const updatedSale = { ...sale, status: 'Partial' as const, updated_at: now };
          await syncManager.updateRow('Sales', (sale as any)._rowIndex, mappers.saleToRow(updatedSale));
        }
        remainingPaidBalance = 0;
      } else {
        if (sale.status !== 'Unpaid' && sale.status !== 'Dispatched') {
          const updatedSale = { ...sale, status: 'Unpaid' as const, updated_at: now };
          await syncManager.updateRow('Sales', (sale as any)._rowIndex, mappers.saleToRow(updatedSale));
        }
      }
    }
  } catch (err) {
    console.error('Failed to auto-reconcile invoices during payment:', err);
  }

  return newPayment;
}
