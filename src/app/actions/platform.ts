"use server";

import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/super-admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface PlatformOverviewStats {
  totalClinics: number;
  activeClinics: number;
  suspendedClinics: number;
  totalPatients: number;
  todayVisits: number;
  monthVisits: number;
}

export interface PlatformClinicItem {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  plan: string;
  branchLimit: number;
  planExpiresAt: string | null;
  planNotes: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    role: string;
  } | null;
  metrics: {
    totalPatients: number;
    totalStaff: number;
    activeBranches: number;
    totalBranches: number;
    todayVisits: number;
    monthVisits: number;
    totalVisits: number;
  };
}

export interface GetPlatformClinicsResult {
  clinics: PlatformClinicItem[];
  total: number;
  page: number;
  totalPages: number;
  overview: PlatformOverviewStats;
}

function getStartAndEndOfToday() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getStartAndEndOfMonth() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

export async function getPlatformOverview(): Promise<PlatformOverviewStats> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const { start: todayStart, end: todayEnd } = getStartAndEndOfToday();
  const { start: monthStart, end: monthEnd } = getStartAndEndOfMonth();

  const [
    totalClinics,
    activeClinics,
    suspendedClinics,
    totalPatients,
    todayVisits,
    monthVisits,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { isActive: true } }),
    prisma.clinic.count({ where: { isActive: false } }),
    prisma.patient.count(),
    prisma.appointment.count({
      where: {
        OR: [
          { scheduledDate: { gte: todayStart, lte: todayEnd } },
          {
            scheduledDate: null,
            preferredDate: { gte: todayStart, lte: todayEnd },
          },
        ],
      },
    }),
    prisma.appointment.count({
      where: {
        OR: [
          { scheduledDate: { gte: monthStart, lte: monthEnd } },
          {
            scheduledDate: null,
            preferredDate: { gte: monthStart, lte: monthEnd },
          },
        ],
      },
    }),
  ]);

  return {
    totalClinics,
    activeClinics,
    suspendedClinics,
    totalPatients,
    todayVisits,
    monthVisits,
  };
}

