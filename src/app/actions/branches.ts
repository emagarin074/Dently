"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const branchSchema = z.object({
  name: z.string().min(2, "Branch name must be at least 2 characters."),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid branch email.").optional().or(z.literal("")),
});

function normalizeBranchInput(formData: FormData) {
  return branchSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
  });
}

export async function createBranch(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = normalizeBranchInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const activeBranches = await prisma.branch.count({
      where: { clinicId: user.clinicId, isActive: true },
    });

    if (activeBranches >= user.clinic.branchLimit) {
      return {
        error: `Your current plan allows ${user.clinic.branchLimit} active branch${user.clinic.branchLimit === 1 ? "" : "es"}.`,
      };
    }

    const branchCount = await prisma.branch.count({
      where: { clinicId: user.clinicId },
    });
    let slug = slugify(parsed.data.name);
    if (!slug) slug = "branch";

    const existing = await prisma.branch.findUnique({
      where: {
        clinicId_slug: {
          clinicId: user.clinicId,
          slug,
        },
      },
    });
    if (existing) slug = `${slug}-${branchCount + 1}`;

    await prisma.branch.create({
      data: {
        clinicId: user.clinicId,
        name: parsed.data.name.trim(),
        slug,
        address: parsed.data.address?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        email: parsed.data.email?.trim() || null,
        isPrimary: branchCount === 0,
        userAssignments: {
          create: {
            clinicId: user.clinicId,
            userId: user.id,
            isPrimary: branchCount === 0,
          },
        },
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/branches`);
    return { success: true };
  } catch (error) {
    console.error("Create branch error:", error);
    return { error: "Failed to create branch." };
  }
}

export async function updateBranch(
  clinicSlug: string,
  branchId: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = normalizeBranchInput(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: user.clinicId },
    });
    if (!branch) return { error: "Branch not found." };

    await prisma.branch.update({
      where: { id: branchId },
      data: {
        name: parsed.data.name.trim(),
        address: parsed.data.address?.trim() || null,
        phone: parsed.data.phone?.trim() || null,
        email: parsed.data.email?.trim() || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/branches`);
    return { success: true };
  } catch (error) {
    console.error("Update branch error:", error);
    return { error: "Failed to update branch." };
  }
}

export async function toggleBranchActive(
  clinicSlug: string,
  branchId: string,
  isActive: boolean,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: user.clinicId },
    });
    if (!branch) return { error: "Branch not found." };
    if (branch.isPrimary && !isActive) {
      return { error: "Primary branch cannot be deactivated." };
    }

    if (isActive) {
      const activeBranches = await prisma.branch.count({
        where: { clinicId: user.clinicId, isActive: true },
      });
      if (!branch.isActive && activeBranches >= user.clinic.branchLimit) {
        return {
          error: `Your current plan allows ${user.clinic.branchLimit} active branch${user.clinic.branchLimit === 1 ? "" : "es"}.`,
        };
      }
    }

    await prisma.branch.update({
      where: { id: branchId },
      data: { isActive },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/branches`);
    return { success: true };
  } catch (error) {
    console.error("Toggle branch error:", error);
    return { error: "Failed to update branch status." };
  }
}

export async function setPrimaryBranch(clinicSlug: string, branchId: string) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: user.clinicId, isActive: true },
    });
    if (!branch) return { error: "Active branch not found." };

    await prisma.$transaction([
      prisma.branch.updateMany({
        where: { clinicId: user.clinicId },
        data: { isPrimary: false },
      }),
      prisma.branch.update({
        where: { id: branchId },
        data: { isPrimary: true },
      }),
    ]);

    revalidatePath(`/clinic/${clinicSlug}/admin/branches`);
    return { success: true };
  } catch (error) {
    console.error("Set primary branch error:", error);
    return { error: "Failed to set primary branch." };
  }
}

export async function updateBranchAssignments(
  clinicSlug: string,
  branchId: string,
  userIds: string[],
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const branch = await prisma.branch.findFirst({
      where: { id: branchId, clinicId: user.clinicId },
    });
    if (!branch) return { error: "Branch not found." };

    const clinicUsers = await prisma.user.findMany({
      where: { clinicId: user.clinicId, id: { in: userIds } },
      select: { id: true },
    });
    const allowedUserIds = clinicUsers.map((clinicUser) => clinicUser.id);

    await prisma.$transaction(async (tx) => {
      await tx.userBranchAssignment.deleteMany({
        where: { clinicId: user.clinicId, branchId },
      });

      if (allowedUserIds.length > 0) {
        await tx.userBranchAssignment.createMany({
          data: allowedUserIds.map((userId) => ({
            clinicId: user.clinicId,
            branchId,
            userId,
            isPrimary: false,
          })),
          skipDuplicates: true,
        });
      }
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/branches`);
    return { success: true };
  } catch (error) {
    console.error("Update branch assignments error:", error);
    return { error: "Failed to update branch assignments." };
  }
}
