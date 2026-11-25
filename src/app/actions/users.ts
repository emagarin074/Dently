"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const userBaseSchema = z.object({
  name: z.string().min(2),
  role: z.enum(["DENTIST_ADMIN", "ASSISTANT"]),
  phoneNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialization: z.string().optional(),
  payType: z
    .enum(["FIXED_DAILY", "PROCEDURE_BASED"])
    .default("PROCEDURE_BASED"),
  dailyRate: z.coerce.number().min(0).default(0),
  expectedTimeIn: z.string().optional(),
  expectedTimeOut: z.string().optional(),
  breakMinutes: z.coerce.number().int().min(0).default(60),
  lateGraceMinutes: z.coerce.number().int().min(0).default(0),
  lateDeductionType: z
    .enum(["PER_MINUTE", "FIXED", "PERCENTAGE"])
    .default("PER_MINUTE"),
  lateDeductionValue: z.coerce.number().min(0).default(0),
});

const createUserSchema = userBaseSchema.extend({
  email: z.string().email(),
});

const updateUserSchema = userBaseSchema;

function buildPayProfileData(data: z.infer<typeof userBaseSchema>) {
  const isFixedDaily = data.payType === "FIXED_DAILY";
  return {
    payType: data.payType,
    dailyRate: isFixedDaily ? data.dailyRate : 0,
    expectedTimeIn: isFixedDaily ? data.expectedTimeIn || "08:00" : null,
    expectedTimeOut: isFixedDaily ? data.expectedTimeOut || "17:00" : null,
    breakMinutes: isFixedDaily ? data.breakMinutes : 60,
    lateGraceMinutes: isFixedDaily ? data.lateGraceMinutes : 0,
    lateDeductionType: isFixedDaily ? data.lateDeductionType : "PER_MINUTE",
    lateDeductionValue: isFixedDaily ? data.lateDeductionValue : 0,
    isActive: true,
  };
}

function validatePayProfile(data: z.infer<typeof userBaseSchema>) {
  if (data.payType === "FIXED_DAILY" && data.dailyRate <= 0) {
    return "Daily rate is required for fixed daily salary.";
  }
  if (data.payType === "FIXED_DAILY") {
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(data.expectedTimeIn || "")) {
      return "Expected time in must use HH:mm format.";
    }
    if (!timePattern.test(data.expectedTimeOut || "")) {
      return "Expected time out must use HH:mm format.";
    }
  }
  return null;
}

export async function createUser(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = createUserSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const payProfileError = validatePayProfile(parsed.data);
  if (payProfileError) return { error: payProfileError };

  const password = formData.get("password") as string;
  if (!password || password.length < 8)
    return { error: "Password must be at least 8 characters" };

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) return { error: "A user with this email already exists." };

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          clinicId: user.clinicId,
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          passwordHash,
          phoneNumber: parsed.data.phoneNumber || null,
          licenseNumber: parsed.data.licenseNumber || null,
          specialization: parsed.data.specialization || null,
        },
      });

      await tx.staffPayProfile.create({
        data: {
          clinicId: user.clinicId,
          staffId: createdUser.id,
          ...buildPayProfileData(parsed.data),
        },
      });

      const primaryBranch = await tx.branch.findFirst({
        where: { clinicId: user.clinicId, isPrimary: true },
        select: { id: true },
      });

      if (primaryBranch) {
        await tx.userBranchAssignment.create({
          data: {
            clinicId: user.clinicId,
            branchId: primaryBranch.id,
            userId: createdUser.id,
            isPrimary: true,
          },
        });
      }
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/users`);
    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Failed to create user." };
  }
}

export async function toggleUserActive(
  clinicSlug: string,
  userId: string,
  isActive: boolean,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };
  if (user.id === userId) return { error: "Cannot deactivate yourself" };

  try {
    await prisma.user.update({
      where: { id: userId, clinicId: user.clinicId },
      data: { isActive },
    });
    revalidatePath(`/clinic/${clinicSlug}/admin/users`);
    return { success: true };
  } catch (error) {
    console.error("Toggle user active error:", error);
    return { error: "Failed to update user status." };
  }
}

export async function resetUserPassword(
  clinicSlug: string,
  userId: string,
  newPassword: string,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (newPassword.length < 8)
    return { error: "Password must be at least 8 characters" };

  try {
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId, clinicId: user.clinicId },
      data: { passwordHash },
    });
    return { success: true };
  } catch (error) {
    console.error("Reset user password error:", error);
    return { error: "Failed to reset password." };
  }
}

export async function updateUser(
  clinicSlug: string,
  userId: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = updateUserSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const payProfileError = validatePayProfile(parsed.data);
  if (payProfileError) return { error: payProfileError };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId, clinicId: user.clinicId },
        data: {
          name: parsed.data.name,
          role: parsed.data.role,
          phoneNumber: parsed.data.phoneNumber || null,
          licenseNumber: parsed.data.licenseNumber || null,
          specialization: parsed.data.specialization || null,
        },
      });

      await tx.staffPayProfile.upsert({
        where: { staffId: userId },
        update: buildPayProfileData(parsed.data),
        create: {
          clinicId: user.clinicId,
          staffId: userId,
          ...buildPayProfileData(parsed.data),
        },
      });
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/users`);
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { error: "Failed to update user." };
  }
}
