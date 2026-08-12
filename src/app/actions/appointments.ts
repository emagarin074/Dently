"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  sendClinicEmail,
  bookingConfirmationEmail,
  appointmentConfirmedEmail,
  appointmentRescheduledEmail,
  bookingDeclinedEmail,
  appointmentCancelledEmail,
} from "@/lib/email";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { AppointmentStatus } from "@prisma/client";
import { getOpenDays, isDayOpen, getDayName } from "@/lib/operating-days";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// ─── helpers ──────────────────────────────────────────────────────────────────

function revalidateAppointmentPaths(slug: string) {
  revalidatePath(`/clinic/${slug}/admin/bookings`);
  revalidatePath(`/clinic/${slug}/admin`);
}

async function nextQueueNumber(clinicId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Use a raw query with FOR UPDATE to prevent race conditions
  const result = await prisma.$queryRaw<{ max_num: number | null }[]>`
    SELECT MAX("queueNumber") as max_num
    FROM "QueueEntry"
    WHERE "clinicId" = ${clinicId}
      AND "date" >= ${today}
      AND "date" < ${tomorrow}
    FOR UPDATE
  `;
  return (result[0]?.max_num ?? 0) + 1;
}

// ─── public booking ───────────────────────────────────────────────────────────

const bookingSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  contactNumber: z.string().min(7, "Contact number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  serviceType: z.string().min(1, "Service type is required"),
  preferredDate: z.string().min(1, "Preferred date is required"),
  preferredDentistId: z.string().optional(),
  additionalConcern: z.string().optional(),
});

export async function createPublicBooking(
  clinicSlug: string,
  formData: FormData,
) {
  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`booking_${ip}_${clinicSlug}`, 5, 600000);
  if (!rateCheck.success) {
    const mins = Math.ceil(rateCheck.resetMs / 60000);
    return {
      error: `Too many booking attempts. Please wait ${mins} minute(s) before trying again.`,
    };
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug, isActive: true },
    include: { settings: true },
  });
  if (!clinic) return { error: "Clinic not found." };

  const raw = {
    fullName: formData.get("fullName") as string,
    contactNumber: formData.get("contactNumber") as string,
    email: (formData.get("email") as string) || "",
    serviceType: formData.get("serviceType") as string,
    preferredDate: formData.get("preferredDate") as string,
    preferredDentistId:
      (formData.get("preferredDentistId") as string) || undefined,
    additionalConcern:
      (formData.get("additionalConcern") as string) || undefined,
  };

  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const {
    fullName,
    contactNumber,
    email,
    serviceType,
    preferredDate,
    preferredDentistId,
    additionalConcern,
  } = parsed.data;

  // ── Check for operating days ──────────────────────────────────────────────
  const openDays = getOpenDays(clinic.settings?.operatingHours);
  if (!isDayOpen(preferredDate, openDays)) {
    const dayName = getDayName(new Date(preferredDate + "T00:00:00").getDay());
    return {
      error: `The clinic is closed on ${dayName}s. Please choose an open operating day.`,
    };
  }

  // ── Check for blocked dates ──────────────────────────────────────────────
  const dateToCheck = new Date(preferredDate);
  const block = await prisma.calendarBlock.findFirst({
    where: {
      clinicId: clinic.id,
      startDate: { lte: dateToCheck },
      endDate: { gte: dateToCheck },
    },
  });
  if (block) {
    return {
      error: `This date is unavailable (${block.title}). Please choose another date.`,
    };
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        clinicId: clinic.id,
        bookingName: fullName,
        bookingPhone: contactNumber,
        bookingEmail: email || null,
        serviceType,
        preferredDate: new Date(preferredDate),
        dentistId: preferredDentistId || null,
        bookingConcern: additionalConcern || null,
        source: "ONLINE",
        status: clinic.settings?.autoConfirmBookings ? "CONFIRMED" : "PENDING",
      },
    });

    if (email) {
      try {
        const emailResult = await sendClinicEmail({
          to: email,
          subject: `Booking Received – ${clinic.name}`,
          html: bookingConfirmationEmail({
            clinicName: clinic.name,
            patientName: fullName,
            preferredDate,
            service: serviceType,
          }),
          clinicSettings: clinic.settings,
          clinicName: clinic.name,
        });

        if (!emailResult.success) {
          console.warn(
            "[Booking Email Skipped/Failed]:",
            emailResult.error || emailResult.reason,
          );
        } else {
          console.log(
            "[Booking Email Success]: Sent booking confirmation email to",
            email,
          );
        }
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError);
      }
    }

    return { success: true, appointmentId: appointment.id };
  } catch (error) {
    console.error("Create public booking error:", error);
    return { error: "Failed to create booking. Please try again." };
  }
}

