export interface Product {
  product_id: string;
  sku: string;
  product_name: string;
  category: string;
  color: string;
  size: string;
  cost_price: number;
  selling_price: number;
  stock: number;
  min_stock: number;
  fabric_gsm: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export interface StockMovement {
  movement_id: string;
  product_id: string;
  sku: string;
  type: StockMovementType;
  qty: number;
  reason: string;
  date: string;
  created_at: string;
}

export interface Customer {
  customer_id: string;
  name: string;
  phone: string;
  gst: string;
  address: string;
  tier: string;
  credit_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  contact_person?: string;
  email?: string;
  // Computed fields
  total_billed?: number;
  total_paid?: number;
  outstanding?: number;
  overdue_status?: 'healthy' | 'due_soon' | 'overdue';
}

export interface CustomerKPIs {
  totalBuyers: number;
  totalOutstanding: number;
  collectedThisMonth: number;
  creditExtended: number;
  avgSettlementDays: number;
  overdueCount: number;
}

export interface SalesKPIs {
  todayBilled: number;
  monthlyBilled: number;
  unpaidAmount: number;
  totalUnitsDispatched: number;
  totalInvoices: number;
}

export interface ExpenseKPIs {
  todayExpenses: number;
  todayChange: number;
  thisMonthExpenses: number;
  thisMonthChange: number;
  monthlyAverage: number;
  monthlyAverageChange: number;
  totalThisYear: number;
  totalThisYearChange: number;
  trend: { month: string; amount: number }[];
  breakdown: { name: string; amount: number; percentage: number }[];
}

export interface MonthlyReportData {
  totalSales: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalInvoices: number;
  salesVsExpenses: { date: string; sales: number; expenses: number }[];
  expenseBreakdown: { category: string; amount: number; percentage: number }[];
  topSellingProducts: { rank: number; name: string; units_sold: number; revenue: number }[];
  salesByCategory: { category: string; percentage: number }[];
  monthlyProfitTrend: { month: string; profit: number }[];
  bestMonth: { month: string; netProfit: number };
}

export interface Payment {
  payment_id: string;
  customer_id: string;
  amount: number;
  method: string;
  date: string;
  notes: string;
  reference: string;
  created_at: string;
}

export interface Sale {
  invoice_id: string;
  invoice_number: string;
  customer_id: string;
  date: string;
  subtotal: number;
  gst: number;
  total: number;
  status: 'Draft' | 'Paid' | 'Unpaid' | 'Dispatched' | 'Partial';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined / computed
  customer_name?: string;
  items?: SaleItem[];
}

export interface ExpenseCategory {
  category_id: string;
  name: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface SaleItem {
  item_id: string;
  invoice_id: string;
  product_id: string;
  sku: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  created_at: string;
  product_name?: string;
}

export interface Expense {
  expense_id: string;
  title: string;
  category: string;
  amount: number;
  payment_method: string;
  date: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetadataSetting {
  key: string;
  value: string;
}

export interface InventoryKPIs {
  totalSkus: number;
  totalUnits: number;
  inventoryValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  categories: { name: string; count: number }[];
}

export interface DashboardKPIs {
  todaySales: number;
  todaySalesChange: number;
  monthlySales: number;
  monthlySalesChange: number;
  grossProfit: number;
  grossProfitChange: number;
  netProfit: number;
  netProfitChange: number;
  totalExpenses: number;
  totalExpensesChange: number;
  salesTrend: { month: string; sales: number }[];
  expenseBreakdown: { category: string; amount: number; percentage: number }[];
  lowStockItems: Product[];
  topSellingProducts: {
    product_id: string;
    product_name: string;
    sku: string;
    units_sold: number;
    revenue: number;
  }[];
  recentSales: (Sale & { customer_name: string })[];
}

export interface MonthlyReportData {
  totalSales: number;
  totalExpenses: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  totalInvoices: number;
  salesTrend: { date: string; sales: number }[];
  expenseTrend: { date: string; amount: number }[];
  salesVsExpenses: { date: string; sales: number; expenses: number }[];
  expenseBreakdown: { category: string; amount: number; percentage: number }[];
  topSellingProducts: { rank: number; name: string; units_sold: number; revenue: number }[];
  salesByCategory: { category: string; percentage: number }[];
  monthlyProfitTrend: { month: string; profit: number }[];
  bestMonth: { month: string; netProfit: number };
}
