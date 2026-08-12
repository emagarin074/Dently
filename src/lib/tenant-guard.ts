/**
 * Strict Multi-Tenant Data Isolation Guard
 * Enforces clinicId scoping across all database operations
 */

import { prisma } from "@/lib/prisma";

export async function validateTenantAccess(
  clinicSlug: string,
  targetClinicId?: string,
) {
  if (!clinicSlug) {
    throw new Error("[TenantGuard Violation] Missing clinic slug");
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug, isActive: true },
    select: { id: true, name: true, slug: true, isActive: true },
  });

  if (!clinic) {
    throw new Error(
      `[TenantGuard Violation] Clinic "${clinicSlug}" not found or inactive`,
    );
  }

  if (targetClinicId && clinic.id !== targetClinicId) {
    throw new Error(
      `[TenantGuard Security Exception] Unauthorized cross-tenant access attempt between ${clinic.id} and ${targetClinicId}`,
    );
  }

  return clinic;
}

export function enforceTenantFilter<T extends { clinicId: string }>(
  records: T[],
  expectedClinicId: string,
): T[] {
  return records.filter((r) => r.clinicId === expectedClinicId);
}
