import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { Customer, CustomerKPIs, Sale, Payment } from '../types';
import { getAllPayments } from './payments';

const TAB_NAME = 'Customers';

export async function getAllCustomers(includeInactive = false): Promise<Customer[]> {
  const rows = await syncManager.getRows(TAB_NAME);
  const customers = rowsToObjects(rows, mappers.rowToCustomer);
  const activeCustomers = includeInactive ? customers : customers.filter(c => c.is_active);

  // Fetch sales and payments to calculate live balances
  const [salesRows, payments] = await Promise.all([
    syncManager.getRows('Sales'),
    getAllPayments(),
  ]);
  const sales = rowsToObjects(salesRows, mappers.rowToSale).filter(s => s.is_active);

  return activeCustomers.map(customer => {
    const customerSales = sales.filter(s => s.customer_id === customer.customer_id);
    const customerPayments = payments.filter(p => p.customer_id === customer.customer_id);

    const totalBilled = customerSales.reduce((sum, s) => sum + s.total, 0);
    const totalPaid = customerPayments.reduce((sum, p) => sum + p.amount, 0);
    // Allow negative outstanding to represent advance credit / overpayment
    const outstanding = totalBilled - totalPaid;

    // Overdue status logic: if customer has outstanding and has an unpaid sale > 15 days
    let overdueStatus: 'healthy' | 'due_soon' | 'overdue' = 'healthy';
    if (outstanding > 50000) {
      overdueStatus = 'overdue';
    } else if (outstanding > 0) {
      overdueStatus = 'due_soon';
    }

    return {
      ...customer,
      total_billed: totalBilled,
      total_paid: totalPaid,
      outstanding,
      overdue_status: overdueStatus,
    };
  });
}

export async function getCustomerById(customerId: string): Promise<Customer | null> {
  const customers = await getAllCustomers(true);
  return customers.find(c => c.customer_id === customerId) || null;
}

export async function createCustomer(
  data: Omit<Customer, 'customer_id' | 'is_active' | 'created_at' | 'updated_at'>
): Promise<Customer> {
  const customerId = `cust_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newCustomer: Customer = {
    ...data,
    customer_id: customerId,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const row = mappers.customerToRow(newCustomer);
  await syncManager.appendRow(TAB_NAME, row);
  return newCustomer;
}

export async function updateCustomer(customerId: string, updates: Partial<Customer>): Promise<Customer> {
  const rows = await syncManager.getRows(TAB_NAME);
  const customersWithIndex = rowsToObjects(rows, mappers.rowToCustomer);
  const target = customersWithIndex.find(c => c.customer_id === customerId);

  if (!target) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  const updated: Customer = {
    ...target,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  const rowValues = mappers.customerToRow(updated);
  await syncManager.updateRow(TAB_NAME, (target as any)._rowIndex, rowValues);
  return updated;
}

export async function getCustomerKPIs(): Promise<CustomerKPIs> {
  const customers = await getAllCustomers();
  const payments = await getAllPayments();

  const totalBuyers = customers.length;
  // Total receivables: sum outstanding only from buyers who owe money
  const totalOutstanding = customers
    .filter(c => (c.outstanding || 0) > 0)
    .reduce((sum, c) => sum + (c.outstanding || 0), 0);
  const creditExtended = customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = todayStr.slice(0, 7);
  const collectedThisMonth = payments
    .filter(p => p.date?.startsWith(currentMonth))
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueCount = customers.filter(c => c.overdue_status === 'overdue').length;

  return {
    totalBuyers,
    totalOutstanding,
    collectedThisMonth,
    creditExtended,
    avgSettlementDays: 0, // Calculated dynamically when historical collection cycles exist
    overdueCount,
  };
}

export async function getCustomerLedger(customerId: string): Promise<{
  customer: Customer | null;
  sales: Sale[];
  payments: Payment[];
}> {
  const customer = await getCustomerById(customerId);
  const [salesRows, saleItemsRows, payments] = await Promise.all([
    syncManager.getRows('Sales'),
    syncManager.getRows('SaleItems'),
    getAllPayments(customerId),
  ]);

  const sales = rowsToObjects(salesRows, mappers.rowToSale)
    .filter(s => s.customer_id === customerId && s.is_active);
  const items = rowsToObjects(saleItemsRows, mappers.rowToSaleItem);

  const salesWithItems = sales.map(s => ({
    ...s,
    items: items.filter(i => i.invoice_id === s.invoice_id),
  })).reverse();

  return {
    customer,
    sales: salesWithItems,
    payments: payments.reverse(),
  };
}
