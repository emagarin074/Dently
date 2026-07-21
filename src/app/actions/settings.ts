"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updateClinicInfo(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        name: formData.get("name") as string,
        address: (formData.get("address") as string) || null,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        website: (formData.get("website") as string) || null,
        description: (formData.get("description") as string) || null,
      },
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`)
    revalidatePath(`/clinic/${clinicSlug}`)
    return { success: true }
  } catch (error) {
    console.error("Update clinic info error:", error)
    return { error: "Failed to update clinic information." }
  }
}

export async function updateClinicSettings(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    await prisma.clinicSettings.upsert({
      where: { clinicId: user.clinicId },
      update: {
        brandColor: (formData.get("brandColor") as string) || "#0891b2",
        appointmentLeadDays: parseInt((formData.get("appointmentLeadDays") as string) || "30"),
        maxBookingsPerDay: formData.get("maxBookingsPerDay") ? parseInt(formData.get("maxBookingsPerDay") as string) : null,
        autoConfirmBookings: formData.get("autoConfirmBookings") === "true",
        revenueFormula: (formData.get("revenueFormula") as string) || null,
        smtpHost: (formData.get("smtpHost") as string) || null,
        smtpPort: formData.get("smtpPort") ? parseInt(formData.get("smtpPort") as string) : null,
        smtpUser: (formData.get("smtpUser") as string) || null,
        smtpPassword: (formData.get("smtpPassword") as string) || null,
        smtpFromEmail: (formData.get("smtpFromEmail") as string) || null,
        smtpFromName: (formData.get("smtpFromName") as string) || null,
      },
      create: {
        clinicId: user.clinicId,
        brandColor: (formData.get("brandColor") as string) || "#0891b2",
        appointmentLeadDays: parseInt((formData.get("appointmentLeadDays") as string) || "30"),
      },
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`)
    return { success: true }
  } catch (error) {
    console.error("Update clinic settings error:", error)
    return { error: "Failed to update settings." }
  }
}