// ─── confirm / cancel / reschedule ────────────────────────────────────────────

const VALID_STATUSES: string[] = Object.values(AppointmentStatus);

export async function updateAppointmentStatus(
  clinicSlug: string,
  appointmentId: string,
  status: string,
  data?: {
    dentistId?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    cancelReason?: string;
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." };

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        dentist: { select: { name: true } },
        clinic: { include: { settings: true } },
      },
    });

    if (!existing) return { error: "Appointment not found." };

    if (data?.scheduledDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(data.scheduledDate + "T00:00:00");

      if (targetDate < today) {
        return { error: "Cannot schedule an appointment for a past date." };
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId, clinicId: user.clinicId },
      data: {
        status: status as AppointmentStatus,
        ...(data?.dentistId && { dentistId: data.dentistId }),
        ...(data?.scheduledDate && {
          scheduledDate: new Date(data.scheduledDate),
        }),
        ...(data?.scheduledTime && { scheduledTime: data.scheduledTime }),
        ...(data?.cancelReason && { cancelReason: data.cancelReason }),
      },
    });

    // ── Email Trigger ──────────────────────────────────────────────────────────
    const patientEmail = existing.patient?.email || existing.bookingEmail;
    const patientName = existing.patient
      ? `${existing.patient.firstName} ${existing.patient.lastName}`
      : existing.bookingName || "Patient";

    if (patientEmail && existing.clinic) {
      const clinicName = existing.clinic.name;
      const clinicSettings = existing.clinic.settings;

      if (status === "CONFIRMED" && existing.status !== "CONFIRMED") {
        const apptDate = updated.scheduledDate || updated.preferredDate;
        const formattedDate = new Date(apptDate).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        await sendClinicEmail({
          to: patientEmail,
          subject: `Appointment Confirmed – ${clinicName}`,
          html: appointmentConfirmedEmail({
            clinicName,
            patientName,
            date: formattedDate,
            time: updated.scheduledTime || undefined,
            dentistName: existing.dentist?.name || undefined,
            address: existing.clinic.address || undefined,
          }),
          clinicSettings,
          clinicName,
        });
      } else if (status === "CANCELLED" && existing.status !== "CANCELLED") {
        const reason = data?.cancelReason || updated.cancelReason || undefined;

        if (existing.status === "PENDING") {
          // Declined Pending Request
          await sendClinicEmail({
            to: patientEmail,
            subject: `Booking Request Update – ${clinicName}`,
            html: bookingDeclinedEmail({
              clinicName,
              patientName,
              reason,
            }),
            clinicSettings,
            clinicName,
          });
        } else {
          // Canceled Confirmed Appointment
          await sendClinicEmail({
            to: patientEmail,
            subject: `Appointment Canceled – ${clinicName}`,
            html: appointmentCancelledEmail({
              clinicName,
              patientName,
              reason,
            }),
            clinicSettings,
            clinicName,
          });
        }
      }
    } else {
      console.log(
        `[Email Skipped] No patient email for appointment ${appointmentId}`,
      );
    }

    revalidateAppointmentPaths(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Update appointment status error:", error);
    return { error: "Failed to update appointment." };
  }
}

