"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { sendEmail, bookingConfirmationEmail } from "@/lib/email"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { AppointmentStatus } from "@prisma/client"

// ─── helpers ──────────────────────────────────────────────────────────────────

function revalidateAppointmentPaths(slug: string) {
  revalidatePath(`/clinic/${slug}/admin/bookings`)
  revalidatePath(`/clinic/${slug}/admin`)
}

async function nextQueueNumber(clinicId: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

  // Use a raw query with FOR UPDATE to prevent race conditions
  const result = await prisma.$queryRaw<{ max_num: number | null }[]>`
    SELECT MAX("queueNumber") as max_num
    FROM "QueueEntry"
    WHERE "clinicId" = ${clinicId}
      AND "date" >= ${today}
      AND "date" < ${tomorrow}
    FOR UPDATE
  `
  return (result[0]?.max_num ?? 0) + 1
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
})

export async function createPublicBooking(clinicSlug: string, formData: FormData) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug, isActive: true },
    include: { settings: true },
  })
  if (!clinic) return { error: "Clinic not found." }

  const raw = {
    fullName: formData.get("fullName") as string,
    contactNumber: formData.get("contactNumber") as string,
    email: (formData.get("email") as string) || "",
    serviceType: formData.get("serviceType") as string,
    preferredDate: formData.get("preferredDate") as string,
    preferredDentistId: (formData.get("preferredDentistId") as string) || undefined,
    additionalConcern: (formData.get("additionalConcern") as string) || undefined,
  }

  const parsed = bookingSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { fullName, contactNumber, email, serviceType, preferredDate, preferredDentistId, additionalConcern } = parsed.data

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
    })

    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `Booking Received – ${clinic.name}`,
          html: bookingConfirmationEmail({ clinicName: clinic.name, patientName: fullName, preferredDate, service: serviceType }),
          clinicSettings: clinic.settings ?? undefined,
        })
      } catch (emailError) {
        console.error("Failed to send booking confirmation email:", emailError)
      }
    }

    return { success: true, appointmentId: appointment.id }
  } catch (error) {
    console.error("Create public booking error:", error)
    return { error: "Failed to create booking. Please try again." }
  }
}

// ─── confirm / cancel / reschedule ────────────────────────────────────────────

const VALID_STATUSES: string[] = Object.values(AppointmentStatus)

export async function updateAppointmentStatus(
  clinicSlug: string,
  appointmentId: string,
  status: string,
  data?: { dentistId?: string; scheduledDate?: string; scheduledTime?: string; cancelReason?: string }
) {
  const user = await requireAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  if (!VALID_STATUSES.includes(status)) return { error: "Invalid status." }

  try {
    await prisma.appointment.update({
      where: { id: appointmentId, clinicId: user.clinicId },
      data: {
        status: status as AppointmentStatus,
        ...(data?.dentistId && { dentistId: data.dentistId }),
        ...(data?.scheduledDate && { scheduledDate: new Date(data.scheduledDate) }),
        ...(data?.scheduledTime && { scheduledTime: data.scheduledTime }),
        ...(data?.cancelReason && { cancelReason: data.cancelReason }),
      },
    })

    revalidateAppointmentPaths(clinicSlug)
    return { success: true }
  } catch (error) {
    console.error("Update appointment status error:", error)
    return { error: "Failed to update appointment." }
  }
}

export async function rescheduleAppointment(clinicSlug: string, appointmentId: string, newDate: string, newTime?: string) {
  const user = await requireAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    await prisma.appointment.update({
      where: { id: appointmentId, clinicId: user.clinicId },
      data: {
        preferredDate: new Date(newDate),
        scheduledDate: new Date(newDate),
        ...(newTime && { scheduledTime: newTime }),
        status: "CONFIRMED",
      },
    })

    revalidateAppointmentPaths(clinicSlug)
    return { success: true }
  } catch (error) {
    console.error("Reschedule appointment error:", error)
    return { error: "Failed to reschedule appointment." }
  }
}

// ─── check in ─────────────────────────────────────────────────────────────────

export async function checkInAppointment(clinicSlug: string, appointmentId: string) {
  const user = await requireAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: { patient: true, queueEntry: true },
    })
    if (!appointment) return { error: "Appointment not found" }
    if (appointment.status === "CANCELLED") return { error: "Cannot check in a cancelled appointment" }
    if (appointment.status === "COMPLETED") return { error: "Appointment is already completed" }
    if (appointment.queueEntry) return { error: "Patient is already checked in" }

    const patientName = appointment.patient
      ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
      : appointment.bookingName || "Walk-in Patient"

    // Use transaction to atomically get queue number and create entry
    await prisma.$transaction(async (tx) => {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

      const last = await tx.queueEntry.findFirst({
        where: { clinicId: user.clinicId, date: { gte: today, lt: tomorrow } },
        orderBy: { queueNumber: "desc" },
      })
      const queueNumber = (last?.queueNumber ?? 0) + 1

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "CHECKED_IN" },
      })

      await tx.queueEntry.create({
        data: {
          clinicId: user.clinicId,
          appointmentId,
          patientName,
          queueNumber,
          status: "WAITING",
          date: new Date(),
        },
      })
    })

    revalidateAppointmentPaths(clinicSlug)
    return { success: true }
  } catch (error) {
    console.error("Check-in error:", error)
    return { error: "Failed to check in patient." }
  }
}

