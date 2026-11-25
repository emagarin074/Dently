"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";
import { generateCompensationLedgersForBilling } from "@/lib/compensation/ledger";
import { z } from "zod";

const recordPaymentSchema = z.object({
  billingId: z.string().min(1, "Billing ID is required"),
  amount: z
    .number()
    .positive("Payment amount must be greater than zero.")
    .finite("Payment amount must be a finite number."),
  method: z.nativeEnum(PaymentMethod, { message: "Invalid payment method." }),
  reference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

const createBillingSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  totalAmount: z
    .number()
    .min(0, "Total amount cannot be negative.")
    .finite("Total amount must be a finite number."),
});

export async function recordPayment(
  clinicSlug: string,
  billingId: string,
  amount: number,
  method: string,
  reference?: string,
  notes?: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = recordPaymentSchema.safeParse({
    billingId,
    amount,
    method,
    reference,
    notes,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    billingId: validBillingId,
    amount: validAmount,
    method: validMethod,
    reference: validRef,
    notes: validNotes,
  } = parsed.data;

  try {
    const billing = await prisma.billing.findFirst({
      where: { id: validBillingId, clinicId: user.clinicId },
    });
    if (!billing) return { error: "Billing not found" };

    const newPaid = Number(billing.paidAmount) + validAmount;
    const total = Number(billing.totalAmount);

    const status =
      newPaid >= total
        ? "FULLY_PAID"
        : newPaid > 0
          ? "PARTIALLY_PAID"
          : "UNPAID";

    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          billingId: validBillingId,
          amount: validAmount,
          method: validMethod,
          reference: validRef || null,
          notes: validNotes || null,
        },
      });

      await tx.billing.update({
        where: { id: billingId },
        data: { paidAmount: newPaid, status },
      });

      await tx.appointmentProcedure.updateMany({
        where: { appointmentId: billing.appointmentId },
        data: { paymentStatus: status },
      });
    });

    if (status === "FULLY_PAID" || status === "PARTIALLY_PAID") {
      const queueEntry = await prisma.queueEntry.findFirst({
        where: { appointmentId: billing.appointmentId },
      });
      if (queueEntry) {
        await prisma.queueEntry.update({
          where: { id: queueEntry.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      }
      await prisma.appointment.update({
        where: { id: billing.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    await generateCompensationLedgersForBilling(billingId, {
      createdBy: user.name,
    });

    const appt = await prisma.appointment.findUnique({
      where: { id: billing.appointmentId },
      select: { patientId: true },
    });
    if (appt?.patientId) {
      revalidatePath(`/clinic/${clinicSlug}/admin/patients/${appt.patientId}`);
    }

    revalidatePath(`/clinic/${clinicSlug}/admin/bookings`);
    revalidatePath(`/clinic/${clinicSlug}/admin/billing`);
    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    return { success: true };
  } catch (error) {
    console.error("Record payment error:", error);
    return { error: "Failed to record payment." };
  }
}

export async function createBilling(
  clinicSlug: string,
  appointmentId: string,
  totalAmount: number,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = createBillingSchema.safeParse({ appointmentId, totalAmount });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { appointmentId: validApptId, totalAmount: validTotal } = parsed.data;

  try {
    // Verify the appointment belongs to this clinic
    const appointment = await prisma.appointment.findUnique({
      where: { id: validApptId, clinicId: user.clinicId },
    });
    if (!appointment) return { error: "Appointment not found." };

    await prisma.billing.upsert({
      where: { appointmentId: validApptId },
      update: { totalAmount: validTotal },
      create: {
        clinicId: user.clinicId,
        appointmentId: validApptId,
        totalAmount: validTotal,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/billing`);
    return { success: true };
  } catch (error) {
    console.error("Create billing error:", error);
    return { error: "Failed to create billing record." };
  }
}