export async function rescheduleAppointment(
  clinicSlug: string,
  appointmentId: string,
  newDate: string,
  newTime?: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const existing = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        clinic: { include: { settings: true } },
      },
    });

    if (!existing) return { error: "Appointment not found." };

    // ── Past Date & Operating Days Validation ─────────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(newDate + "T00:00:00");

    if (targetDate < today) {
      return {
        error:
          "Cannot reschedule to a past date. Please select today or a future date.",
      };
    }

    const openDays = getOpenDays(existing.clinic?.settings?.operatingHours);
    if (!isDayOpen(newDate, openDays)) {
      const dayName = getDayName(targetDate.getDay());
      return {
        error: `The clinic is closed on ${dayName}s. Please select an open operating day.`,
      };
    }

    await prisma.appointment.update({
      where: { id: appointmentId, clinicId: user.clinicId },
      data: {
        preferredDate: new Date(newDate),
        scheduledDate: new Date(newDate),
        ...(newTime && { scheduledTime: newTime }),
        status: "CONFIRMED",
      },
    });

    const patientEmail = existing.patient?.email || existing.bookingEmail;
    const patientName = existing.patient
      ? `${existing.patient.firstName} ${existing.patient.lastName}`
      : existing.bookingName || "Patient";

    if (patientEmail && existing.clinic) {
      const formattedDate = new Date(newDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await sendClinicEmail({
        to: patientEmail,
        subject: `Appointment Rescheduled – ${existing.clinic.name}`,
        html: appointmentRescheduledEmail({
          clinicName: existing.clinic.name,
          patientName,
          newDate: formattedDate,
          newTime,
        }),
        clinicSettings: existing.clinic.settings,
        clinicName: existing.clinic.name,
      });
    }

    revalidateAppointmentPaths(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Reschedule appointment error:", error);
    return { error: "Failed to reschedule appointment." };
  }
}

// ─── check in ─────────────────────────────────────────────────────────────────

export async function checkInAppointment(
  clinicSlug: string,
  appointmentId: string,
  dentistId?: string | null,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: { patient: true, queueEntry: true },
    });
    if (!appointment) return { error: "Appointment not found" };
    if (appointment.status === "CANCELLED")
      return { error: "Cannot check in a cancelled appointment" };
    if (appointment.status === "COMPLETED")
      return { error: "Appointment is already completed" };
    if (appointment.queueEntry)
      return { error: "Patient is already checked in" };

    const patientName = appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : appointment.bookingName || "Walk-in Patient";

    const finalDentistId =
      dentistId !== undefined && dentistId !== "none"
        ? dentistId
        : appointment.dentistId;

    // Use transaction to atomically get queue number and create entry
    await prisma.$transaction(async (tx) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const last = await tx.queueEntry.findFirst({
        where: { clinicId: user.clinicId, date: { gte: today, lt: tomorrow } },
        orderBy: { queueNumber: "desc" },
      });
      const queueNumber = (last?.queueNumber ?? 0) + 1;

      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: "CHECKED_IN",
          ...(finalDentistId ? { dentistId: finalDentistId } : {}),
        },
      });

      await tx.queueEntry.create({
        data: {
          clinicId: user.clinicId,
          appointmentId,
          patientName,
          queueNumber,
          status: "WAITING",
          date: new Date(),
        },
      });
    });

    revalidateAppointmentPaths(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Check-in error:", error);
    return { error: "Failed to check in patient." };
  }
}

// ─── manual / walk-in booking ─────────────────────────────────────────────────

