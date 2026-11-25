"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { invalidateClinicCache } from "@/lib/cache/tenant-cache";
import { verifySmtpConnection } from "@/lib/email";
import { z } from "zod";

const clinicInfoSchema = z.object({
  name: z.string().trim().min(1, "Clinic name is required").max(100),
  address: z.string().trim().max(300).optional().nullable().or(z.literal("")),
  phone: z.string().trim().max(50).optional().nullable().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional()
    .nullable()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function updateClinicInfo(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = clinicInfoSchema.safeParse({
    name: formData.get("name") as string,
    address: (formData.get("address") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    description: (formData.get("description") as string) || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, address, phone, email, description } = parsed.data;

  try {
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        description: description || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    revalidatePath(`/clinic/${clinicSlug}`);
    await invalidateClinicCache(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Update clinic info error:", error);
    return { error: "Failed to update clinic information." };
  }
}

const clinicSettingsSchema = z.object({
  brandColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format.")
    .default("#0891b2"),
  appointmentLeadDays: z.coerce.number().int().min(1).max(365).default(30),
  queueWorkflow: z
    .enum(["FULL_WORKFLOW", "SIMPLE_QUEUE", "DIRECT_TREATMENT"])
    .default("FULL_WORKFLOW"),
  maxBookingsPerDay: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .nullable(),
  autoConfirmBookings: z.boolean().default(false),
  revenueFormula: z.string().max(500).optional().nullable(),
  smtpHost: z.string().max(255).optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().max(255).optional().nullable(),
  smtpFromEmail: z
    .string()
    .email("Invalid SMTP from email")
    .optional()
    .nullable()
    .or(z.literal("")),
  smtpFromName: z.string().max(255).optional().nullable(),
});

export async function updateClinicSettings(
  clinicSlug: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = clinicSettingsSchema.safeParse({
    brandColor: (formData.get("brandColor") as string) || "#0891b2",
    appointmentLeadDays: formData.get("appointmentLeadDays") || "30",
    queueWorkflow: formData.get("queueWorkflow") || "FULL_WORKFLOW",
    maxBookingsPerDay: formData.get("maxBookingsPerDay") || null,
    autoConfirmBookings: formData.get("autoConfirmBookings") === "true",
    revenueFormula: (formData.get("revenueFormula") as string) || null,
    smtpHost: (formData.get("smtpHost") as string) || null,
    smtpPort: formData.get("smtpPort") || null,
    smtpUser: (formData.get("smtpUser") as string) || null,
    smtpFromEmail: (formData.get("smtpFromEmail") as string) || null,
    smtpFromName: (formData.get("smtpFromName") as string) || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const valid = parsed.data;

  try {
    const existing = await prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });

    const newPassword = (formData.get("smtpPassword") as string) || null;
    let finalPassword = newPassword;

    // Preserve existing password if masked string or empty string submitted when password already exists
    if (
      (newPassword === "••••••••" || !newPassword) &&
      existing?.smtpPassword
    ) {
      finalPassword = existing.smtpPassword;
    }

    await prisma.clinicSettings.upsert({
      where: { clinicId: user.clinicId },
      update: {
        brandColor: valid.brandColor,
        appointmentLeadDays: valid.appointmentLeadDays,
        queueWorkflow: valid.queueWorkflow,
        maxBookingsPerDay: valid.maxBookingsPerDay || null,
        autoConfirmBookings: valid.autoConfirmBookings,
        revenueFormula: valid.revenueFormula || null,
        smtpHost: valid.smtpHost || null,
        smtpPort: valid.smtpPort || null,
        smtpUser: valid.smtpUser || null,
        smtpPassword: finalPassword,
        smtpFromEmail: valid.smtpFromEmail || null,
        smtpFromName: valid.smtpFromName || null,
      },
      create: {
        clinicId: user.clinicId,
        brandColor: valid.brandColor,
        appointmentLeadDays: valid.appointmentLeadDays,
        queueWorkflow: valid.queueWorkflow,
        smtpHost: valid.smtpHost || null,
        smtpPort: valid.smtpPort || null,
        smtpUser: valid.smtpUser || null,
        smtpPassword: finalPassword,
        smtpFromEmail: valid.smtpFromEmail || null,
        smtpFromName: valid.smtpFromName || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    await invalidateClinicCache(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Update clinic settings error:", error);
    return { error: "Failed to update settings." };
  }
}

export async function testClinicSmtp(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const host = (formData.get("smtpHost") as string) || null;
  const port = formData.get("smtpPort")
    ? parseInt(formData.get("smtpPort") as string)
    : 587;
  const smtpUser = (formData.get("smtpUser") as string) || null;
  let smtpPassword = (formData.get("smtpPassword") as string) || null;
  const fromEmail = (formData.get("smtpFromEmail") as string) || null;
  const fromName = (formData.get("smtpFromName") as string) || null;

  // If password is masked or empty, load saved password from DB
  if (smtpPassword === "••••••••" || !smtpPassword) {
    const existing = await prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    smtpPassword = existing?.smtpPassword || null;
  }

  if (!host || !smtpUser || !smtpPassword) {
    return {
      error:
        "SMTP Host, Username, and Password are required to test the connection.",
    };
  }

  const result = await verifySmtpConnection(
    {
      smtpHost: host,
      smtpPort: port,
      smtpUser: smtpUser,
      smtpPassword: smtpPassword,
      smtpFromEmail: fromEmail,
      smtpFromName: fromName,
    },
    user.email || undefined, // send test email to logged-in admin
  );

  if (!result.success) {
    return { error: result.error || "Failed to connect to SMTP server." };
  }

  return {
    success: true,
    message: `SMTP connection successful! A test email was sent to ${user.email || smtpUser}.`,
  };
}
