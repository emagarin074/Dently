"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

import { requireAuth } from "@/lib/auth";
import {
  sendClinicEmail,
  inquiryReceivedEmail,
  inquiryReplyEmail,
} from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const inquirySchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z
      .string()
      .email("Valid email is required")
      .optional()
      .or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    message: z.string().min(1, "Message is required"),
  })
  .refine((data) => data.email || data.phone, {
    message: "Either email or phone must be provided",
    path: ["email"],
  });

export async function createInquiry(clinicSlug: string, formData: FormData) {
  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`inquiry_${ip}_${clinicSlug}`, 5, 600000);
  if (!rateCheck.success) {
    const mins = Math.ceil(rateCheck.resetMs / 60000);
    return {
      error: `Too many inquiry attempts. Please wait ${mins} minute(s) before trying again.`,
    };
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug, isActive: true },
    include: { settings: true },
  });

  if (!clinic) return { error: "Clinic not found." };

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    message: formData.get("message") as string,
  };

  const parsed = inquirySchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    await prisma.inquiry.create({
      data: {
        clinicId: clinic.id,
        name: parsed.data.name,
        email: parsed.data.email || null,
        phone: parsed.data.phone || null,
        message: parsed.data.message,
      },
    });

    if (parsed.data.email) {
      try {
        await sendClinicEmail({
          to: parsed.data.email,
          subject: `Thank You for Contacting ${clinic.name}`,
          html: inquiryReceivedEmail({
            clinicName: clinic.name,
            patientName: parsed.data.name,
          }),
          clinicSettings: clinic.settings,
          clinicName: clinic.name,
        });
      } catch (emailErr) {
        console.error("Failed to send inquiry receipt email:", emailErr);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Create inquiry error:", error);
    return { error: "Failed to send message. Please try again." };
  }
}

export async function replyToInquiry(
  clinicSlug: string,
  inquiryId: string,
  replyMessage: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (!replyMessage || !replyMessage.trim()) {
    return { error: "Reply message cannot be empty." };
  }

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: { clinic: { include: { settings: true } } },
    });

    if (!inquiry || inquiry.clinicId !== user.clinicId) {
      return { error: "Inquiry not found." };
    }

    if (!inquiry.email) {
      return { error: "This inquiry does not have a patient email address." };
    }

    const emailResult = await sendClinicEmail({
      to: inquiry.email,
      subject: `Response from ${inquiry.clinic.name}`,
      html: inquiryReplyEmail({
        clinicName: inquiry.clinic.name,
        patientName: inquiry.name,
        originalMessage: inquiry.message,
        replyMessage: replyMessage.trim(),
      }),
      clinicSettings: inquiry.clinic.settings,
      clinicName: inquiry.clinic.name,
    });

    if (!emailResult.success) {
      return {
        error:
          emailResult.error ||
          "Failed to send reply email. Please check your clinic SMTP settings.",
      };
    }

    // Mark as read after successful reply
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isRead: true },
    });

    revalidatePath("/clinic/[slug]/admin/inquiries", "page");
    return { success: true };
  } catch (error) {
    console.error("Reply to inquiry error:", error);
    return { error: "Failed to send reply email." };
  }
}

export async function getInquiries(
  clinicId: string,
  skip: number = 0,
  take: number = 20,
) {
  const [inquiries, total] = await Promise.all([
    prisma.inquiry.findMany({
      where: { clinicId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.inquiry.count({ where: { clinicId } }),
  ]);

  return { inquiries, total };
}

export async function markInquiryRead(inquiryId: string) {
  try {
    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: { isRead: true },
    });

    revalidatePath("/clinic/[slug]/admin/inquiries", "page");
    return { success: true };
  } catch (error) {
    console.error("Mark inquiry read error:", error);
    return { error: "Failed to mark as read." };
  }
}

export async function deleteInquiry(inquiryId: string) {
  try {
    await prisma.inquiry.delete({
      where: { id: inquiryId },
    });

    revalidatePath("/clinic/[slug]/admin/inquiries", "page");
    return { success: true };
  } catch (error) {
    console.error("Delete inquiry error:", error);
    return { error: "Failed to delete inquiry." };
  }
}

export async function bulkMarkInquiriesRead(inquiryIds: string[]) {
  try {
    await prisma.inquiry.updateMany({
      where: { id: { in: inquiryIds } },
      data: { isRead: true },
    });

    revalidatePath("/clinic/[slug]/admin/inquiries", "page");
    return { success: true };
  } catch (error) {
    console.error("Bulk mark read error:", error);
    return { error: "Failed to mark as read." };
  }
}

export async function bulkMarkInquiriesUnread(inquiryIds: string[]) {
  try {
    await prisma.inquiry.updateMany({
      where: { id: { in: inquiryIds } },
      data: { isRead: false },
    });

    revalidatePath("/clinic/[slug]/admin/inquiries", "page");
    return { success: true };
  } catch (error) {
    console.error("Bulk mark unread error:", error);
    return { error: "Failed to mark as unread." };
  }
}

export async function bulkDeleteInquiries(inquiryIds: string[]) {
  try {
    await prisma.inquiry.deleteMany({
      where: { id: { in: inquiryIds } },
    });

    revalidatePath("/clinic/[slug]/admin/inquiries", "page");
    return { success: true };
  } catch (error) {
    console.error("Bulk delete error:", error);
    return { error: "Failed to delete inquiries." };
  }
}