// ─── manual / walk-in booking ─────────────────────────────────────────────────

export async function createManualBooking(clinicSlug: string, formData: FormData) {
  const user = await requireAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  const patientId = formData.get("patientId") as string | null
  const dentistId = formData.get("dentistId") as string | null
  const preferredDate = formData.get("preferredDate") as string
  const scheduledTime = formData.get("scheduledTime") as string | null
  const serviceType = formData.get("serviceType") as string
  const notes = formData.get("notes") as string | null
  const isWalkIn = formData.get("isWalkIn") === "true"
  const bookingName = formData.get("bookingName") as string | null

  if (!preferredDate) return { error: "Date is required" }
  if (!serviceType) return { error: "Service type is required" }

  try {
    if (isWalkIn) {
      // Walk-in: create appointment + queue entry atomically
      const patientName = bookingName || "Walk-in Patient"

      await prisma.$transaction(async (tx) => {
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)

        const last = await tx.queueEntry.findFirst({
          where: { clinicId: user.clinicId, date: { gte: today, lt: tomorrow } },
          orderBy: { queueNumber: "desc" },
        })
        const queueNumber = (last?.queueNumber ?? 0) + 1

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
        })

        await tx.queueEntry.create({
          data: {
            clinicId: user.clinicId,
            appointmentId: appointment.id,
            patientName,
            queueNumber,
            status: "WAITING",
            date: new Date(),
          },
        })
      })

      revalidateAppointmentPaths(clinicSlug)
      return { success: true }
    }

    // Regular manual booking
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
    })

    revalidateAppointmentPaths(clinicSlug)
    return { success: true }
  } catch (error) {
    console.error("Create manual booking error:", error)
    return { error: "Failed to create booking." }
  }
}

// ─── add procedure to appointment ─────────────────────────────────────────────

export async function addProcedureToAppointment(
  clinicSlug: string,
  appointmentId: string,
  data: {
    procedureId: string
    price: number
    toothSelection?: number[]
    surfaceSelection?: Record<number, string[]>
    upperLower?: string
    material?: string
    shade?: string
    severity?: string
    remarks?: string
    dentistId?: string
    consentDocument?: {
      base64: string
      mimeType: string
      fileName: string
      fileSize: number
    }
  }
) {
  const user = await requireAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  // Validate price is non-negative
  if (data.price < 0) return { error: "Price cannot be negative." }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
      include: { billing: true },
    })
    if (!appointment) return { error: "Appointment not found" }

    const apProc = await prisma.appointmentProcedure.create({
      data: {
        appointmentId,
        procedureId: data.procedureId,
        dentistId: data.dentistId || user.id,
        price: data.price,
        toothSelection: data.toothSelection ? JSON.stringify(data.toothSelection) : undefined,
        surfaceSelection: data.surfaceSelection ? JSON.stringify(data.surfaceSelection) : undefined,
        upperLower: data.upperLower || null,
        material: data.material || null,
        shade: data.shade || null,
        severity: data.severity || null,
        remarks: data.remarks || null,
        consentSigned: !!data.consentDocument,
      },
    })

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
      })
    }

    if (appointment.billing) {
      const newTotal = Number(appointment.billing.totalAmount) + data.price
      const newStatus =
        Number(appointment.billing.paidAmount) >= newTotal ? "FULLY_PAID"
        : Number(appointment.billing.paidAmount) > 0 ? "PARTIALLY_PAID"
        : "UNPAID"
      await prisma.billing.update({
        where: { id: appointment.billing.id },
        data: { totalAmount: newTotal, status: newStatus },
      })
    } else {
      await prisma.billing.create({
        data: {
          clinicId: user.clinicId,
          appointmentId,
          totalAmount: data.price,
          paidAmount: 0,
          status: "UNPAID",
        },
      })
    }

    revalidateAppointmentPaths(clinicSlug)
    revalidatePath(`/clinic/${clinicSlug}/admin/billing`)
    return { success: true }
  } catch (error) {
    console.error("Add procedure to appointment error:", error)
    return { error: "Failed to add procedure." }
  }
}
