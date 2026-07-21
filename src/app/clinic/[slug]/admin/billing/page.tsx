import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { BillingClient } from "@/components/admin/billing-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Billing" };

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { status, page } = await searchParams;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  // Fetch standard billings (exclude ghost invoices with 0 total)
  const billings = await prisma.billing.findMany({
    where: {
      clinicId: user.clinicId,
      totalAmount: { gt: 0 },
    },
    include: {
      appointment: {
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          procedures: { include: { procedure: { select: { name: true } } } },
        },
      },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch installment payments
  const installments = await prisma.installmentPayment.findMany({
    where: {
      installmentPlan: { clinicId: user.clinicId },
    },
    include: {
      installmentPlan: {
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          billing: { include: { payments: true } },
        },
      },
    },
    orderBy: { paidAt: "desc" },
  });

  // Map Standard Billings
  const rows = billings.map((b) => {
    const total = Number(b.totalAmount);
    const paid = b.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    return {
      id: `std-${b.id}`,
      patientName: b.appointment.patient
        ? `${b.appointment.patient.firstName} ${b.appointment.patient.lastName}`
        : b.appointment.bookingName || "—",
      procedures:
        b.appointment.procedures.map((p) => p.procedure.name).join(", ") ||
        "Standard Procedures",
      totalAmount: total,
      transactionAmount: paid,
      paidAmount: paid,
      balance: balance,
      status: balance <= 0 ? "FULLY_PAID" : "PARTIALLY_PAID",
      date: b.createdAt.toISOString(),
    };
  });

  // Map Installment Payments
  // To correctly show cumulative balance at the time of each payment, we need to sort all payments per plan
  const planMap = new Map<string, typeof installments>();
  installments.forEach((inst) => {
    const planId = inst.installmentPlanId;
    if (!planMap.has(planId)) planMap.set(planId, []);
    planMap.get(planId)!.push(inst);
  });

  planMap.forEach((planInstallments, planId) => {
    // Sort chronologically ascending to calculate running totals
    planInstallments.sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());

    const plan = planInstallments[0].installmentPlan;
    const planTotal = Number(plan.totalAmount);

    // Calculate initial downpayment from the plan's original invoice
    const downpayment = plan.billing
      ? plan.billing.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;
    let runningPaid = downpayment;

    planInstallments.forEach((inst) => {
      if (inst.notes === "Downpayment") return; // Skip generating a separate row for the downpayment

      runningPaid += Number(inst.amount);
      const balance = Math.max(0, planTotal - runningPaid);
      rows.push({
        id: `inst-${inst.id}`,
        patientName: plan.patient
          ? `${plan.patient.firstName} ${plan.patient.lastName}`
          : "—",
        procedures: `Installment Payment${plan.notes ? ` (${plan.notes})` : " (Braces)"}`,
        totalAmount: planTotal,
        transactionAmount: Number(inst.amount),
        paidAmount: runningPaid, // Cumulative paid up to this transaction
        balance: balance,
        status: balance <= 0 ? "FULLY_PAID" : "PARTIALLY_PAID",
        date: inst.paidAt.toISOString(),
      });
    });
  });

  // Sort combined rows by date descending
  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply status filter if provided
  const filteredRows =
    status && status !== "ALL" ? rows.filter((r) => r.status === status) : rows;

  const take = 20;
  const skip = (parseInt(page || "1") - 1) * take;
  const paginatedRows = filteredRows.slice(skip, skip + take);

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Billing & Payments"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6">
        <BillingClient
          rows={paginatedRows}
          total={filteredRows.length}
          page={parseInt(page || "1")}
        />
      </main>
    </>
  );
}
