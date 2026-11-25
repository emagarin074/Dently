"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { getPlanEntitlements } from "@/lib/plan-entitlements";
import { invalidateClinicCache } from "@/lib/cache/tenant-cache";
import { z } from "zod";

const procedureSchema = z.object({
  name: z.string().trim().min(1, "Procedure name is required").max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  priceType: z.enum(["FIXED", "MANUAL", "RANGE"]).default("FIXED"),
  price: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .finite()
    .optional()
    .nullable(),
  priceMin: z.coerce
    .number()
    .min(0, "Price minimum cannot be negative")
    .finite()
    .optional()
    .nullable(),
  priceMax: z.coerce
    .number()
    .min(0, "Price maximum cannot be negative")
    .finite()
    .optional()
    .nullable(),
});

function parseBool(val: FormDataEntryValue | null) {
  return val === "true" || val === "on";
}

function buildProcedureData(formData: FormData, clinicId?: string) {
  const consentTemplateId =
    (formData.get("consentTemplateId") as string) || null;
  const base = {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    category: (formData.get("category") as string) || null,
    priceType:
      (formData.get("priceType") as "FIXED" | "MANUAL" | "RANGE") || "FIXED",
    price: formData.get("price")
      ? parseFloat(formData.get("price") as string)
      : null,
    priceMin: formData.get("priceMin")
      ? parseFloat(formData.get("priceMin") as string)
      : null,
    priceMax: formData.get("priceMax")
      ? parseFloat(formData.get("priceMax") as string)
      : null,
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
    isInstallmentAvailable: parseBool(formData.get("isInstallmentAvailable")),
    consentTemplateId,
    priceRules: (() => {
      try {
        const raw = formData.get("priceRules") as string;
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        console.error("Failed to parse priceRules:", e);
        return null;
      }
    })(),
  };
  if (clinicId) return { ...base, clinicId };
  return base;
}

function buildStarterProcedureUpdateData(formData: FormData) {
  return {
    priceType:
      (formData.get("priceType") as "FIXED" | "MANUAL" | "RANGE") || "FIXED",
    price: formData.get("price")
      ? parseFloat(formData.get("price") as string)
      : null,
    priceMin: formData.get("priceMin")
      ? parseFloat(formData.get("priceMin") as string)
      : null,
    priceMax: formData.get("priceMax")
      ? parseFloat(formData.get("priceMax") as string)
      : null,
    isActive: parseBool(formData.get("isActive")),
  };
}

export async function createProcedure(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };
  const entitlements = getPlanEntitlements(user.clinic.plan);
  if (!entitlements.canCreateCustomProcedures) {
    return {
      error:
        "Your current plan includes the default procedure catalog. Upgrade to create custom procedures.",
    };
  }

  const parsed = procedureSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    category: formData.get("category") || null,
    priceType: formData.get("priceType") || "FIXED",
    price: formData.get("price") || null,
    priceMin: formData.get("priceMin") || null,
    priceMax: formData.get("priceMax") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.procedure.create({
      data: buildProcedureData(formData, user.clinicId) as never,
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`);
    await invalidateClinicCache(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Create procedure error:", error);
    return { error: "Failed to create procedure." };
  }
}

export async function updateProcedure(
  clinicSlug: string,
  procedureId: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };
  const entitlements = getPlanEntitlements(user.clinic.plan);

  const parsed = procedureSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || null,
    category: formData.get("category") || null,
    priceType: formData.get("priceType") || "FIXED",
    price: formData.get("price") || null,
    priceMin: formData.get("priceMin") || null,
    priceMax: formData.get("priceMax") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await prisma.procedure.update({
      where: { id: procedureId, clinicId: user.clinicId },
      data: entitlements.canEditProcedureAdvancedFields
        ? (buildProcedureData(formData) as never)
        : buildStarterProcedureUpdateData(formData),
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`);
    await invalidateClinicCache(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Update procedure error:", error);
    return { error: "Failed to update procedure." };
  }
}

export async function createConsentTemplate(
  clinicSlug: string,
  name: string,
  content: string,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };
  const entitlements = getPlanEntitlements(user.clinic.plan);
  if (!entitlements.canUseCustomDocumentTemplates) {
    return {
      error: "Custom consent templates are available on the Clinic plan.",
    };
  }
  if (!name.trim()) return { error: "Template name is required" };
  if (!content.trim()) return { error: "Template content is required" };

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
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`);
    return { success: true, template };
  } catch (error) {
    console.error("Create consent template error:", error);
    return { error: "Failed to create template." };
  }
}

export async function toggleProcedureActive(
  clinicSlug: string,
  procedureId: string,
  isActive: boolean,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.procedure.update({
      where: { id: procedureId, clinicId: user.clinicId },
      data: { isActive },
    });
    revalidatePath(`/clinic/${clinicSlug}/admin/procedures`);
    await invalidateClinicCache(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Toggle procedure active error:", error);
    return { error: "Failed to update procedure." };
  }
}
