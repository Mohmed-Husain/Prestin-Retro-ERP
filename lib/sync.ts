import { readSheetRows, appendSheetRow, appendSheetRows, updateSheetRow, batchUpdateSheetValues, clearSheetData, overwriteSheetRows } from './googleSheets';

interface CacheEntry {
  data: string[][];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 45 * 1000; // 45 seconds TTL

/**
 * Centralized Sync Manager
 * Provides cached reading, cache invalidation, and retry-resilient writes to Google Sheets.
 */
export const syncManager = {
  /**
   * Fetches rows from cache or live Google Sheets with TTL caching.
   */
  async getRows(tabName: string, forceRefresh = false): Promise<string[][]> {
    const cached = cache.get(tabName);
    const now = Date.now();

    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const rows = await syncManager.retry(() => readSheetRows(tabName));
    cache.set(tabName, { data: rows, timestamp: now });
    return rows;
  },

  /**
   * Invalidates cache for a specific tab or all tabs.
   */
  invalidateCache(tabName?: string) {
    if (tabName) {
      cache.delete(tabName);
    } else {
      cache.clear();
    }
  },

  /**
   * Appends a row with retry logic and immediately invalidates cache.
   */
  async appendRow(tabName: string, values: (string | number | boolean)[]): Promise<void> {
    await syncManager.retry(() => appendSheetRow(tabName, values));
    syncManager.invalidateCache(tabName);
  },

  /**
   * Appends multiple rows in a single batch API call and invalidates cache.
   */
  async appendRows(tabName: string, rows: (string | number | boolean)[][]): Promise<void> {
    if (rows.length === 0) return;
    await syncManager.retry(() => appendSheetRows(tabName, rows));
    syncManager.invalidateCache(tabName);
  },

  /**
   * Updates a specific row with retry logic and invalidates cache.
   */
  async updateRow(tabName: string, rowIndex1Indexed: number, values: (string | number | boolean)[]): Promise<void> {
    await syncManager.retry(() => updateSheetRow(tabName, rowIndex1Indexed, values));
    syncManager.invalidateCache(tabName);
  },

  /**
   * Batch updates values with retry logic and invalidates cache.
   */
  async batchUpdate(data: { range: string; values: (string | number | boolean)[][] }[], affectedTabs: string[]): Promise<void> {
    await syncManager.retry(() => batchUpdateSheetValues(data));
    affectedTabs.forEach(tab => syncManager.invalidateCache(tab));
  },

  /**
   * Clears all rows from row 2 onwards in a sheet tab and invalidates cache.
   */
  async clearTab(tabName: string): Promise<void> {
    await syncManager.retry(() => clearSheetData(tabName));
    syncManager.invalidateCache(tabName);
  },

  /**
   * Overwrites all rows from row 2 onwards in a sheet tab and invalidates cache.
   */
  async overwriteTab(tabName: string, rows: (string | number | boolean)[][]): Promise<void> {
    await syncManager.retry(() => overwriteSheetRows(tabName, rows));
    syncManager.invalidateCache(tabName);
  },

  /**
   * Exponential backoff retry handler for network / Google Sheets API resilience.
   */
  async retry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries <= 1) {
        console.error('Max sync retries exceeded:', error);
        throw error;
      }
      console.warn(`Sync failed, retrying in ${delayMs}ms (${retries - 1} retries left)...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return syncManager.retry(fn, retries - 1, delayMs * 2);
    }
  },
};
