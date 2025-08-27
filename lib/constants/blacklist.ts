/**
 * Blacklisted token addresses that should not be shown in the UI
 * Add token addresses here to hide them from all frontend displays
 */

export const BLACKLISTED_TOKENS = new Set<string>([
  // Add lowercase token addresses here, e.g.:
  // "0x1234...".toLowerCase(),
  "0x9d28d48c7a6001d6245ce1d2467b8e39f21d8d3a".toLowerCase(),
]);

/**
 * Check if a token address is blacklisted
 * @param address Token address to check
 * @returns true if the token is blacklisted
 */
export function isTokenBlacklisted(address: string | undefined | null): boolean {
  if (!address) return false;
  return BLACKLISTED_TOKENS.has(address.toLowerCase());
}

/**
 * Filter out blacklisted tokens from an array
 * @param tokens Array of tokens with address field
 * @returns Filtered array without blacklisted tokens
 */
export function filterBlacklistedTokens<T extends { address?: string; token?: string }>(tokens: T[]): T[] {
  return tokens.filter(item => {
    const address = item.address || item.token;
    return !isTokenBlacklisted(address);
  });
}