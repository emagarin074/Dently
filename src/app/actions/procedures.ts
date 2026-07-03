"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

function parseBool(val: FormDataEntryValue | null) {
  return val === "true" || val === "on"
}

function buildProcedureData(formData: FormData, clinicId?: string) {
  const consentTemplateId = (formData.get("consentTemplateId") as string) || null
  const base = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    category: (formData.get("category") as string) || null,
    priceType: (formData.get("priceType") as "FIXED" | "MANUAL" | "RANGE") || "FIXED",
    price: formData.get("price") ? parseFloat(formData.get("price") as string) : null,
    priceMin: formData.get("priceMin") ? parseFloat(formData.get("priceMin") as string) : null,
    priceMax: formData.get("priceMax") ? parseFloat(formData.get("priceMax") as string) : null,
    isActive: parseBool(formData.get("isActive")),
    hasOdontogram: parseBool(formData.get("hasOdontogram")),
    hasToothSurface: parseBool(formData.get("hasToothSurface")),
    hasUpperLower: parseBool(formData.get("hasUpperLower")),
    hasQuadrant: parseBool(formData.get("hasQuadrant")),
    hasMaterial: parseBool(formData.get("hasMaterial")),
    hasShade: parseBool(formData.get("hasShade")),
    hasSeverity: parseBool(formData.get("hasSeverity")),
    hasQuantity: parseBool(formData.get("hasQuantity")),
    hasRemarks: parseBool(formData.get("hasRemarks")),
    hasPhotoUpload: parseBool(formData.get("hasPhotoUpload")),
    hasXrayUpload: parseBool(formData.get("hasXrayUpload")),
    hasLabRequest: parseBool(formData.get("hasLabRequest")),
    autoConsentForm: parseBool(formData.get("autoConsentForm")),
    autoPrescription: parseBool(formData.get("autoPrescription")),
    autoMedCert: parseBool(formData.get("autoMedCert")),
    autoFollowUp: parseBool(formData.get("autoFollowUp")),
    requireSignedConsent: parseBool(formData.get("requireSignedConsent")),
    requirePhoto: parseBool(formData.get("requirePhoto")),
    requireXray: parseBool(formData.get("requireXray")),
    requireLabDocs: parseBool(formData.get("requireLabDocs")),
    consentTemplateId,
  }
  if (clinicId) return { ...base, clinicId }
  return base
}

export async function createProcedure(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  const name = formData.get("name") as string
  if (!name) return { error: "Name is required" }

  try {
    await prisma.procedure.create({ data: buildProcedureData(formData, user.clinicId) as never })

    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`)
    return { success: true }
  } catch (error) {
    console.error("Create procedure error:", error)
    return { error: "Failed to create procedure." }
  }
}

export async function updateProcedure(clinicSlug: string, procedureId: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    await prisma.procedure.update({
      where: { id: procedureId, clinicId: user.clinicId },
      data: buildProcedureData(formData) as never,
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`)
    return { success: true }
  } catch (error) {
    console.error("Update procedure error:", error)
    return { error: "Failed to update procedure." }
  }
}

export async function createConsentTemplate(clinicSlug: string, name: string, content: string) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }
  if (!name.trim()) return { error: "Template name is required" }
  if (!content.trim()) return { error: "Template content is required" }

  try {
    const template = await prisma.documentTemplate.create({
      data: {
        clinicId: user.clinicId,
        type: "CONSENT_FORM",
        name: name.trim(),
        content: content.trim(),
        isDefault: false,
        isActive: true,
      },
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`)
    return { success: true, template }
  } catch (error) {
    console.error("Create consent template error:", error)
    return { error: "Failed to create template." }
  }
}

export async function toggleProcedureActive(clinicSlug: string, procedureId: string, isActive: boolean) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    await prisma.procedure.update({ where: { id: procedureId, clinicId: user.clinicId }, data: { isActive } })
    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`)
    return { success: true }
  } catch (error) {
    console.error("Toggle procedure active error:", error)
    return { error: "Failed to update procedure." }
  }
}
