import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { runCompensationEngine } from "@/lib/compensation/engine";
import { TreatmentInput } from "@/lib/compensation/types";

type DbClient = PrismaClient | Prisma.TransactionClient;

type ProgramWithRulesAndAssignments = Prisma.CompensationProgramGetPayload<{
  include: {
    rules: true;
    assignments: true;
  };
}>;

const ASSIGNMENT_PRIORITY: Record<string, number> = {
  INDIVIDUAL: 0,
  ROLE: 1,
  SPECIALIZATION: 2,
  BRANCH: 3,
  CLINIC: 4,
  UNASSIGNED: 5,
};

function getMonthRange(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function normalizeTreatmentStatus(
  status: string,
): TreatmentInput["treatmentStatus"] {
  if (status === "COMPLETED" || status === "CANCELLED") return status;
  if (status === "CHECKED_IN") return "CHECKED_IN";
  return "PENDING";
}

function programMatchesInput(
  program: ProgramWithRulesAndAssignments,
  input: {
    dentistId: string;
    dentistRole?: string | null;
    dentistSpecialization?: string | null;
    branch?: string | null;
  },
) {
  if (program.branch && program.branch !== input.branch) return null;

  if (program.assignments.length === 0) {
    return ASSIGNMENT_PRIORITY.UNASSIGNED;
  }

  let bestPriority: number | null = null;
  for (const assignment of program.assignments) {
    let matches = false;

    if (
      assignment.targetType === "INDIVIDUAL" &&
      assignment.targetId === input.dentistId
    ) {
      matches = true;
    } else if (
      assignment.targetType === "ROLE" &&
      assignment.targetId === input.dentistRole
    ) {
      matches = true;
    } else if (
      assignment.targetType === "SPECIALIZATION" &&
      assignment.targetId === input.dentistSpecialization
    ) {
      matches = true;
    } else if (
      assignment.targetType === "BRANCH" &&
      assignment.targetId === input.branch
    ) {
      matches = true;
    } else if (assignment.targetType === "CLINIC") {
      matches = true;
    }

    if (matches) {
      const priority =
        ASSIGNMENT_PRIORITY[assignment.targetType] ??
        ASSIGNMENT_PRIORITY.UNASSIGNED;
      bestPriority =
        bestPriority === null ? priority : Math.min(bestPriority, priority);
    }
  }

  return bestPriority;
}

async function findApplicableProgram(
  db: DbClient,
  clinicId: string,
  input: {
    dentistId: string;
    dentistRole?: string | null;
    dentistSpecialization?: string | null;
    branch?: string | null;
  },
) {
  const programs = await db.compensationProgram.findMany({
    where: {
      clinicId,
      status: "PUBLISHED",
      isLatest: true,
      OR: [{ effectiveDate: null }, { effectiveDate: { lte: new Date() } }],
    },
    include: {
      rules: { orderBy: { priority: "asc" } },
      assignments: true,
    },
    orderBy: [{ version: "desc" }, { updatedAt: "desc" }],
  });

  const matches = programs
    .map((program) => ({
      program,
      priority: programMatchesInput(program, input),
    }))
    .filter(
      (
        item,
      ): item is {
        program: ProgramWithRulesAndAssignments;
        priority: number;
      } => item.priority !== null,
    )
    .sort((a, b) => a.priority - b.priority);

  return matches[0]?.program ?? null;
}

async function getMonthlyYtdProduction(
  db: DbClient,
  clinicId: string,
  dentistId: string,
  date: Date,
  excludeTreatmentId?: string,
) {
  const { start, end } = getMonthRange(date);
  const result = await db.compensationLedger.aggregate({
    where: {
      clinicId,
      dentistId,
      createdAt: { gte: start, lt: end },
      ...(excludeTreatmentId
        ? { treatmentId: { not: excludeTreatmentId } }
        : {}),
    },
    _sum: { grossFee: true },
  });

  return Number(result._sum.grossFee || 0);
}

export async function generateCompensationLedgerForTreatment(
  appointmentProcedureId: string,
  options: {
    db?: DbClient;
    createdBy?: string;
    force?: boolean;
  } = {},
) {
  const db = options.db ?? prisma;

  const treatment = await db.appointmentProcedure.findUnique({
    where: { id: appointmentProcedureId },
    include: {
      procedure: true,
      dentist: true,
      appointment: {
        include: {
          billing: true,
          patient: true,
          dentist: true,
          branch: true,
        },
      },
      compensationLedger: true,
    },
  });

  if (!treatment) return { skipped: true, reason: "Treatment not found" };
  if (treatment.compensationLedger?.status === "PAID" && !options.force) {
    return { skipped: true, reason: "Ledger has already been paid" };
  }

  const dentist = treatment.dentist ?? treatment.appointment.dentist;
  const dentistId = treatment.dentistId ?? treatment.appointment.dentistId;
  if (!dentist || !dentistId) {
    return { skipped: true, reason: "No dentist assigned to treatment" };
  }

  const billing = treatment.appointment.billing;
  if (!billing) return { skipped: true, reason: "No billing record found" };

  const program = await findApplicableProgram(
    db,
    treatment.appointment.clinicId,
    {
      dentistId,
      dentistRole: dentist.role,
      dentistSpecialization: dentist.specialization,
      branch: treatment.appointment.branch?.name ?? null,
    },
  );

  if (!program) {
    return { skipped: true, reason: "No published compensation program found" };
  }

  const grossFee = Number(treatment.price || 0);
  const monthlyYtdProduction =
    (await getMonthlyYtdProduction(
      db,
      treatment.appointment.clinicId,
      dentistId,
      new Date(),
      treatment.id,
    )) + grossFee;

  const input: TreatmentInput = {
    treatmentId: treatment.id,
    patientId: treatment.appointment.patientId ?? undefined,
    dentistId,
    dentistRole: dentist.role,
    dentistSpecialization: dentist.specialization ?? undefined,
    branch: treatment.appointment.branch?.name ?? undefined,
    procedureName: treatment.procedure.name,
    grossFee,
    discount: 0,
    labFee: 0,
    tax: 0,
    paymentStatus: billing.status,
    treatmentStatus: normalizeTreatmentStatus(treatment.appointment.status),
    monthlyYtdProduction,
  };

  const output = runCompensationEngine(
    {
      id: program.id,
      name: program.name,
      version: program.version,
      rules: program.rules.map((rule) => ({
        id: rule.id,
        ruleType: rule.ruleType,
        priority: rule.priority,
        enabled: rule.enabled,
        behavior: rule.behavior,
        config: rule.config as Record<string, unknown>,
      })),
    },
    input,
  );

  const data = {
    clinicId: treatment.appointment.clinicId,
    treatmentId: treatment.id,
    patientId: treatment.appointment.patientId,
    dentistId,
    procedureName: treatment.procedure.name,
    branch: treatment.appointment.branch?.name ?? null,
    grossFee: output.grossFee,
    discount: output.discount,
    labFee: output.labFee,
    tax: output.tax,
    netRevenue: output.netRevenue,
    programId: output.programId,
    programVersion: output.programVersion,
    appliedRules: output.appliedRules as unknown as Prisma.InputJsonValue,
    commission: output.commission,
    bonuses: output.bonuses,
    adjustments: output.adjustments,
    clinicRevenue: output.clinicRevenue,
    status: output.status,
    paymentStatus: billing.status,
    createdBy: options.createdBy ?? null,
  };

  const existing = await db.compensationLedger.findUnique({
    where: { treatmentId: treatment.id },
  });

  if (existing?.status === "PAID" && !options.force) {
    return { skipped: true, reason: "Ledger has already been paid" };
  }

  const ledger = existing
    ? await db.compensationLedger.update({
        where: { id: existing.id },
        data,
      })
    : await db.compensationLedger.create({ data });

  return { success: true, ledger };
}

export async function generateCompensationLedgersForBilling(
  billingId: string,
  options: { db?: DbClient; createdBy?: string; force?: boolean } = {},
) {
  const db = options.db ?? prisma;
  const billing = await db.billing.findUnique({
    where: { id: billingId },
    include: {
      appointment: {
        include: {
          procedures: { select: { id: true } },
        },
      },
    },
  });

  if (!billing) return { success: false, processed: 0, skipped: 0 };

  let processed = 0;
  let skipped = 0;
  for (const procedure of billing.appointment.procedures) {
    const result = await generateCompensationLedgerForTreatment(procedure.id, {
      db,
      createdBy: options.createdBy,
      force: options.force,
    });

    if ("success" in result && result.success) {
      processed += 1;
    } else {
      skipped += 1;
    }
  }

  return { success: true, processed, skipped };
}

export async function recomputeCompensationLedgersForClinic(
  clinicId: string,
  options: {
    db?: DbClient;
    from?: Date;
    to?: Date;
    createdBy?: string;
  } = {},
) {
  const db = options.db ?? prisma;
  const billings = await db.billing.findMany({
    where: {
      clinicId,
      ...(options.from || options.to
        ? {
            updatedAt: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    select: {
      id: true,
      appointment: {
        select: {
          procedures: { select: { id: true } },
        },
      },
    },
  });

  const handledTreatmentIds = new Set<string>();
  let processed = 0;
  let skipped = 0;

  for (const billing of billings) {
    for (const procedure of billing.appointment.procedures) {
      handledTreatmentIds.add(procedure.id);
    }

    const result = await generateCompensationLedgersForBilling(billing.id, {
      db,
      createdBy: options.createdBy,
    });
    processed += result.processed;
    skipped += result.skipped;
  }

  const ledgers = await db.compensationLedger.findMany({
    where: {
      clinicId,
      status: { in: ["PENDING", "PAYABLE", "BLOCKED"] },
      treatmentId: { not: null },
      ...(options.from || options.to
        ? {
            createdAt: {
              ...(options.from ? { gte: options.from } : {}),
              ...(options.to ? { lte: options.to } : {}),
            },
          }
        : {}),
    },
    select: { treatmentId: true },
  });

  for (const ledger of ledgers) {
    if (!ledger.treatmentId || handledTreatmentIds.has(ledger.treatmentId)) {
      continue;
    }

    const result = await generateCompensationLedgerForTreatment(
      ledger.treatmentId,
      {
        db,
        createdBy: options.createdBy,
      },
    );

    if ("success" in result && result.success) {
      processed += 1;
    } else {
      skipped += 1;
    }
  }

  return { processed, skipped };
}
