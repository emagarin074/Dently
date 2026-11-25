import { prisma } from "@/lib/prisma";
import { sendClinicEmail, sendPlatformEmail } from "@/lib/email";
import { invalidateClinicCache } from "@/lib/cache/tenant-cache";
import type {
  DentlyJobType,
  EmailDispatchPayload,
  AuditLogPayload,
  QueueResetPayload,
} from "./types";

export async function processJob(
  jobType: DentlyJobType,
  payload: unknown,
): Promise<void> {
  switch (jobType) {
    case "EMAIL_DISPATCH": {
      const data = payload as EmailDispatchPayload;
      if (data.clinicId) {
        // Fetch clinic SMTP settings
        const settings = await prisma.clinicSettings.findUnique({
          where: { clinicId: data.clinicId },
        });

        await sendClinicEmail({
          clinicSettings: settings,
          to: data.to,
          subject: data.subject,
          html: data.html,
        });
      } else {
        await sendPlatformEmail({
          to: data.to,
          subject: data.subject,
          html: data.html,
        });
      }
      break;
    }

    case "SUBSCRIPTION_CHECK": {
      // Periodic check for expired clinic subscriptions
      const now = new Date();
      const expiredClinics = await prisma.clinic.findMany({
        where: {
          isActive: true,
          planExpiresAt: {
            lt: now,
          },
        },
        select: { id: true, slug: true, name: true },
      });

      for (const clinic of expiredClinics) {
        console.log(
          `[SubscriptionWorker] Auto-suspending expired clinic: ${clinic.name} (${clinic.slug})`,
        );
        await prisma.clinic.update({
          where: { id: clinic.id },
          data: { isActive: false },
        });
        await invalidateClinicCache(clinic.slug);
      }
      break;
    }

    case "AUDIT_LOG": {
      const data = payload as AuditLogPayload;
      console.log(
        `[AuditWorker] [${new Date().toISOString()}] Clinic: ${data.clinicId} | Action: ${data.action}`,
        data.details,
      );
      break;
    }

    case "QUEUE_NUMBER_RESET": {
      const data = payload as QueueResetPayload;
      console.log(
        `[QueueWorker] Resetting daily queue counters for clinic: ${data.clinicId} on ${data.date}`,
      );
      await invalidateClinicCache(data.clinicId);
      break;
    }

    default:
      console.warn(`[JobProcessor] Unhandled job type: ${jobType}`);
  }
}
