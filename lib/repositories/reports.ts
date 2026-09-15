import { getAllProducts } from './products';
import { getAllSales } from './sales';
import { getAllExpenses } from './expenses';
import { DashboardKPIs, MonthlyReportData } from '../types';
import { syncManager } from '../sync';
import { rowsToObjects, mappers } from '../sheetMappings';

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [products, sales, expenses, saleItemsRows] = await Promise.all([
    getAllProducts(),
    getAllSales(),
    getAllExpenses(),
    syncManager.getRows('SaleItems'),
  ]);

  const saleItems = rowsToObjects(saleItemsRows, mappers.rowToSaleItem);

  // Current date context (simulated or live: May 2025 matches seed data)
  const now = new Date();
  const currentMonthStr = now.toISOString().slice(0, 7);
  const todayStr = now.toISOString().split('T')[0];

  // 1. Today's sales
  const todaySales = sales
    .filter(s => s.date === todayStr)
    .reduce((sum, s) => sum + s.total, 0);

  // 2. Monthly sales
  const thisMonthSales = sales
    .filter(s => s.date?.startsWith(currentMonthStr))
    .reduce((sum, s) => sum + s.total, 0);

  const effectiveMonthlySales = thisMonthSales;

  // 3. COGS & Gross Profit
  const cogs = saleItems.reduce((sum, item) => sum + (item.cost_price || 0) * (item.quantity || 0), 0);
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const grossProfit = Math.max(0, totalRevenue - cogs);

  // 4. Expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // 5. Net Profit
  const netProfit = Math.max(0, grossProfit - totalExpenses);

  // 6. Expense breakdown by category
  const expenseCatMap = new Map<string, number>();
  expenses.forEach(e => {
    expenseCatMap.set(e.category, (expenseCatMap.get(e.category) || 0) + e.amount);
  });
  const expenseBreakdown = Array.from(expenseCatMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
  }));

  // 7. Low Stock Items (stock <= min_stock)
  const lowStockItems = products
    .filter(p => p.stock <= p.min_stock)
    .slice(0, 5);

  // 8. Top Selling Products
  const prodSalesMap = new Map<string, { units_sold: number; revenue: number; sku: string; name: string }>();
  saleItems.forEach(item => {
    const existing = prodSalesMap.get(item.product_id) || {
      units_sold: 0,
      revenue: 0,
      sku: item.sku,
      name: products.find(p => p.product_id === item.product_id)?.product_name || item.sku,
    };
    existing.units_sold += item.quantity;
    existing.revenue += item.selling_price * item.quantity;
    prodSalesMap.set(item.product_id, existing);
  });

  const topSellingProducts = Array.from(prodSalesMap.entries())
    .map(([product_id, data]) => ({
      product_id,
      product_name: data.name,
      sku: data.sku,
      units_sold: data.units_sold,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.units_sold - a.units_sold)
    .slice(0, 5);

  // 9. Sales trend
  const salesTrend = [
    { month: 'Current', sales: effectiveMonthlySales },
  ];

  // 10. Recent Sales
  const recentSales = sales.slice(0, 5).map(s => ({
    ...s,
    customer_name: s.customer_name || 'Buyer',
  }));

  return {
    todaySales,
    todaySalesChange: 0,
    monthlySales: effectiveMonthlySales,
    monthlySalesChange: 0,
    grossProfit,
    grossProfitChange: 0,
    netProfit,
    netProfitChange: 0,
    totalExpenses,
    totalExpensesChange: 0,
    salesTrend,
    expenseBreakdown,
    lowStockItems,
    topSellingProducts,
    recentSales,
  };
}

export async function getMonthlyReportsData(): Promise<MonthlyReportData> {
  const [products, sales, expenses, saleItemsRows] = await Promise.all([
    getAllProducts(),
    getAllSales(),
    getAllExpenses(),
    syncManager.getRows('SaleItems'),
  ]);

  const saleItems = rowsToObjects(saleItemsRows, mappers.rowToSaleItem);

  // Filter only active transactions
  const activeSales = sales.filter(s => s.status !== 'Draft');
  const activeExpenses = expenses.filter(e => e.is_active);

  // Revenue = Sales Total
  const totalSales = activeSales.reduce((sum, s) => sum + s.total, 0);

  // Expenses = Expense Total
  const totalExpenses = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  // COGS = SaleItems Cost
  const cogs = saleItems.reduce((sum, item) => sum + (item.cost_price || 0) * (item.quantity || 0), 0);

  // Gross Profit = Revenue - COGS
  const grossProfit = Math.max(0, totalSales - cogs);

  // Net Profit = Gross Profit - Expenses
  const netProfit = Math.max(0, grossProfit - totalExpenses);

  // Sales Trend (grouped by date)
  const salesByDate = new Map<string, number>();
  activeSales.forEach(s => {
    const d = s.date || '';
    if (d) salesByDate.set(d, (salesByDate.get(d) || 0) + s.total);
  });
  const salesTrend = Array.from(salesByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sales]) => ({ date: date.slice(5) || date, sales }));

  // Expense Trend (grouped by date)
  const expenseByDate = new Map<string, number>();
  activeExpenses.forEach(e => {
    const d = e.date || '';
    if (d) expenseByDate.set(d, (expenseByDate.get(d) || 0) + e.amount);
  });
  const expenseTrend = Array.from(expenseByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date: date.slice(5) || date, amount }));

  // Combined Sales vs Expenses Trend
  const allDates = Array.from(new Set([...salesByDate.keys(), ...expenseByDate.keys()])).sort();
  const salesVsExpenses = allDates.map(date => ({
    date: date.slice(5) || date,
    sales: salesByDate.get(date) || 0,
    expenses: expenseByDate.get(date) || 0,
  }));

  // Expense breakdown
  const expenseCatMap = new Map<string, number>();
  activeExpenses.forEach(e => {
    expenseCatMap.set(e.category, (expenseCatMap.get(e.category) || 0) + e.amount);
  });
  const expenseBreakdown = Array.from(expenseCatMap.entries()).map(([category, amount]) => ({
    category,
    amount,
    percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
  }));

  // Sales by Category
  const catSalesMap = new Map<string, number>();
  saleItems.forEach(item => {
    const prod = products.find(p => p.product_id === item.product_id);
    const cat = prod?.category || 'Others';
    catSalesMap.set(cat, (catSalesMap.get(cat) || 0) + item.selling_price * item.quantity);
  });
  const catTotal = Array.from(catSalesMap.values()).reduce((a, b) => a + b, 0) || 1;
  const salesByCategory = Array.from(catSalesMap.entries()).map(([category, amt]) => ({
    category,
    percentage: Math.round((amt / catTotal) * 100),
  }));

  const monthlyProfitTrend = [
    { month: 'Current', profit: netProfit },
  ];

  return {
    totalSales,
    totalExpenses,
    cogs,
    grossProfit,
    netProfit,
    totalInvoices: activeSales.length,
    salesTrend,
    expenseTrend,
    salesVsExpenses,
    expenseBreakdown,
    topSellingProducts: [],
    salesByCategory,
    monthlyProfitTrend,
    bestMonth: {
      month: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      netProfit,
    },
  };
}