export async function createManualBooking(
  clinicSlug: string,
  formData: FormData,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const patientId = formData.get("patientId") as string | null;
  const dentistId = formData.get("dentistId") as string | null;
  const preferredDate = formData.get("preferredDate") as string;
  const scheduledTime = formData.get("scheduledTime") as string | null;
  const serviceType = formData.get("serviceType") as string;
  const notes = formData.get("notes") as string | null;
  const isWalkIn = formData.get("isWalkIn") === "true";
  const bookingName = formData.get("bookingName") as string | null;

  if (!preferredDate) return { error: "Date is required" };
  if (!serviceType) return { error: "Service type is required" };

  const todayStr = new Date().toISOString().split("T")[0];
  const preferredDateStr = preferredDate.split("T")[0];
  const isToday = preferredDateStr === todayStr;

  // Walk-in check-in (queue entry) is ONLY valid if preferredDate is TODAY.
  const effectiveWalkIn = isWalkIn && isToday;

  // ── Check for operating days & blocked dates for non-same-day walk-ins ────────
  if (!effectiveWalkIn) {
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    const openDays = getOpenDays(settings?.operatingHours);

    if (!isDayOpen(preferredDate, openDays)) {
      const dayName = getDayName(
        new Date(preferredDate + "T00:00:00").getDay(),
      );
      return {
        error: `The clinic is closed on ${dayName}s. Please choose an open operating day.`,
      };
    }

    const dateToCheck = new Date(preferredDate);
    const block = await prisma.calendarBlock.findFirst({
      where: {
        clinicId: user.clinicId,
        startDate: { lte: dateToCheck },
        endDate: { gte: dateToCheck },
      },
    });
    if (block) {
      return {
        error: `This date is unavailable (${block.title}). Please choose another date.`,
      };
    }
  }

  try {
    if (effectiveWalkIn) {
      // Walk-in for TODAY: create appointment + queue entry atomically
      const patientName = bookingName || "Walk-in Patient";

      let queueNum = 0;
      await prisma.$transaction(async (tx) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const last = await tx.queueEntry.findFirst({
          where: {
            clinicId: user.clinicId,
            date: { gte: today, lt: tomorrow },
          },
          orderBy: { queueNumber: "desc" },
        });
        queueNum = (last?.queueNumber ?? 0) + 1;

        const appointment = await tx.appointment.create({
          data: {
            clinicId: user.clinicId,
            patientId: patientId || null,
            dentistId: dentistId || null,
            bookingName: patientName,
            serviceType,
            preferredDate: new Date(preferredDate),
            scheduledDate: new Date(preferredDate),
            scheduledTime: scheduledTime || null,
            notes: notes || null,
            status: "CHECKED_IN",
            source: "WALK_IN",
            isWalkIn: true,
          },
        });

        await tx.queueEntry.create({
          data: {
            clinicId: user.clinicId,
            appointmentId: appointment.id,
            patientName,
            queueNumber: queueNum,
            status: "WAITING",
            date: new Date(),
          },
        });
      });

      revalidateAppointmentPaths(clinicSlug);
      return { success: true, queueNumber: queueNum };
    }

    // Regular manual scheduled booking (future date or scheduled mode)
    await prisma.appointment.create({
      data: {
        clinicId: user.clinicId,
        patientId: patientId || null,
        dentistId: dentistId || null,
        bookingName: bookingName || null,
        serviceType,
        preferredDate: new Date(preferredDate),
        scheduledDate: new Date(preferredDate),
        scheduledTime: scheduledTime || null,
        notes: notes || null,
        status: "CONFIRMED",
        source: "MANUAL",
        isWalkIn: false,
      },
    });

    // ── Email Trigger for Admin Manual Booking ────────────────────────────────
    const patientRecord = patientId
      ? await prisma.patient.findUnique({
          where: { id: patientId },
          select: { firstName: true, lastName: true, email: true },
        })
      : null;

    const patientEmail =
      patientRecord?.email || (formData.get("bookingEmail") as string | null);
    const resolvedPatientName = patientRecord
      ? `${patientRecord.firstName} ${patientRecord.lastName}`
      : bookingName || "Patient";

    if (patientEmail) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: user.clinicId },
        include: { settings: true },
      });
      const dentist = dentistId
        ? await prisma.user.findUnique({
            where: { id: dentistId },
            select: { name: true },
          })
        : null;

      if (clinic) {
        const formattedDate = new Date(preferredDate).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          },
        );

        await sendClinicEmail({
          to: patientEmail,
          subject: `Appointment Confirmed – ${clinic.name}`,
          html: appointmentConfirmedEmail({
            clinicName: clinic.name,
            patientName: resolvedPatientName,
            date: formattedDate,
            time: scheduledTime || undefined,
            dentistName: dentist?.name || undefined,
            address: clinic.address || undefined,
          }),
          clinicSettings: clinic.settings,
          clinicName: clinic.name,
        });
      }
    } else {
      console.log(
        "[Email Skipped] Manual admin booking created without patient email.",
      );
    }

    revalidateAppointmentPaths(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Create manual booking error:", error);
    return { error: "Failed to create booking." };
  }
}

