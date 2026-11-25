import { requireAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { CompensationLedgerClient } from "@/components/admin/compensation/compensation-ledger-client";
import { PayrollRunClient } from "@/components/admin/compensation/payroll-run-client";
import { StaffPayrollClient } from "@/components/admin/compensation/staff-payroll-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payroll" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PayrollPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireAdminAuth(slug);
  if (!user) redirect(`/clinic/${slug}/admin`);

  const [ledgers, payrollRuns, staff, profiles, attendance] = await Promise.all(
    [
      prisma.compensationLedger.findMany({
        where: { clinicId: user.clinicId },
        include: {
          program: { select: { name: true, version: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.payrollRun.findMany({
        where: { clinicId: user.clinicId },
        include: {
          staff: { select: { name: true, email: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.user.findMany({
        where: { clinicId: user.clinicId, isActive: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.staffPayProfile.findMany({
        where: { clinicId: user.clinicId, isActive: true },
        include: {
          staff: { select: { name: true, email: true, role: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.staffAttendance.findMany({
        where: { clinicId: user.clinicId },
        include: {
          staff: { select: { name: true, email: true } },
        },
        orderBy: { date: "desc" },
        take: 100,
      }),
    ],
  );
  const payrollRunKey =
    payrollRuns.map((run) => `${run.id}:${run.status}`).join("|") || "empty";

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Payroll" userName={user.name} />
      <main className="flex-1 space-y-6 p-4 lg:p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Compensation & Payroll
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review computed compensation ledgers, create payroll runs, approve
            payouts, and mark payroll as paid.
          </p>
        </div>

        <CompensationLedgerClient
          ledgers={JSON.parse(JSON.stringify(ledgers))}
        />
        <StaffPayrollClient
          clinicSlug={slug}
          staff={JSON.parse(JSON.stringify(staff))}
          profiles={JSON.parse(JSON.stringify(profiles))}
          attendance={JSON.parse(JSON.stringify(attendance))}
        />
        <PayrollRunClient
          key={payrollRunKey}
          clinicSlug={slug}
          staff={JSON.parse(JSON.stringify(staff))}
          payrollRuns={JSON.parse(JSON.stringify(payrollRuns))}
        />
      </main>
    </>
  );
}
