"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { QueueStatus } from "@prisma/client";

function revalidate(slug: string) {
  revalidatePath(`/clinic/${slug}/admin/bookings`);
  revalidatePath(`/clinic/${slug}/admin`);
}

const VALID_QUEUE_STATUSES: string[] = Object.values(QueueStatus);

export async function updateQueueStatus(
  clinicSlug: string,
  entryId: string,
  status: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (!VALID_QUEUE_STATUSES.includes(status))
    return { error: "Invalid queue status." };

  try {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId, clinicId: user.clinicId },
    });
    if (!entry) return { error: "Queue entry not found" };

    const updateData: Record<string, unknown> = { status };
    if (status === "IN_CONSULTATION") updateData.calledAt = new Date();
    if (status === "COMPLETED") updateData.completedAt = new Date();

    await prisma.queueEntry.update({
      where: { id: entryId },
      data: updateData as never,
    });

    // When queue completes, mark the linked appointment as COMPLETED
    if (status === "COMPLETED" && entry.appointmentId) {
      await prisma.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    revalidate(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Update queue status error:", error);
    return { error: "Failed to update queue status." };
  }
}

export async function markQueueNoShow(clinicSlug: string, entryId: string) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId, clinicId: user.clinicId },
    });
    if (!entry) return { error: "Queue entry not found" };

    await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: "CANCELLED" },
    });

    if (entry.appointmentId) {
      await prisma.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: "NO_SHOW" },
      });
    }

    revalidate(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Mark queue no-show error:", error);
    return { error: "Failed to mark as no-show." };
  }
}

export async function removeFromQueue(clinicSlug: string, entryId: string) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.queueEntry.delete({
      where: { id: entryId, clinicId: user.clinicId },
    });
    revalidate(clinicSlug);
    return { success: true };
  } catch (error) {
    console.error("Remove from queue error:", error);
    return { error: "Failed to remove from queue." };
  }
}

export async function advanceQueueToPayment(
  clinicSlug: string,
  appointmentId: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const entry = await prisma.queueEntry.findFirst({
      where: { appointmentId, clinicId: user.clinicId },
    });
    if (!entry) return { error: "Queue entry not found" };

    await prisma.queueEntry.update({
      where: { id: entry.id },
      data: { status: "FOR_PAYMENT" },
    });

    let billing = await prisma.billing.findUnique({
      where: { appointmentId },
    });

    if (!billing) {
      const procedures = await prisma.appointmentProcedure.findMany({
        where: { appointmentId },
      });
      const totalAmount = procedures.reduce(
        (acc, curr) => acc + Number(curr.price || 0),
        0,
      );

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      const patientId = appointment?.patientId;

      const activePlan = patientId
        ? await prisma.installmentPlan.findFirst({
            where: { patientId, status: "ACTIVE", clinicId: user.clinicId },
          })
        : null;

      if (activePlan && totalAmount > 0) {
        const newPlanTotal = Number(activePlan.totalAmount) + totalAmount;
        const chargeLog = `\n[Charged ₱${totalAmount.toLocaleString()} for additional procedures on ${new Date().toLocaleDateString()}]`;
        const newNotes = activePlan.notes
          ? activePlan.notes + chargeLog
          : chargeLog.trim();

        await prisma.$transaction([
          prisma.installmentPlan.update({
            where: { id: activePlan.id },
            data: {
              totalAmount: newPlanTotal,
              notes: newNotes,
            },
          }),
          prisma.billing.create({
            data: {
              clinicId: user.clinicId,
              appointmentId,
              totalAmount,
              paidAmount: totalAmount,
              status: "FULLY_PAID",
              payments: {
                create: {
                  amount: totalAmount,
                  method: "OTHER",
                  notes: `Charged to Installment Plan`,
                },
              },
            },
          }),
        ]);

        billing = await prisma.billing.findUnique({
          where: { appointmentId },
        });
      } else {
        billing = await prisma.billing.create({
          data: {
            clinicId: user.clinicId,
            appointmentId,
            totalAmount,
            paidAmount: 0,
            status: totalAmount === 0 ? "FULLY_PAID" : "UNPAID",
          },
        });
      }
    }

    if (!billing) {
      return { error: "Failed to create or load billing invoice." };
    }

    revalidate(clinicSlug);
    return { success: true, billingId: billing.id };
  } catch (error) {
    console.error("Advance queue to payment error:", error);
    return { error: "Failed to advance queue status." };
  }
}