// ─── add procedure to appointment ─────────────────────────────────────────────

export async function addProcedureToAppointment(
  clinicSlug: string,
  appointmentId: string,
  data: {
    procedureId: string;
    price: number;
    toothSelection?: number[];
    surfaceSelection?: Record<number, string[]>;
    upperLower?: string;
    material?: string;
    shade?: string;
    severity?: string;
    remarks?: string;
    dentistId?: string;
    consentDocument?: {
      base64: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
    };
    photoDocument?: {
      base64: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
    };
    xrayDocument?: {
      base64: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
    };
    labDocument?: {
      base64: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
    };
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  // Validate price is non-negative
  if (data.price < 0) return { error: "Price cannot be negative." };

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: { billing: true },
    });
    if (!appointment) return { error: "Appointment not found" };

    const apProc = await prisma.appointmentProcedure.create({
      data: {
        appointmentId,
        procedureId: data.procedureId,
        dentistId: data.dentistId || user.id,
        price: data.price,
        toothSelection: data.toothSelection
          ? JSON.stringify(data.toothSelection)
          : undefined,
        surfaceSelection: data.surfaceSelection
          ? JSON.stringify(data.surfaceSelection)
          : undefined,
        upperLower: data.upperLower || null,
        material: data.material || null,
        shade: data.shade || null,
        severity: data.severity || null,
        remarks: data.remarks || null,
        consentSigned: !!data.consentDocument,
      },
    });

    if (data.consentDocument) {
      await prisma.procedureDocument.create({
        data: {
          appointmentProcedureId: apProc.id,
          type: "CONSENT_FORM",
          title: data.consentDocument.fileName,
          content: data.consentDocument.base64,
          mimeType: data.consentDocument.mimeType,
          fileSize: data.consentDocument.fileSize,
        },
      });
    }

    if (data.photoDocument) {
      await prisma.procedureDocument.create({
        data: {
          appointmentProcedureId: apProc.id,
          type: "PHOTO",
          title: data.photoDocument.fileName,
          content: data.photoDocument.base64,
          mimeType: data.photoDocument.mimeType,
          fileSize: data.photoDocument.fileSize,
        },
      });
    }

    if (data.xrayDocument) {
      await prisma.procedureDocument.create({
        data: {
          appointmentProcedureId: apProc.id,
          type: "XRAY",
          title: data.xrayDocument.fileName,
          content: data.xrayDocument.base64,
          mimeType: data.xrayDocument.mimeType,
          fileSize: data.xrayDocument.fileSize,
        },
      });
    }

    if (data.labDocument) {
      await prisma.procedureDocument.create({
        data: {
          appointmentProcedureId: apProc.id,
          type: "LAB_REQUEST",
          title: data.labDocument.fileName,
          content: data.labDocument.base64,
          mimeType: data.labDocument.mimeType,
          fileSize: data.labDocument.fileSize,
        },
      });
    }

    if (appointment.billing) {
      const newTotal = Number(appointment.billing.totalAmount) + data.price;
      const newStatus =
        Number(appointment.billing.paidAmount) >= newTotal
          ? "FULLY_PAID"
          : Number(appointment.billing.paidAmount) > 0
            ? "PARTIALLY_PAID"
            : "UNPAID";
      await prisma.billing.update({
        where: { id: appointment.billing.id },
        data: { totalAmount: newTotal, status: newStatus },
      });
    } else {
      await prisma.billing.create({
        data: {
          clinicId: user.clinicId,
          appointmentId,
          totalAmount: data.price,
          paidAmount: 0,
          status: "UNPAID",
        },
      });
    }

    revalidateAppointmentPaths(clinicSlug);
    revalidatePath(`/clinic/${clinicSlug}/admin/billing`);
    return { success: true };
  } catch (error) {
    console.error("Add procedure to appointment error:", error);
    return { error: "Failed to add procedure." };
  }
}