export async function getPlatformClinics({
  search = "",
  plan = "ALL",
  status = "ALL",
  page = 1,
  limit = 10,
}: {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<GetPlatformClinicsResult> {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    throw new Error("Unauthorized: Super Admin access required.");
  }

  const { start: todayStart, end: todayEnd } = getStartAndEndOfToday();
  const { start: monthStart, end: monthEnd } = getStartAndEndOfMonth();

  const whereClause: Record<string, unknown> = {};

  if (plan && plan !== "ALL") {
    whereClause.plan = { equals: plan, mode: "insensitive" };
  }

  if (status === "ACTIVE") {
    whereClause.isActive = true;
  } else if (status === "SUSPENDED") {
    whereClause.isActive = false;
  }

  if (search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { slug: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term, mode: "insensitive" } },
      {
        users: {
          some: {
            OR: [
              { name: { contains: term, mode: "insensitive" } },
              { email: { contains: term, mode: "insensitive" } },
              { phoneNumber: { contains: term, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(50, limit));
  const skip = (safePage - 1) * safeLimit;

  const [total, rawClinics, overview] = await Promise.all([
    prisma.clinic.count({ where: whereClause }),
    prisma.clinic.findMany({
      where: whereClause,
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            role: true,
          },
          orderBy: { role: "asc" },
        },
        branches: {
          select: { isActive: true },
        },
        _count: {
          select: {
            patients: true,
            users: true,
            appointments: true,
            branches: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
    }),
    getPlatformOverview(),
  ]);

  // Fetch per-clinic traffic counts (strictly non-financial customer volumes)
  const clinicIds = rawClinics.map((c) => c.id);

  const [todayCounts, monthCounts] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["clinicId"],
      where: {
        clinicId: { in: clinicIds },
        OR: [
          { scheduledDate: { gte: todayStart, lte: todayEnd } },
          {
            scheduledDate: null,
            preferredDate: { gte: todayStart, lte: todayEnd },
          },
        ],
      },
      _count: { _all: true },
    }),
    prisma.appointment.groupBy({
      by: ["clinicId"],
      where: {
        clinicId: { in: clinicIds },
        OR: [
          { scheduledDate: { gte: monthStart, lte: monthEnd } },
          {
            scheduledDate: null,
            preferredDate: { gte: monthStart, lte: monthEnd },
          },
        ],
      },
      _count: { _all: true },
    }),
  ]);

  const todayCountMap = new Map<string, number>();
  todayCounts.forEach((tc) => todayCountMap.set(tc.clinicId, tc._count._all));

  const monthCountMap = new Map<string, number>();
  monthCounts.forEach((mc) => monthCountMap.set(mc.clinicId, mc._count._all));

  const clinics: PlatformClinicItem[] = rawClinics.map((clinic) => {
    // Primary owner is the first DENTIST_ADMIN user or first user
    const ownerUser =
      clinic.users.find((u) => u.role === "DENTIST_ADMIN") ||
      clinic.users[0] ||
      null;

    return {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
      logoUrl: clinic.logoUrl,
      phone: clinic.phone,
      email: clinic.email,
      address: clinic.address,
      isActive: clinic.isActive,
      plan: clinic.plan,
      branchLimit: clinic.branchLimit,
      planExpiresAt: clinic.planExpiresAt
        ? clinic.planExpiresAt.toISOString()
        : null,
      planNotes: clinic.planNotes,
      createdAt: clinic.createdAt.toISOString(),
      owner: ownerUser
        ? {
            id: ownerUser.id,
            name: ownerUser.name,
            email: ownerUser.email,
            phoneNumber: ownerUser.phoneNumber,
            role: ownerUser.role,
          }
        : null,
      metrics: {
        totalPatients: clinic._count.patients,
        totalStaff: clinic._count.users,
        activeBranches: clinic.branches.filter((branch) => branch.isActive)
          .length,
        totalBranches: clinic._count.branches,
        todayVisits: todayCountMap.get(clinic.id) || 0,
        monthVisits: monthCountMap.get(clinic.id) || 0,
        totalVisits: clinic._count.appointments,
      },
    };
  });

  return {
    clinics,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit) || 1,
    overview,
  };
}

const updatePlanSchema = z.object({
  clinicId: z.string().min(1, "Clinic ID is required"),
  plan: z.string().min(1, "Plan name is required"),
  branchLimit: z.coerce
    .number()
    .int("Branch limit must be a whole number.")
    .min(1, "Branch limit must be at least 1.")
    .max(100, "Branch limit cannot exceed 100."),
  isActive: z.boolean().optional(),
  planNotes: z.string().optional().nullable(),
  planExpiresAt: z.string().optional().nullable(),
});

export async function updateClinicPlan(data: {
  clinicId: string;
  plan: string;
  branchLimit: number;
  isActive?: boolean;
  planNotes?: string | null;
  planExpiresAt?: string | null;
}) {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return { error: "Unauthorized: Super Admin access required." };
  }

  const parsed = updatePlanSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { clinicId, plan, branchLimit, isActive, planNotes, planExpiresAt } =
    parsed.data;

  try {
    const existing = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!existing) {
      return { error: "Clinic not found." };
    }

    const activeBranchCount = await prisma.branch.count({
      where: { clinicId, isActive: true },
    });

    if (branchLimit < activeBranchCount) {
      return {
        error: `Branch limit cannot be lower than the clinic's ${activeBranchCount} active branch${activeBranchCount === 1 ? "" : "es"}.`,
      };
    }

    const updated = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        plan,
        branchLimit,
        ...(typeof isActive === "boolean" ? { isActive } : {}),
        planNotes: planNotes !== undefined ? planNotes : existing.planNotes,
        planExpiresAt:
          planExpiresAt !== undefined
            ? planExpiresAt
              ? new Date(planExpiresAt)
              : null
            : existing.planExpiresAt,
      },
    });

    revalidatePath("/platform/clinics");
    return { success: true, clinic: updated };
  } catch (error) {
    console.error("Failed to update clinic plan:", error);
    return { error: "Failed to update clinic plan. Please try again." };
  }
}

export async function toggleClinicStatus({
  clinicId,
  isActive,
}: {
  clinicId: string;
  isActive: boolean;
}) {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return { error: "Unauthorized: Super Admin access required." };
  }

  try {
    const existing = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!existing) {
      return { error: "Clinic not found." };
    }

    const updated = await prisma.clinic.update({
      where: { id: clinicId },
      data: { isActive },
    });

    revalidatePath("/platform/clinics");
    return { success: true, clinic: updated };
  } catch (error) {
    console.error("Failed to toggle clinic status:", error);
    return { error: "Failed to toggle clinic status. Please try again." };
  }
}
