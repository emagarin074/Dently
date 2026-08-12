"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { runCompensationEngine } from "@/lib/compensation/engine";
import { TreatmentInput } from "@/lib/compensation/types";

export async function getCompensationPrograms(clinicSlug: string) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const programs = await prisma.compensationProgram.findMany({
      where: { clinicId: user.clinicId },
      include: {
        rules: { orderBy: { priority: "asc" } },
        assignments: true,
      },
      orderBy: [{ name: "asc" }, { version: "desc" }],
    });

    return { success: true, programs: JSON.parse(JSON.stringify(programs)) };
  } catch (error) {
    console.error("Get compensation programs error:", error);
    return { error: "Failed to load compensation programs." };
  }
}

export async function createCompensationProgram(
  clinicSlug: string,
  data: {
    name: string;
    description?: string;
    branch?: string;
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (!data.name || !data.name.trim()) {
    return { error: "Program name is required." };
  }

  try {
    const program = await prisma.compensationProgram.create({
      data: {
        clinicId: user.clinicId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        branch: data.branch || null,
        version: 1,
        status: "DRAFT",
        isLatest: true,
        updatedBy: user.name,
        rules: {
          create: [
            {
              ruleType: "REVENUE_SPLIT",
              priority: 1,
              enabled: true,
              behavior: "REPLACE",
              config: {
                percentage: 40,
                calculationBase: "Gross Fee",
              },
            },
            {
              ruleType: "COLLECTION_RULE",
              priority: 0,
              enabled: true,
              behavior: "BLOCK",
              config: {
                payableWhen: "Fully Paid",
              },
            },
          ],
        },
      },
      include: { rules: true, assignments: true },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true, program: JSON.parse(JSON.stringify(program)) };
  } catch (error) {
    console.error("Create compensation program error:", error);
    return { error: "Failed to create compensation program." };
  }
}

export async function updateDraftProgramRules(
  clinicSlug: string,
  programId: string,
  rulesData: Array<{
    id?: string;
    ruleType: string;
    priority: number;
    enabled: boolean;
    behavior: string;
    config: Record<string, unknown>;
  }>,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const program = await prisma.compensationProgram.findUnique({
      where: { id: programId },
    });

    if (!program || program.clinicId !== user.clinicId) {
      return { error: "Program not found." };
    }

    if (program.status === "PUBLISHED") {
      return {
        error:
          "Published programs are immutable. Clone to a new version to edit rules.",
      };
    }

    await prisma.$transaction(async (tx) => {
      await tx.compensationRule.deleteMany({
        where: { programId },
      });

      for (let i = 0; i < rulesData.length; i++) {
        const r = rulesData[i];
        await tx.compensationRule.create({
          data: {
            programId,
            ruleType: r.ruleType,
            priority: r.priority ?? i + 1,
            enabled: r.enabled ?? true,
            behavior: r.behavior,
            config: r.config as object,
          },
        });
      }

      await tx.compensationProgram.update({
        where: { id: programId },
        data: { updatedAt: new Date(), updatedBy: user.name },
      });
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true };
  } catch (error) {
    console.error("Update program rules error:", error);
    return { error: "Failed to update compensation program rules." };
  }
}

export async function cloneAndCreateNewVersion(
  clinicSlug: string,
  programId: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const original = await prisma.compensationProgram.findUnique({
      where: { id: programId },
      include: { rules: true, assignments: true },
    });

    if (!original || original.clinicId !== user.clinicId) {
      return { error: "Original program not found." };
    }

    const nextVersion = original.version + 1;

    // Set previous versions as not latest
    await prisma.compensationProgram.updateMany({
      where: { clinicId: user.clinicId, name: original.name },
      data: { isLatest: false },
    });

    const cloned = await prisma.compensationProgram.create({
      data: {
        clinicId: user.clinicId,
        name: original.name,
        description: original.description,
        branch: original.branch,
        version: nextVersion,
        status: "DRAFT",
        isLatest: true,
        parentProgramId: original.id,
        updatedBy: user.name,
        rules: {
          create: original.rules.map((r) => ({
            ruleType: r.ruleType,
            priority: r.priority,
            enabled: r.enabled,
            behavior: r.behavior,
            config: r.config as object,
          })),
        },
      },
      include: { rules: true, assignments: true },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true, program: JSON.parse(JSON.stringify(cloned)) };
  } catch (error) {
    console.error("Clone program version error:", error);
    return { error: "Failed to create new program version." };
  }
}

export async function publishProgram(clinicSlug: string, programId: string) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const program = await prisma.compensationProgram.findUnique({
      where: { id: programId },
    });

    if (!program || program.clinicId !== user.clinicId) {
      return { error: "Program not found." };
    }

    await prisma.compensationProgram.update({
      where: { id: programId },
      data: {
        status: "PUBLISHED",
        effectiveDate: new Date(),
        updatedBy: user.name,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true };
  } catch (error) {
    console.error("Publish program error:", error);
    return { error: "Failed to publish program." };
  }
}

export async function archiveProgram(clinicSlug: string, programId: string) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const program = await prisma.compensationProgram.findUnique({
      where: { id: programId },
    });

    if (!program || program.clinicId !== user.clinicId) {
      return { error: "Program not found." };
    }

    await prisma.compensationProgram.update({
      where: { id: programId },
      data: {
        status: "ARCHIVED",
        expirationDate: new Date(),
        updatedBy: user.name,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true };
  } catch (error) {
    console.error("Archive program error:", error);
    return { error: "Failed to archive program." };
  }
}

export async function assignProgram(
  clinicSlug: string,
  programId: string,
  assignment: {
    targetType: "INDIVIDUAL" | "ROLE" | "SPECIALIZATION" | "BRANCH" | "CLINIC";
    targetId?: string;
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const program = await prisma.compensationProgram.findUnique({
      where: { id: programId },
    });

    if (!program || program.clinicId !== user.clinicId) {
      return { error: "Program not found." };
    }

    await prisma.compensationAssignment.create({
      data: {
        clinicId: user.clinicId,
        programId,
        targetType: assignment.targetType,
        targetId: assignment.targetId || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true };
  } catch (error) {
    console.error("Assign program error:", error);
    return { error: "Failed to assign compensation program." };
  }
}

export async function evaluateLivePreview(
  clinicSlug: string,
  programId: string,
  input: TreatmentInput,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const program = await prisma.compensationProgram.findUnique({
      where: { id: programId },
      include: { rules: { orderBy: { priority: "asc" } } },
    });

    if (!program || program.clinicId !== user.clinicId) {
      return { error: "Program not found." };
    }

    const programData = {
      id: program.id,
      name: program.name,
      version: program.version,
      rules: program.rules.map((r) => ({
        id: r.id,
        ruleType: r.ruleType,
        priority: r.priority,
        enabled: r.enabled,
        behavior: r.behavior,
        config: r.config as Record<string, unknown>,
      })),
    };

    const output = runCompensationEngine(programData, input);
    return { success: true, output: JSON.parse(JSON.stringify(output)) };
  } catch (error) {
    console.error("Evaluate live preview error:", error);
    return { error: "Failed to evaluate calculation preview." };
  }
}

export async function getCompensationLedger(clinicSlug: string) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const ledgers = await prisma.compensationLedger.findMany({
      where: { clinicId: user.clinicId },
      include: {
        clinic: { select: { name: true } },
        program: { select: { name: true, version: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, ledgers: JSON.parse(JSON.stringify(ledgers)) };
  } catch (error) {
    console.error("Get compensation ledger error:", error);
    return { error: "Failed to load compensation ledger records." };
  }
}
