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
  return newPayment;
}
