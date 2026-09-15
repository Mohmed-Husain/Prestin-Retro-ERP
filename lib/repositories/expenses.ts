import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { Expense, ExpenseKPIs } from '../types';

const TAB_NAME = 'Expenses';

export async function getAllExpenses(includeInactive = false): Promise<Expense[]> {
  const rows = await syncManager.getRows(TAB_NAME);
  const expenses = rowsToObjects(rows, mappers.rowToExpense);
  const activeExpenses = includeInactive ? expenses : expenses.filter(e => e.is_active);
  return activeExpenses.reverse(); // Latest first
}

export async function createExpense(
  data: Omit<Expense, 'expense_id' | 'is_active' | 'created_at' | 'updated_at'>
): Promise<Expense> {
  const expenseId = `exp_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newExpense: Expense = {
    ...data,
    expense_id: expenseId,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const row = mappers.expenseToRow(newExpense);
  await syncManager.appendRow(TAB_NAME, row);
  return newExpense;
}

export async function getExpenseKPIs(): Promise<ExpenseKPIs> {
  const expenses = await getAllExpenses();

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const monthStr = now.toISOString().slice(0, 7);

  const activeExpenses = expenses.filter(e => e.is_active);

  const todayExpenses = activeExpenses
    .filter(e => e.date === todayStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const thisMonthExpenses = activeExpenses
    .filter(e => e.date?.startsWith(monthStr))
    .reduce((sum, e) => sum + e.amount, 0);

  // Group by category for donut breakdown
  const catMap = new Map<string, number>();
  activeExpenses.forEach(e => {
    catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
  });

  const totalExpenseAmount = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  const breakdown = Array.from(catMap.entries()).map(([name, amount]) => ({
    name,
    amount,
    percentage: totalExpenseAmount > 0 ? Math.round((amount / totalExpenseAmount) * 100) : 0,
  }));

  // Group expenses by YYYY-MM for real dynamic trend
  const monthTrendMap = new Map<string, number>();
  activeExpenses.forEach(e => {
    if (e.date) {
      const m = e.date.slice(0, 7);
      monthTrendMap.set(m, (monthTrendMap.get(m) || 0) + e.amount);
    }
  });

  const sortedMonths = Array.from(monthTrendMap.keys()).sort();
  const trend = sortedMonths.length > 0
    ? sortedMonths.map(m => {
        const [year, month] = m.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short' });
        return { month: monthLabel, amount: monthTrendMap.get(m) || 0 };
      })
    : [{ month: now.toLocaleDateString('en-US', { month: 'short' }), amount: thisMonthExpenses }];

  const uniqueMonthsCount = Math.max(1, new Set(activeExpenses.map(e => e.date?.slice(0, 7)).filter(Boolean)).size);
  const monthlyAverage = totalExpenseAmount > 0 ? Math.round(totalExpenseAmount / uniqueMonthsCount) : 0;

  return {
    todayExpenses,
    todayChange: 0,
    thisMonthExpenses,
    thisMonthChange: 0,
    monthlyAverage,
    monthlyAverageChange: 0,
    totalThisYear: totalExpenseAmount,
    totalThisYearChange: 0,
    trend,
    breakdown,
  };
}