export async function deleteProcedureFromAppointment(
  clinicSlug: string,
  appointmentProcedureId: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const apProc = await prisma.appointmentProcedure.findUnique({
      where: { id: appointmentProcedureId },
      include: {
        appointment: {
          include: { billing: true },
        },
      },
    });

    if (!apProc) return { error: "Procedure not found on appointment" };
    if (apProc.appointment.clinicId !== user.clinicId)
      return { error: "Unauthorized" };

    await prisma.procedureDocument.deleteMany({
      where: { appointmentProcedureId },
    });

    await prisma.appointmentProcedure.delete({
      where: { id: appointmentProcedureId },
    });

    const billing = apProc.appointment.billing;
    if (billing) {
      const procedurePrice = Number(apProc.price || 0);
      const newTotal = Math.max(
        0,
        Number(billing.totalAmount) - procedurePrice,
      );
      const newStatus =
        Number(billing.paidAmount) >= newTotal
          ? "FULLY_PAID"
          : Number(billing.paidAmount) > 0
            ? "PARTIALLY_PAID"
            : "UNPAID";

      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: newTotal,
          status: newStatus,
        },
      });
    }

    revalidateAppointmentPaths(clinicSlug);
    revalidatePath(`/clinic/${clinicSlug}/admin/billing`);
    return { success: true };
  } catch (error) {
    console.error("Delete procedure from appointment error:", error);
    return { error: "Failed to delete procedure." };
  }
}

// ─── fetching ─────────────────────────────────────────────────────────────────

export async function getFilteredAppointments(
  clinicSlug: string,
  filters?: { from?: string; to?: string; status?: string },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const where: Record<string, unknown> = { clinicId: user.clinicId };

    if (filters?.from || filters?.to) {
      where.preferredDate = {} as Record<string, unknown>;
      if (filters.from)
        (where.preferredDate as Record<string, unknown>).gte = new Date(
          filters.from,
        );
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        (where.preferredDate as Record<string, unknown>).lte = toDate;
      }
    }

    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as AppointmentStatus;
    } else {
      where.status = { not: "CANCELLED" };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      select: {
        id: true,
        preferredDate: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        serviceType: true,
        patient: { select: { firstName: true, lastName: true } },
        bookingName: true,
        dentist: { select: { name: true } },
      },
      orderBy: { preferredDate: "desc" },
    });

    // Return a deeply cloned plain object to avoid Date serialization issues across the Server Action boundary in some Next.js versions.
    return { appointments: JSON.parse(JSON.stringify(appointments)) };
  } catch (error) {
    console.error("Fetch filtered appointments error:", error);
    return { error: "Failed to fetch appointments." };
  }
}

// ─── Link Patient ─────────────────────────────────────────────────────────────

export async function linkPatientToAppointment(
  clinicSlug: string,
  appointmentId: string,
  patientId: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: { queueEntry: true },
    });

    if (!appointment) return { error: "Appointment not found." };

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) return { error: "Patient not found." };

    await prisma.$transaction(async (tx) => {
      // Update the appointment
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { patientId },
      });

      // If there's an associated queue, update the patientName
      if (appointment.queueEntry) {
        await tx.queueEntry.update({
          where: { id: appointment.queueEntry.id },
          data: { patientName: `${patient.firstName} ${patient.lastName}` },
        });
      }
    });

    revalidateAppointmentPaths(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Link patient error:", error);
    return { error: "Failed to link patient." };
  }
}
