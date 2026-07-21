"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";

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
  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug, isActive: true },
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

    return { success: true };
  } catch (error) {
    console.error("Create inquiry error:", error);
    return { error: "Failed to send message. Please try again." };
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
