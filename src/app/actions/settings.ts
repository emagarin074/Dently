"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import { verifySmtpConnection } from "@/lib/email";

export async function updateClinicInfo(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.clinic.update({
      where: { id: user.clinicId },
      data: {
        name: formData.get("name") as string,
        address: (formData.get("address") as string) || null,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        description: (formData.get("description") as string) || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    revalidatePath(`/clinic/${clinicSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Update clinic info error:", error);
    return { error: "Failed to update clinic information." };
  }
}

export async function updateClinicSettings(
  clinicSlug: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

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
        brandColor: (formData.get("brandColor") as string) || "#0891b2",
        appointmentLeadDays: parseInt(
          (formData.get("appointmentLeadDays") as string) || "30",
        ),
        maxBookingsPerDay: formData.get("maxBookingsPerDay")
          ? parseInt(formData.get("maxBookingsPerDay") as string)
          : null,
        autoConfirmBookings: formData.get("autoConfirmBookings") === "true",
        revenueFormula: (formData.get("revenueFormula") as string) || null,
        smtpHost: (formData.get("smtpHost") as string) || null,
        smtpPort: formData.get("smtpPort")
          ? parseInt(formData.get("smtpPort") as string)
          : null,
        smtpUser: (formData.get("smtpUser") as string) || null,
        smtpPassword: finalPassword,
        smtpFromEmail: (formData.get("smtpFromEmail") as string) || null,
        smtpFromName: (formData.get("smtpFromName") as string) || null,
      },
      create: {
        clinicId: user.clinicId,
        brandColor: (formData.get("brandColor") as string) || "#0891b2",
        appointmentLeadDays: parseInt(
          (formData.get("appointmentLeadDays") as string) || "30",
        ),
        smtpHost: (formData.get("smtpHost") as string) || null,
        smtpPort: formData.get("smtpPort")
          ? parseInt(formData.get("smtpPort") as string)
          : null,
        smtpUser: (formData.get("smtpUser") as string) || null,
        smtpPassword: finalPassword,
        smtpFromEmail: (formData.get("smtpFromEmail") as string) || null,
        smtpFromName: (formData.get("smtpFromName") as string) || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
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
