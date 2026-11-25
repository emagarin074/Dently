import Redis, { RedisOptions } from "ioredis";

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | null;
  redisFailed: boolean;
};

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export function getRedisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) {
        // Stop spamming reconnect attempts if Redis is not running
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  };
}

export function createRedisClient(): Redis | null {
  if (globalForRedis.redisFailed) {
    return null;
  }

  try {
    const client = new Redis(REDIS_URL, getRedisOptions());

    client.on("error", (err) => {
      // Gracefully prevent unhandled exceptions if Redis is absent in local dev
      if (!globalForRedis.redisFailed) {
        console.warn(
          `[Redis] Connection warning (${REDIS_URL}): ${err.message}. Falling back to in-memory mode.`,
        );
      }
      globalForRedis.redisFailed = true;
    });

    client.on("connect", () => {
      globalForRedis.redisFailed = false;
    });

    return client;
  } catch {
    console.warn(
      "[Redis] Failed to initialize client. Using in-memory fallback.",
    );
    globalForRedis.redisFailed = true;
    return null;
  }
}

export function getRedis(): Redis | null {
  if (globalForRedis.redisFailed) {
    return null;
  }
  if (!globalForRedis.redisClient) {
    globalForRedis.redisClient = createRedisClient();
  }
  return globalForRedis.redisClient;
}

export const redis = getRedis();
