"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth, requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { runCompensationEngine } from "@/lib/compensation/engine";
import { TreatmentInput } from "@/lib/compensation/types";
import { recomputeCompensationLedgersForClinic } from "@/lib/compensation/ledger";

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
  const user = await requireAdminAuth(clinicSlug);
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
  const user = await requireAdminAuth(clinicSlug);
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
  const user = await requireAdminAuth(clinicSlug);
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
  const user = await requireAdminAuth(clinicSlug);
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

    const recompute = await recomputeCompensationLedgersForClinic(
      user.clinicId,
      {
        createdBy: user.name,
      },
    );

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true, recompute };
  } catch (error) {
    console.error("Publish program error:", error);
    return { error: "Failed to publish program." };
  }
}

export async function archiveProgram(clinicSlug: string, programId: string) {
  const user = await requireAdminAuth(clinicSlug);
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
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const program = await prisma.compensationProgram.findUnique({
      where: { id: programId },
    });

    if (!program || program.clinicId !== user.clinicId) {
      return { error: "Program not found." };
    }

    if (assignment.targetType === "INDIVIDUAL" && assignment.targetId) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: assignment.targetId,
          clinicId: user.clinicId,
          isActive: true,
        },
      });
      if (!targetUser)
        return { error: "Target staff not found in this clinic." };
    }

    if (assignment.targetType === "BRANCH" && assignment.targetId) {
      const targetBranch = await prisma.branch.findFirst({
        where: {
          id: assignment.targetId,
          clinicId: user.clinicId,
          isActive: true,
        },
      });
      if (!targetBranch)
        return { error: "Target branch not found in this clinic." };
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

export async function recomputeCompensationLedgers(
  clinicSlug: string,
  options?: { from?: string; to?: string },
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const result = await recomputeCompensationLedgersForClinic(user.clinicId, {
      from: options?.from ? new Date(options.from) : undefined,
      to: options?.to ? new Date(options.to) : undefined,
      createdBy: user.name,
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true, ...result };
  } catch (error) {
    console.error("Recompute compensation ledgers error:", error);
    return { error: "Failed to recompute compensation ledgers." };
  }
}

export async function createPayrollRun(
  clinicSlug: string,
  data: {
    staffId: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
  },
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);
  periodEnd.setHours(23, 59, 59, 999);

  if (!data.staffId || Number.isNaN(periodStart.getTime())) {
    return { error: "Staff and period start are required." };
  }
  if (Number.isNaN(periodEnd.getTime()) || periodEnd < periodStart) {
    return { error: "Please enter a valid payroll period." };
  }

  try {
    const staff = await prisma.user.findFirst({
      where: { id: data.staffId, clinicId: user.clinicId, isActive: true },
    });
    if (!staff) return { error: "Staff member not found." };

    const ledgers = await prisma.compensationLedger.findMany({
      where: {
        clinicId: user.clinicId,
        dentistId: data.staffId,
        status: "PAYABLE",
        createdAt: { gte: periodStart, lte: periodEnd },
        payrollItems: { none: {} },
      },
      orderBy: { createdAt: "asc" },
    });

    if (ledgers.length === 0) {
      return { error: "No payable ledger records found for this payroll." };
    }

    const totals = ledgers.reduce(
      (acc, ledger) => {
        const commission = Number(ledger.commission);
        const bonuses = Number(ledger.bonuses);
        acc.grossRevenue += Number(ledger.grossFee);
        acc.netRevenue += Number(ledger.netRevenue);
        acc.commission += commission;
        acc.bonuses += bonuses;
        acc.adjustments += Number(ledger.adjustments);
        acc.totalPayable += commission + bonuses;
        return acc;
      },
      {
        grossRevenue: 0,
        netRevenue: 0,
        commission: 0,
        bonuses: 0,
        adjustments: 0,
        totalPayable: 0,
      },
    );

    const payroll = await prisma.payrollRun.create({
      data: {
        clinicId: user.clinicId,
        staffId: data.staffId,
        periodStart,
        periodEnd,
        grossRevenue: totals.grossRevenue,
        netRevenue: totals.netRevenue,
        commission: totals.commission,
        bonuses: totals.bonuses,
        adjustments: totals.adjustments,
        totalPayable: totals.totalPayable,
        notes: data.notes?.trim() || null,
        items: {
          create: ledgers.map((ledger) => ({
            ledgerId: ledger.id,
            amount: Number(ledger.commission) + Number(ledger.bonuses),
          })),
        },
      },
      include: {
        staff: { select: { name: true, email: true } },
        items: { include: { ledger: true } },
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/payroll`);
    return { success: true, payroll: JSON.parse(JSON.stringify(payroll)) };
  } catch (error) {
    console.error("Create payroll run error:", error);
    return { error: "Failed to create payroll run." };
  }
}

export async function upsertStaffPayProfile(
  clinicSlug: string,
  data: {
    staffId: string;
    dailyRate: number;
    lateDeductionType: "FIXED" | "PERCENTAGE";
    lateDeductionValue: number;
  },
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (!data.staffId) return { error: "Staff member is required." };
  if (data.dailyRate < 0) return { error: "Daily rate cannot be negative." };
  if (data.lateDeductionValue < 0) {
    return { error: "Late deduction cannot be negative." };
  }

  try {
    const staff = await prisma.user.findFirst({
      where: { id: data.staffId, clinicId: user.clinicId, isActive: true },
    });
    if (!staff) return { error: "Staff member not found." };

    const profile = await prisma.staffPayProfile.upsert({
      where: { staffId: data.staffId },
      update: {
        payType: "FIXED_DAILY",
        dailyRate: data.dailyRate,
        lateDeductionType: data.lateDeductionType,
        lateDeductionValue: data.lateDeductionValue,
        isActive: true,
      },
      create: {
        clinicId: user.clinicId,
        staffId: data.staffId,
        payType: "FIXED_DAILY",
        dailyRate: data.dailyRate,
        lateDeductionType: data.lateDeductionType,
        lateDeductionValue: data.lateDeductionValue,
      },
      include: { staff: { select: { name: true, email: true, role: true } } },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/payroll`);
    return { success: true, profile: JSON.parse(JSON.stringify(profile)) };
  } catch (error) {
    console.error("Upsert staff pay profile error:", error);
    return { error: "Failed to save staff pay profile." };
  }
}

export async function upsertStaffAttendance(
  clinicSlug: string,
  data: {
    staffId: string;
    date: string;
    status: "PRESENT" | "HALF_DAY" | "ABSENT";
    timeIn?: string;
    timeOut?: string;
    notes?: string;
  },
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const date = new Date(data.date);
  date.setHours(0, 0, 0, 0);

  if (!data.staffId || Number.isNaN(date.getTime())) {
    return { error: "Staff and date are required." };
  }
  if (data.status === "PRESENT" && (!data.timeIn || !data.timeOut)) {
    return { error: "Time in and time out are required for worked days." };
  }

  try {
    const staff = await prisma.user.findFirst({
      where: { id: data.staffId, clinicId: user.clinicId, isActive: true },
    });
    if (!staff) return { error: "Staff member not found." };

    const attendance = await prisma.staffAttendance.upsert({
      where: {
        clinicId_staffId_date: {
          clinicId: user.clinicId,
          staffId: data.staffId,
          date,
        },
      },
      update: {
        status: data.status,
        timeIn: data.status === "PRESENT" ? data.timeIn || null : null,
        timeOut: data.status === "PRESENT" ? data.timeOut || null : null,
        notes: data.notes?.trim() || null,
      },
      create: {
        clinicId: user.clinicId,
        staffId: data.staffId,
        date,
        status: data.status,
        timeIn: data.status === "PRESENT" ? data.timeIn || null : null,
        timeOut: data.status === "PRESENT" ? data.timeOut || null : null,
        notes: data.notes?.trim() || null,
      },
      include: { staff: { select: { name: true, email: true } } },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/payroll`);
    return {
      success: true,
      attendance: JSON.parse(JSON.stringify(attendance)),
    };
  } catch (error) {
    console.error("Upsert staff attendance error:", error);
    return { error: "Failed to save attendance." };
  }
}

function parseTimeToMinutes(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function computeDailySalaryAmount(params: {
  status: string;
  dailyRate: number;
  timeIn: string | null;
  timeOut: string | null;
  expectedTimeIn: string | null;
  expectedTimeOut: string | null;
  breakMinutes: number;
  lateGraceMinutes: number;
}) {
  if (params.status === "ABSENT") {
    return {
      amount: 0,
      computedStatus: "ABSENT",
      lateMinutes: 0,
      undertimeMinutes: 0,
      deduction: params.dailyRate,
    };
  }
  if (params.status === "HALF_DAY") {
    return {
      amount: params.dailyRate * 0.5,
      computedStatus: "HALF_DAY",
      lateMinutes: 0,
      undertimeMinutes: 0,
      deduction: params.dailyRate * 0.5,
    };
  }

  const expectedIn =
    parseTimeToMinutes(params.expectedTimeIn || "08:00") ?? 480;
  const expectedOut =
    parseTimeToMinutes(params.expectedTimeOut || "17:00") ?? 1020;
  const actualIn = parseTimeToMinutes(params.timeIn);
  const actualOut = parseTimeToMinutes(params.timeOut);
  const scheduledMinutes = Math.max(
    1,
    expectedOut - expectedIn - params.breakMinutes,
  );
  const ratePerMinute = params.dailyRate / scheduledMinutes;

  if (actualIn === null || actualOut === null) {
    return {
      amount: 0,
      computedStatus: "MISSING_TIME",
      lateMinutes: 0,
      undertimeMinutes: 0,
      deduction: params.dailyRate,
    };
  }

  const lateMinutes = Math.max(
    0,
    actualIn - expectedIn - params.lateGraceMinutes,
  );
  const undertimeMinutes = Math.max(0, expectedOut - actualOut);
  const deduction = (lateMinutes + undertimeMinutes) * ratePerMinute;
  const amount = Math.max(0, params.dailyRate - deduction);
  const computedStatus =
    lateMinutes > 0 && undertimeMinutes > 0
      ? "LATE_UNDERTIME"
      : lateMinutes > 0
        ? "LATE"
        : undertimeMinutes > 0
          ? "UNDERTIME"
          : "PRESENT";

  return {
    amount,
    computedStatus,
    lateMinutes,
    undertimeMinutes,
    deduction,
  };
}

export async function createDailySalaryPayrollRun(
  clinicSlug: string,
  data: {
    staffId: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
  },
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const periodStart = new Date(data.periodStart);
  const periodEnd = new Date(data.periodEnd);
  periodStart.setHours(0, 0, 0, 0);
  periodEnd.setHours(23, 59, 59, 999);

  if (!data.staffId || Number.isNaN(periodStart.getTime())) {
    return { error: "Staff and period start are required." };
  }
  if (Number.isNaN(periodEnd.getTime()) || periodEnd < periodStart) {
    return { error: "Please enter a valid payroll period." };
  }

  try {
    const profile = await prisma.staffPayProfile.findFirst({
      where: {
        clinicId: user.clinicId,
        staffId: data.staffId,
        isActive: true,
      },
      include: { staff: true },
    });
    if (!profile) return { error: "Staff member has no daily pay profile." };
    if (profile.payType !== "FIXED_DAILY" && profile.payType !== "DAILY") {
      return {
        error:
          "This staff member is set to procedure based compensation, not fixed daily salary.",
      };
    }

    const attendance = await prisma.staffAttendance.findMany({
      where: {
        clinicId: user.clinicId,
        staffId: data.staffId,
        date: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { date: "asc" },
    });

    if (attendance.length === 0) {
      return { error: "No attendance records found for this period." };
    }

    const dailyRate = Number(profile.dailyRate);
    const summary = attendance.reduce(
      (acc, item) => {
        const computed = computeDailySalaryAmount({
          status: item.status,
          dailyRate,
          timeIn: item.timeIn,
          timeOut: item.timeOut,
          expectedTimeIn: profile.expectedTimeIn,
          expectedTimeOut: profile.expectedTimeOut,
          breakMinutes: profile.breakMinutes,
          lateGraceMinutes: profile.lateGraceMinutes,
        });
        const amount = computed.amount;
        acc.totalPayable += amount;
        acc.days += 1;
        acc.totalLateMinutes += computed.lateMinutes;
        acc.totalUndertimeMinutes += computed.undertimeMinutes;
        acc.totalDeductions += computed.deduction;
        acc.statusCounts[computed.computedStatus] =
          (acc.statusCounts[computed.computedStatus] || 0) + 1;
        acc.items.push({
          date: item.date.toISOString(),
          status: computed.computedStatus,
          attendanceStatus: item.status,
          timeIn: item.timeIn,
          timeOut: item.timeOut,
          lateMinutes: computed.lateMinutes,
          undertimeMinutes: computed.undertimeMinutes,
          deduction: Number(computed.deduction.toFixed(2)),
          amount: Number(amount.toFixed(2)),
          notes: item.notes,
        });
        return acc;
      },
      {
        days: 0,
        totalPayable: 0,
        totalLateMinutes: 0,
        totalUndertimeMinutes: 0,
        totalDeductions: 0,
        statusCounts: {} as Record<string, number>,
        items: [] as Array<{
          date: string;
          status: string;
          attendanceStatus: string;
          timeIn: string | null;
          timeOut: string | null;
          lateMinutes: number;
          undertimeMinutes: number;
          deduction: number;
          amount: number;
          notes: string | null;
        }>,
      },
    );

    const payroll = await prisma.payrollRun.create({
      data: {
        clinicId: user.clinicId,
        staffId: data.staffId,
        periodStart,
        periodEnd,
        grossRevenue: 0,
        netRevenue: 0,
        commission: 0,
        bonuses: 0,
        adjustments: 0,
        totalPayable: Number(summary.totalPayable.toFixed(2)),
        runType: "DAILY_SALARY",
        attendanceSummary: {
          dailyRate,
          expectedTimeIn: profile.expectedTimeIn,
          expectedTimeOut: profile.expectedTimeOut,
          breakMinutes: profile.breakMinutes,
          lateGraceMinutes: profile.lateGraceMinutes,
          ratePerMinute:
            dailyRate /
            Math.max(
              1,
              (parseTimeToMinutes(profile.expectedTimeOut || "17:00") ?? 1020) -
                (parseTimeToMinutes(profile.expectedTimeIn || "08:00") ?? 480) -
                profile.breakMinutes,
            ),
          days: summary.days,
          totalLateMinutes: summary.totalLateMinutes,
          totalUndertimeMinutes: summary.totalUndertimeMinutes,
          totalDeductions: Number(summary.totalDeductions.toFixed(2)),
          statusCounts: summary.statusCounts,
          items: summary.items,
        },
        notes: data.notes?.trim() || null,
      },
      include: {
        staff: { select: { name: true, email: true } },
        items: { include: { ledger: true } },
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/payroll`);
    return { success: true, payroll: JSON.parse(JSON.stringify(payroll)) };
  } catch (error) {
    console.error("Create daily salary payroll error:", error);
    return { error: "Failed to create daily salary payroll." };
  }
}

export async function approvePayrollRun(
  clinicSlug: string,
  payrollRunId: string,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const payroll = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, clinicId: user.clinicId },
    });
    if (!payroll) return { error: "Payroll run not found." };
    if (payroll.status !== "DRAFT") {
      return { error: "Only draft payroll runs can be approved." };
    }

    await prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: {
        status: "APPROVED",
        approvedBy: user.name,
        approvedAt: new Date(),
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/payroll`);
    return { success: true };
  } catch (error) {
    console.error("Approve payroll run error:", error);
    return { error: "Failed to approve payroll run." };
  }
}

export async function markPayrollRunPaid(
  clinicSlug: string,
  payrollRunId: string,
  data: {
    paymentMethod?: string;
    reference?: string;
    notes?: string;
  },
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const payroll = await prisma.payrollRun.findFirst({
      where: { id: payrollRunId, clinicId: user.clinicId },
      include: { items: true },
    });
    if (!payroll) return { error: "Payroll run not found." };
    if (payroll.status !== "APPROVED") {
      return { error: "Only approved payroll runs can be marked as paid." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.payrollRun.update({
        where: { id: payrollRunId },
        data: {
          status: "PAID",
          paidBy: user.name,
          paidAt: new Date(),
          paymentMethod: data.paymentMethod?.trim() || null,
          reference: data.reference?.trim() || null,
          notes: data.notes?.trim() || payroll.notes,
        },
      });

      const ledgerIds = payroll.items.map((item) => item.ledgerId);
      if (ledgerIds.length > 0) {
        await tx.compensationLedger.updateMany({
          where: {
            id: { in: ledgerIds },
            status: "PAYABLE",
          },
          data: { status: "PAID" },
        });
      }
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/payroll`);
    return { success: true };
  } catch (error) {
    console.error("Mark payroll paid error:", error);
    return { error: "Failed to mark payroll as paid." };
  }
}
