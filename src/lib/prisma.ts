import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_SIZE || "20"),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (
  !globalForPrisma.prisma ||
  typeof (globalForPrisma.prisma as unknown as Record<string, unknown>)
    .compensationProgram === "undefined"
) {
  if (
    process.env.NODE_ENV === "development" &&
    typeof require !== "undefined" &&
    require.cache
  ) {
    Object.keys(require.cache).forEach((key) => {
      if (key.includes("@prisma") || key.includes(".prisma")) {
        delete require.cache[key];
      }
    });
  }
  globalForPrisma.prisma = createPrismaClient();
}

export const prisma = globalForPrisma.prisma;
