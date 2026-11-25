import { Queue, QueueOptions } from "bullmq";
import type {
  DentlyJobType,
  EmailDispatchPayload,
  SubscriptionCheckPayload,
  AuditLogPayload,
  QueueResetPayload,
  JobPayloadMap,
} from "./types";

export type {
  DentlyJobType,
  EmailDispatchPayload,
  SubscriptionCheckPayload,
  AuditLogPayload,
  QueueResetPayload,
  JobPayloadMap,
};

const QUEUE_NAME = "dently-background-jobs";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function getQueueConnection(): QueueOptions["connection"] {
  try {
    const url = new URL(REDIS_URL);
    return {
      host: url.hostname || "localhost",
      port: parseInt(url.port || "6379"),
      password: url.password ? decodeURIComponent(url.password) : undefined,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  }
}

const globalForQueue = globalThis as unknown as {
  bullQueue: Queue | null;
  queueInitFailed: boolean;
};

export function getBullQueue(): Queue | null {
  if (globalForQueue.queueInitFailed) {
    return null;
  }

  if (!globalForQueue.bullQueue) {
    try {
      globalForQueue.bullQueue = new Queue(QUEUE_NAME, {
        connection: getQueueConnection(),
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1500,
          },
          removeOnComplete: {
            age: 86400, // 24 hours retention
            count: 500,
          },
          removeOnFail: {
            age: 604800, // 7 days retention for failed jobs debugging
            count: 1000,
          },
        },
      });

      globalForQueue.bullQueue.on("error", (err) => {
        if (!globalForQueue.queueInitFailed) {
          console.warn(
            `[BullMQ] Queue warning (${REDIS_URL}): ${err.message}. Running fallback mode.`,
          );
          globalForQueue.queueInitFailed = true;
        }
      });
    } catch {
      globalForQueue.queueInitFailed = true;
      return null;
    }
  }

  return globalForQueue.bullQueue;
}

/**
 * Enqueue a background job with automatic fallback to immediate execution if Redis is unavailable
 */
export async function enqueueClinicEmail(params: {
  clinicId: string;
  to: string;
  subject: string;
  html: string;
  templateType?: string;
}): Promise<string> {
  return enqueueJob("EMAIL_DISPATCH", {
    clinicId: params.clinicId,
    to: params.to,
    subject: params.subject,
    html: params.html,
    templateType: params.templateType,
  });
}

export async function enqueuePlatformEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<string> {
  return enqueueJob("EMAIL_DISPATCH", {
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

export async function enqueueJob<T extends DentlyJobType>(
  jobType: T,
  payload: JobPayloadMap[T],
  opts?: { delay?: number; priority?: number },
): Promise<string> {
  const queue = getBullQueue();

  if (queue) {
    try {
      const job = await queue.add(jobType, payload, {
        delay: opts?.delay,
        priority: opts?.priority,
      });
      return job.id || `job_${Date.now()}`;
    } catch (err) {
      console.warn(
        `[BullMQ] Failed to enqueue ${jobType}, executing fallback:`,
        err,
      );
    }
  }

  // Graceful fallback: Execute synchronously/immediately in-process
  runFallbackJob(jobType, payload);
  return `fallback_${Date.now()}`;
}

async function runFallbackJob(jobType: DentlyJobType, payload: unknown) {
  try {
    const { processJob } = await import("./job-processor");
    await processJob(jobType, payload);
  } catch (err) {
    console.error(`[FallbackQueue] Failed executing ${jobType}:`, err);
  }
}
