/**
 * In-Memory Sliding-Window Rate Limiter
 * Protects public forms & authentication routes from spam and brute-force attacks.
 */

import { headers } from "next/headers";

interface RateLimitTracker {
  timestamps: number[];
}

const trackerMap = new Map<string, RateLimitTracker>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, tracker] of trackerMap.entries()) {
      // Remove timestamps older than 1 hour
      tracker.timestamps = tracker.timestamps.filter(
        (ts) => now - ts < 3600000,
      );
      if (tracker.timestamps.length === 0) {
        trackerMap.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Checks rate limit for a given key
 * @param key Unique identifier (e.g. "booking_192.168.1.1")
 * @param maxHits Maximum allowed hits within duration
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxHits = 5,
  windowMs = 600000, // 10 minutes default
): RateLimitResult {
  const now = Date.now();
  const tracker = trackerMap.get(key) || { timestamps: [] };

  // Filter out timestamps outside current sliding window
  const validTimestamps = tracker.timestamps.filter(
    (ts) => now - ts < windowMs,
  );

  if (validTimestamps.length >= maxHits) {
    const oldest = validTimestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      success: false,
      limit: maxHits,
      remaining: 0,
      resetMs,
    };
  }

  validTimestamps.push(now);
  trackerMap.set(key, { timestamps: validTimestamps });

  return {
    success: true,
    limit: maxHits,
    remaining: maxHits - validTimestamps.length,
    resetMs: windowMs,
  };
}

/**
 * Extracts client IP address from Next.js request headers
 */
export async function getClientIp(): Promise<string> {
  try {
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    const realIp = headerList.get("x-real-ip");
    if (realIp) {
      return realIp.trim();
    }
  } catch {
    // Header access fallback
  }
  return "127.0.0.1";
}
