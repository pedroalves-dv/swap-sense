import type { CachedData } from '../@types/currency';

export const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Get cached data from localStorage
 * @param key - The cache key
 * @returns The cached data or null if expired/invalid
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp }: CachedData<T> = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }

    // Cache expired, remove it
    localStorage.removeItem(key);
    return null;
  } catch {
    return null;
  }
}

/**
 * Set cached data in localStorage
 * @param key - The cache key
 * @param data - The data to cache
 * @param base - Optional base currency for exchange rates
 */
export function setCachedData<T>(key: string, data: T, base?: string): void {
  try {
    const cacheObject: CachedData<T> = {
      data,
      timestamp: Date.now(),
      ...(base && { base }),
    };
    localStorage.setItem(key, JSON.stringify(cacheObject));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded)
  }
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (
        key.startsWith('exchange_rates_') ||
        key.startsWith('currency_list_')
      ) {
        const cached = localStorage.getItem(key);
        if (cached) {
          try {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp >= CACHE_DURATION) {
              localStorage.removeItem(key);
            }
          } catch {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch {
    // Ignore errors
  }
}
