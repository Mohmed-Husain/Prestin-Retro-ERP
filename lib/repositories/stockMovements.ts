import crypto from 'crypto';
import { syncManager } from '../sync';
import { mappers, rowsToObjects } from '../sheetMappings';
import { StockMovement } from '../types';

const TAB_NAME = 'StockMovements';

export async function getAllStockMovements(productId?: string): Promise<StockMovement[]> {
  const rows = await syncManager.getRows(TAB_NAME);
  const movements = rowsToObjects(rows, mappers.rowToStockMovement);
  if (productId) {
    return movements.filter(m => m.product_id === productId);
  }
  return movements.reverse(); // Latest first
}

export async function recordStockMovement(
  data: Omit<StockMovement, 'movement_id' | 'created_at'>
): Promise<StockMovement> {
  const movementId = `mov_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();

  const newMovement: StockMovement = {
    ...data,
    movement_id: movementId,
    created_at: now,
  };

  const row = mappers.stockMovementToRow(newMovement);
  await syncManager.appendRow(TAB_NAME, row);
  return newMovement;
}
