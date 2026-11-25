export type DentlyJobType =
  "EMAIL_DISPATCH" | "SUBSCRIPTION_CHECK" | "AUDIT_LOG" | "QUEUE_NUMBER_RESET";

export interface EmailDispatchPayload {
  to: string;
  subject: string;
  html: string;
  clinicId?: string;
  templateType?: string;
}

export interface SubscriptionCheckPayload {
  timestamp: number;
}

export interface AuditLogPayload {
  clinicId: string;
  action: string;
  userId?: string;
  details?: Record<string, unknown>;
}

export interface QueueResetPayload {
  clinicId: string;
  date: string;
}

export type JobPayloadMap = {
  EMAIL_DISPATCH: EmailDispatchPayload;
  SUBSCRIPTION_CHECK: SubscriptionCheckPayload;
  AUDIT_LOG: AuditLogPayload;
  QUEUE_NUMBER_RESET: QueueResetPayload;
};
