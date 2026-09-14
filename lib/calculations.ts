/**
 * Formats a number as an Indian Rupee string (e.g. ₹ 18,45,000 or ₹ 24,560)
 */
export function formatCurrency(amount: number, showDecimals = false): string {
  if (isNaN(amount)) return '₹ 0';
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);

  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  });

  return `${isNegative ? '-' : ''}₹ ${formatted}`;
}

/**
 * Formats numbers compactly (e.g. 1.11L, 14.85L)
 */
export function formatCompactCurrency(amount: number): string {
  if (isNaN(amount)) return '₹ 0';
  if (amount >= 10000000) {
    return `₹ ${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹ ${(amount / 100000).toFixed(2)} L`;
  }
  if (amount >= 1000) {
    return `₹ ${(amount / 1000).toFixed(1)}k`;
  }
  return formatCurrency(amount);
}

/**
 * Calculates Gross Margin Percentage: ((Selling - Cost) / Selling) * 100
 */
export function calculateGrossMargin(costPrice: number, sellingPrice: number): number {
  if (!sellingPrice || sellingPrice <= 0) return 0;
  return Number((((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1));
}

/**
 * Calculates percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
