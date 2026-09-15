import { ExpenseCategory } from '../types';
import { syncManager } from '../sync';
import { rowsToObjects, mappers } from '../sheetMappings';

const TAB_NAME = 'ExpenseCategories';

export async function getAllExpenseCategories(includeInactive = false): Promise<ExpenseCategory[]> {
  const rows = await syncManager.getRows(TAB_NAME);
  const categories = rowsToObjects(rows, mappers.rowToExpenseCategory);

  if (includeInactive) return categories;
  return categories.filter(c => c.is_active);
}

export async function createExpenseCategory(name: string, icon = 'DollarSign'): Promise<ExpenseCategory> {
  const categoryId = `cat_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newCat: ExpenseCategory = {
    category_id: categoryId,
    name: name.trim(),
    icon: icon || 'DollarSign',
    is_active: true,
    created_at: now,
  };

  const row = mappers.expenseCategoryToRow(newCat);
  await syncManager.appendRow(TAB_NAME, row);
  return newCat;
}
