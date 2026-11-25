import { Worker, Job } from "bullmq";
import { processJob } from "../lib/queue/job-processor";
import type { DentlyJobType } from "../lib/queue/bull-queue";

const QUEUE_NAME = "dently-background-jobs";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

function getWorkerConnection() {
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

console.log(
  `[DentlyWorker] Starting background worker for queue: "${QUEUE_NAME}" on ${REDIS_URL}...`,
);

export const dentlyWorker = new Worker(
  QUEUE_NAME,
  async (job: Job) => {
    const start = Date.now();
    console.log(`[DentlyWorker] Processing job "${job.name}" (ID: ${job.id})`);
    try {
      await processJob(job.name as DentlyJobType, job.data);
      console.log(
        `[DentlyWorker] Completed job "${job.name}" (ID: ${job.id}) in ${Date.now() - start}ms`,
      );
    } catch (error) {
      console.error(
        `[DentlyWorker] Error processing job "${job.name}" (ID: ${job.id}):`,
        error,
      );
      throw error;
    }
  },
  {
    connection: getWorkerConnection(),
    concurrency: 5, // Concurrent job workers
    limiter: {
      max: 20, // Max 20 jobs per second rate limit
      duration: 1000,
    },
  },
);

dentlyWorker.on("completed", (job) => {
  console.log(`[DentlyWorker] Job ${job.id} completed successfully`);
});

dentlyWorker.on("failed", (job, err) => {
  console.error(
    `[DentlyWorker] Job ${job?.id} failed with error: ${err.message}`,
  );
});

dentlyWorker.on("error", (err) => {
  console.warn(`[DentlyWorker] Redis connection error: ${err.message}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[DentlyWorker] SIGTERM received. Closing worker...");
  await dentlyWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[DentlyWorker] SIGINT received. Closing worker...");
  await dentlyWorker.close();
  process.exit(0);
});
