/**
 * Async Non-Blocking Notification Queue
 * Decouples SMTP/SMS/Push notifications from UI server action execution
 */

type JobType =
  | "APPOINTMENT_CONFIRMATION"
  | "INSTALLMENT_REMINDER"
  | "INQUIRY_ALERT"
  | "AUDIT_LOG";

interface NotificationJob {
  id: string;
  type: JobType;
  clinicId: string;
  payload: Record<string, unknown>;
  createdAt: Date;
  retryCount: number;
}

class NotificationQueue {
  private queue: NotificationJob[] = [];
  private processing = false;

  public enqueue(
    type: JobType,
    clinicId: string,
    payload: Record<string, unknown>,
  ) {
    const job: NotificationJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      type,
      clinicId,
      payload,
      createdAt: new Date(),
      retryCount: 0,
    };

    this.queue.push(job);
    // Non-blocking trigger
    setTimeout(() => this.processQueue(), 10);
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) break;

      try {
        await this.executeJob(job);
      } catch (error) {
        console.error(`[NotificationQueue] Job ${job.id} failed:`, error);
        if (job.retryCount < 3) {
          job.retryCount++;
          this.queue.push(job);
        }
      }
    }

    this.processing = false;
  }

  private async executeJob(job: NotificationJob) {
    // Execute job asynchronously based on type
    switch (job.type) {
      case "APPOINTMENT_CONFIRMATION":
        // Process appointment notification async
        break;
      case "INSTALLMENT_REMINDER":
        // Process installment payment reminder async
        break;
      case "INQUIRY_ALERT":
        // Process public inquiry notification async
        break;
      case "AUDIT_LOG":
        // Process audit log write async
        break;
    }
  }
}

const globalForQueue = globalThis as unknown as {
  notificationQueue: NotificationQueue;
};

export const notificationQueue =
  globalForQueue.notificationQueue || new NotificationQueue();

if (process.env.NODE_ENV !== "production") {
  globalForQueue.notificationQueue = notificationQueue;
}
