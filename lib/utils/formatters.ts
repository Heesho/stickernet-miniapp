/**
 * Utility functions for formatting numbers with proper commas and decimals
 */

/**
 * Formats a number with commas for thousands separators
 * @param value - The number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @param includeDecimals - Whether to include decimal places (default: true)
 * @returns Formatted string with commas
 */
export function formatNumber(
  value: number | string | undefined | null,
  decimals: number = 2,
  includeDecimals: boolean = true,
  useCompact: boolean = true  // Default to compact format (K, M, B)
): string {
  if (value === undefined || value === null) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  // Only use compact format for stats/display purposes, not transaction amounts
  if (useCompact) {
    // Handle very large numbers
    if (num >= 1e9) {
      return (num / 1e9).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + 'B';
    }
    
    if (num >= 1e6) {
      return (num / 1e6).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + 'M';
    }
    
    if (num >= 1e3) {
      return (num / 1e3).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + 'K';
    }
  }
  
  // Regular formatting with commas (for all transaction amounts)
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: includeDecimals ? decimals : 0,
    maximumFractionDigits: includeDecimals ? decimals : 0
  };
  
  return num.toLocaleString('en-US', options);
}

/**
 * Formats a currency value with dollar sign and commas
 * @param value - The number or string to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with dollar sign
 */
export function formatCurrency(
  value: number | string | undefined | null,
  decimals: number = 2,
  useCompact: boolean = true  // Default to compact format (K, M, B)
): string {
  const formatted = formatNumber(value, decimals, true, useCompact);
  return `$${formatted}`;
}

/**
 * Formats token amounts with appropriate decimal places
 * For large token amounts (like millions of PENGU), shows with commas
 * @param value - The token amount
 * @param symbol - The token symbol (optional)
 * @param decimals - Number of decimal places (default: 2 for small amounts, 0 for large)
 * @returns Formatted token string
 */
export function formatTokenAmount(
  value: number | string | undefined | null,
  symbol?: string,
  decimals?: number,
  useCompact: boolean = true  // Default to compact format (K, M, B)
): string {
  if (value === undefined || value === null) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  // Determine decimal places based on value if not specified
  let decimalPlaces = decimals;
  if (decimalPlaces === undefined) {
    if (num >= 1000) {
      decimalPlaces = 0; // No decimals for large numbers
    } else if (num >= 1) {
      decimalPlaces = 2; // 2 decimals for regular amounts
    } else {
      decimalPlaces = 4; // More decimals for very small amounts
    }
  }
  
  const formatted = formatNumber(num, decimalPlaces, decimalPlaces > 0, useCompact);
  
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Formats percentage values
 * @param value - The percentage value (already in percentage form, e.g., 5.5 for 5.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number | string | undefined | null,
  decimals: number = 2
): string {
  const formatted = formatNumber(value, decimals, true);
  return `${formatted}%`;
}

/**
 * Formats a number for AnimatedNumber component (no currency symbol)
 * @param value - The number to format
 * @param useCompact - Whether to use K/M/B notation
 * @returns Formatted string without currency symbol
 */
export function formatForAnimatedNumber(
  value: number | string | undefined | null,
  useCompact: boolean = true
): string {
  if (value === undefined || value === null) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (useCompact) {
    if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
  }
  
  return num.toFixed(2);
}

/**
 * Formats compact numbers for display (e.g., 1.2K, 3.4M)
 * @param value - The number to format
 * @returns Formatted compact string
 */
export function formatCompact(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return '0';
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  
  return num.toFixed(0);
}