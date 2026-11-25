import { getRedis } from "@/lib/redis";

interface MemoryCacheEntry {
  data: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryCacheEntry>();

// Clean up expired entries in memory every 60 seconds
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (entry.expiresAt <= now) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
  if (cleanupTimer.unref) {
    cleanupTimer.unref();
  }
}

/**
 * Cache retrieval with automatic miss fetcher and TTL
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached !== null) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Redis error fallback to in-memory
    }
  } else {
    const inMem = memoryStore.get(key);
    if (inMem && inMem.expiresAt > Date.now()) {
      return JSON.parse(inMem.data) as T;
    }
  }

  // Fetch fresh value
  const freshValue = await fetcher();

  if (freshValue !== undefined && freshValue !== null) {
    const serialized = JSON.stringify(freshValue);

    if (redis) {
      try {
        await redis.setex(key, ttlSeconds, serialized);
      } catch {
        // Fallback to memory
        memoryStore.set(key, {
          data: serialized,
          expiresAt: Date.now() + ttlSeconds * 1000,
        });
      }
    } else {
      memoryStore.set(key, {
        data: serialized,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  }

  return freshValue;
}

/**
 * Invalidate a single cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  memoryStore.delete(key);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      console.warn(`[Cache] Error invalidating ${key}:`, err);
    }
  }
}

/**
 * Invalidate all cache keys belonging to a specific clinic
 */
export async function invalidateClinicCache(
  clinicIdentifier: string,
): Promise<void> {
  const prefix = `dently:clinic:${clinicIdentifier}`;

  // Clear in-memory
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix) || key.includes(clinicIdentifier)) {
      memoryStore.delete(key);
    }
  }

  // Clear Redis keys matching pattern
  const redis = getRedis();
  if (redis) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.warn(
        `[Cache] Error invalidating clinic ${clinicIdentifier}:`,
        err,
      );
    }
  }
}

/**
 * Standard Cache Key Builders for Multi-Tenant Data
 */
export const TenantCacheKeys = {
  clinicMetadata: (slug: string) => `dently:clinic:${slug}:meta`,
  clinicPublicWebsite: (slug: string) => `dently:clinic:${slug}:website`,
  clinicProcedures: (clinicId: string) =>
    `dently:clinic:${clinicId}:procedures`,
  clinicEntitlements: (clinicId: string) =>
    `dently:clinic:${clinicId}:entitlements`,
  platformStats: () => "dently:platform:overview_stats",
};
