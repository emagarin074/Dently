/**
 * Async Non-Blocking Notification Queue
 * Decouples SMTP/SMS/Push notifications from UI server action execution via BullMQ and in-memory queue
 */

import { enqueueJob } from "./bull-queue";

type JobType =
  | "APPOINTMENT_CONFIRMATION"
  | "INSTALLMENT_REMINDER"
  | "INQUIRY_ALERT"
  | "AUDIT_LOG";

class NotificationQueue {
  public enqueue(
    type: JobType,
    clinicId: string,
    payload: Record<string, unknown>,
  ) {
    if (type === "AUDIT_LOG") {
      enqueueJob("AUDIT_LOG", {
        clinicId,
        action: String(payload.action || "AUDIT"),
        userId: payload.userId ? String(payload.userId) : undefined,
        details: payload,
      }).catch((err) => {
        console.warn("[NotificationQueue] Failed enqueueing audit job:", err);
      });
      return;
    }

    if (payload.email && typeof payload.email === "string") {
      enqueueJob("EMAIL_DISPATCH", {
        to: payload.email,
        subject: String(payload.subject || "Clinic Notification"),
        html: String(payload.html || ""),
        clinicId,
        templateType: type,
      }).catch((err) => {
        console.warn("[NotificationQueue] Failed enqueueing email job:", err);
      });
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
