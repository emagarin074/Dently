"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PaymentMethod, InstallmentStatus } from "@prisma/client";

const VALID_PAYMENT_METHODS: string[] = Object.values(PaymentMethod);

function revalidate(slug: string, patientId: string) {
  revalidatePath(`/clinic/${slug}/admin/patients/${patientId}`);
  revalidatePath(`/clinic/${slug}/admin/billing`);
  revalidatePath(`/clinic/${slug}/admin/bookings`);
}

export async function createInstallmentPlanWithDownpayment(
  clinicSlug: string,
  patientId: string,
  data: {
    totalAmount: number;
    billingId: string;
    downpayment: number;
    method: string;
    reference?: string;
    notes?: string;
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (data.totalAmount <= 0)
    return { error: "Total amount must be greater than zero." };
  if (data.downpayment <= 0)
    return { error: "Downpayment amount must be greater than zero." };
  if (data.downpayment > data.totalAmount)
    return { error: "Downpayment cannot exceed the total treatment amount." };
  if (!VALID_PAYMENT_METHODS.includes(data.method))
    return { error: "Invalid payment method." };

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: user.clinicId },
    });
    if (!patient) return { error: "Patient not found." };

    // Check if a plan already exists for this billing
    const existing = await prisma.installmentPlan.findUnique({
      where: { billingId: data.billingId },
    });
    if (existing)
      return { error: "An installment plan already exists for this billing." };

    await prisma.$transaction(async (tx) => {
      // 1. Create the installment plan (total = full treatment amount)
      const plan = await tx.installmentPlan.create({
        data: {
          clinicId: user.clinicId,
          patientId,
          billingId: data.billingId,
          totalAmount: data.totalAmount,
          paidAmount: data.downpayment,
          notes: data.notes || null,
          status: data.downpayment >= data.totalAmount ? "COMPLETED" : "ACTIVE",
        },
      });

      // 2. Record the downpayment as the first installment entry
      await tx.installmentPayment.create({
        data: {
          installmentPlanId: plan.id,
          amount: data.downpayment,
          method: data.method as PaymentMethod,
          reference: data.reference || null,
          notes: "Downpayment",
        },
      });

      // 3. Also record the downpayment on the billing invoice
      const billingForUpdate = await tx.billing.findUnique({
        where: { id: data.billingId },
      });
      const newBillingPaid =
        Number(billingForUpdate?.paidAmount || 0) + data.downpayment;
      const newBillingStatus =
        newBillingPaid >= Number(billingForUpdate?.totalAmount || 0)
          ? "FULLY_PAID"
          : newBillingPaid > 0
            ? "PARTIALLY_PAID"
            : "UNPAID";

      await tx.billing.update({
        where: { id: data.billingId },
        data: {
          paidAmount: newBillingPaid,
          status: newBillingStatus,
        },
      });

      // 4. Also record a standard Payment entry on the billing so it shows in checkout history
      await tx.payment.create({
        data: {
          billingId: data.billingId,
          amount: data.downpayment,
          method: data.method as PaymentMethod,
          reference: data.reference || null,
          notes: "Downpayment",
        },
      });

      // 5. Update the Appointment and QueueEntry status to COMPLETED
      const billing = await tx.billing.findUnique({
        where: { id: data.billingId },
      });
      if (billing) {
        await tx.appointment.update({
          where: { id: billing.appointmentId },
          data: { status: "COMPLETED" },
        });

        const queueEntry = await tx.queueEntry.findFirst({
          where: { appointmentId: billing.appointmentId },
        });

        if (queueEntry) {
          await tx.queueEntry.update({
            where: { id: queueEntry.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
        }
      }
    });

    revalidate(clinicSlug, patientId);
    return { success: true };
  } catch (error) {
    console.error("Create installment plan with downpayment error:", error);
    return { error: "Failed to create installment plan." };
  }
}

export async function recordInstallmentPayment(
  clinicSlug: string,
  planId: string,
  data: {
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    currentAppointmentId?: string;
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (data.amount <= 0)
    return { error: "Payment amount must be greater than zero." };
  if (!VALID_PAYMENT_METHODS.includes(data.method))
    return { error: "Invalid payment method." };

  try {
    // 1. Fetch the plan
    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, clinicId: user.clinicId },
      include: { billing: true },
    });
    if (!plan) return { error: "Installment plan not found." };

    const remainingPlanBalance =
      Number(plan.totalAmount) - Number(plan.paidAmount);
    if (data.amount > remainingPlanBalance) {
      return {
        error: `Payment amount (${data.amount}) cannot exceed remaining plan balance (${remainingPlanBalance}).`,
      };
    }

    const newPlanPaid = Number(plan.paidAmount) + data.amount;
    const newPlanStatus =
      newPlanPaid >= Number(plan.totalAmount) ? "COMPLETED" : "ACTIVE";

    // 2. Perform database updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Create the installment payment log
      await tx.installmentPayment.create({
        data: {
          installmentPlanId: planId,
          amount: data.amount,
          method: data.method as PaymentMethod,
          reference: data.reference || null,
          notes: data.notes || null,
        },
      });

      // Update the plan progress
      await tx.installmentPlan.update({
        where: { id: planId },
        data: {
          paidAmount: newPlanPaid,
          status: newPlanStatus as InstallmentStatus,
        },
      });

      // 3. If plan is linked to a billing invoice, adjust billing progress
      if (plan.billing) {
        const newBillingPaid = Number(plan.billing.paidAmount) + data.amount;
        const newBillingStatus =
          newBillingPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";

        // Update billing invoice (without creating duplicate payment details on original invoice record)
        await tx.billing.update({
          where: { id: plan.billing.id },
          data: {
            paidAmount: newBillingPaid,
            status: newBillingStatus,
          },
        });

        // 4. Update linked queue and appointment if fully or partially paid
        if (newBillingStatus === "PARTIALLY_PAID") {
          const queueEntry = await tx.queueEntry.findFirst({
            where: { appointmentId: plan.billing.appointmentId },
          });
          if (queueEntry) {
            await tx.queueEntry.update({
              where: { id: queueEntry.id },
              data: { status: "COMPLETED", completedAt: new Date() },
            });
          }
          await tx.appointment.update({
            where: { id: plan.billing.appointmentId },
            data: { status: "COMPLETED" },
          });
        }
      }

      // 5. If currentAppointmentId is provided (e.g. paying from a different checkout session), complete that queue too
      if (data.currentAppointmentId) {
        const currentQueue = await tx.queueEntry.findFirst({
          where: { appointmentId: data.currentAppointmentId },
        });
        if (currentQueue) {
          await tx.queueEntry.update({
            where: { id: currentQueue.id },
            data: { status: "COMPLETED", completedAt: new Date() },
          });
        }
        await tx.appointment.update({
          where: { id: data.currentAppointmentId },
          data: { status: "COMPLETED" },
        });
      }
    });

    revalidate(clinicSlug, plan.patientId);
    return { success: true };
  } catch (error) {
    console.error("Record installment payment error:", error);
    return { error: "Failed to record installment payment." };
  }
}

