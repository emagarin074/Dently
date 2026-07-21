"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

const VALID_PAYMENT_METHODS: string[] = Object.values(PaymentMethod);

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

  // Validate amount
  if (amount <= 0)
    return { error: "Payment amount must be greater than zero." };
  if (!VALID_PAYMENT_METHODS.includes(method))
    return { error: "Invalid payment method." };

  try {
    const billing = await prisma.billing.findFirst({
      where: { id: billingId, clinicId: user.clinicId },
    });
    if (!billing) return { error: "Billing not found" };

    const newPaid = Number(billing.paidAmount) + amount;
    const total = Number(billing.totalAmount);

    const status =
      newPaid >= total
        ? "FULLY_PAID"
        : newPaid > 0
          ? "PARTIALLY_PAID"
          : "UNPAID";

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          billingId,
          amount,
          method: method as PaymentMethod,
          reference: reference || null,
          notes: notes || null,
        },
      }),
      prisma.billing.update({
        where: { id: billingId },
        data: { paidAmount: newPaid, status },
      }),
    ]);

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

    revalidatePath(`/clinic/${clinicSlug}/admin/bookings`);
    revalidatePath(`/clinic/${clinicSlug}/admin/billing`);
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

  if (totalAmount < 0) return { error: "Total amount cannot be negative." };

  try {
    // Verify the appointment belongs to this clinic
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId, clinicId: user.clinicId },
    });
    if (!appointment) return { error: "Appointment not found." };

    await prisma.billing.upsert({
      where: { appointmentId },
      update: { totalAmount },
      create: { clinicId: user.clinicId, appointmentId, totalAmount },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/billing`);
    return { success: true };
  } catch (error) {
    console.error("Create billing error:", error);
    return { error: "Failed to create billing record." };
  }
}