export async function cancelInstallmentPlan(
  clinicSlug: string,
  planId: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const plan = await prisma.installmentPlan.findFirst({
      where: { id: planId, clinicId: user.clinicId },
    });
    if (!plan) return { error: "Installment plan not found." };

    await prisma.installmentPlan.update({
      where: { id: planId },
      data: { status: "CANCELLED" },
    });

    revalidate(clinicSlug, plan.patientId);
    return { success: true };
  } catch (error) {
    console.error("Cancel installment plan error:", error);
    return { error: "Failed to cancel installment plan." };
  }
}

export async function recordCombinedPayment(
  clinicSlug: string,
  billingId: string,
  data: {
    totalAmount: number;
    installmentPlanId: string;
    installmentAmount: number;
    method: string;
    reference?: string;
    notes?: string;
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const billingAmount = data.totalAmount - data.installmentAmount;
  if (billingAmount < 0)
    return { error: "Installment amount cannot exceed total payment." };

  try {
    let patientId = "";
    await prisma.$transaction(async (tx) => {
      // Always fetch today's billing and appointment
      const billing = await tx.billing.findFirst({
        where: { id: billingId, clinicId: user.clinicId },
        include: { appointment: true },
      });
      if (!billing) throw new Error("Billing invoice not found");

      patientId = billing.appointment.patientId || "";

      // 1. Process standard billing payment & installment payment for today's invoice
      // 1. Process standard billing payment (for today's new procedures)
      if (billingAmount > 0) {
        const newPaid = Number(billing.paidAmount) + billingAmount;
        const total = Number(billing.totalAmount);
        const status =
          newPaid >= total
            ? "FULLY_PAID"
            : newPaid > 0
              ? "PARTIALLY_PAID"
              : "UNPAID";

        await tx.payment.create({
          data: {
            billingId,
            amount: billingAmount,
            method: data.method as PaymentMethod,
            reference: data.reference || null,
            notes: data.notes || null,
          },
        });

        await tx.billing.update({
          where: { id: billingId },
          data: { paidAmount: newPaid, status },
        });
      }

      // Log today's installment payment under today's checkout billingId (creates separate billing history records in-memory)
      if (data.installmentAmount > 0) {
        await tx.payment.create({
          data: {
            billingId,
            amount: data.installmentAmount,
            method: data.method as PaymentMethod,
            reference: data.reference || null,
            notes: "Installment Payment",
          },
        });
      }

      // 2. Process installment plan balance progress tracking
      if (data.installmentAmount > 0) {
        const plan = await tx.installmentPlan.findFirst({
          where: { id: data.installmentPlanId, clinicId: user.clinicId },
          include: { billing: true },
        });
        if (plan) {
          patientId = plan.patientId;
          const newPlanPaid = Number(plan.paidAmount) + data.installmentAmount;
          const newPlanStatus =
            newPlanPaid >= Number(plan.totalAmount) ? "COMPLETED" : "ACTIVE";

          await tx.installmentPayment.create({
            data: {
              installmentPlanId: data.installmentPlanId,
              amount: data.installmentAmount,
              method: data.method as PaymentMethod,
              reference: data.reference || null,
              notes: data.notes || null,
            },
          });

          await tx.installmentPlan.update({
            where: { id: data.installmentPlanId },
            data: {
              paidAmount: newPlanPaid,
              status: newPlanStatus as InstallmentStatus,
            },
          });

          // Adjust original linked braces invoice totals behind the scenes (WITHOUT logging child payments directly under it)
          if (plan.billing) {
            const newBillingPaid =
              Number(plan.billing.paidAmount) + data.installmentAmount;
            const billingTotal = Number(plan.billing.totalAmount);
            const newBillingStatus =
              newBillingPaid >= billingTotal
                ? "PARTIALLY_PAID"
                : newBillingPaid > 0
                  ? "PARTIALLY_PAID"
                  : "UNPAID";

            await tx.billing.update({
              where: { id: plan.billing.id },
              data: {
                paidAmount: newBillingPaid,
                status: newBillingStatus,
              },
            });
          }
        }
      }

      // Always complete today's queue entry and appointment since today's checkout transaction is done!
      const queueEntry = await tx.queueEntry.findFirst({
        where: { appointmentId: billing.appointmentId },
      });
      if (queueEntry) {
        await tx.queueEntry.update({
          where: { id: queueEntry.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }
      await tx.appointment.update({
        where: { id: billing.appointmentId },
        data: { status: "COMPLETED" },
      });
    });

    if (patientId) {
      revalidate(clinicSlug, patientId);
    }
    return { success: true };
  } catch (error) {
    console.error("Record combined payment error:", error);
    return { error: "Failed to process combined payment." };
  }
}
