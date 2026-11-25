"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { PaymentMethod, InstallmentStatus } from "@prisma/client";
import { z } from "zod";
import {
  sendClinicEmail,
  installmentReminderEmail,
  installmentOverdueEmail,
  installmentReceiptEmail,
} from "@/lib/email";
import { generateCompensationLedgersForBilling } from "@/lib/compensation/ledger";

const createPlanSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  billingId: z.string().min(1, "Billing ID is required"),
  totalAmount: z
    .number()
    .positive("Total amount must be greater than zero.")
    .finite(),
  downpayment: z.number().min(0, "Downpayment cannot be negative.").finite(),
  method: z.nativeEnum(PaymentMethod, { message: "Invalid payment method." }),
  reference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
});

const recordPaymentSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  amount: z
    .number()
    .positive("Payment amount must be greater than zero.")
    .finite(),
  method: z.nativeEnum(PaymentMethod, { message: "Invalid payment method." }),
  reference: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
  currentAppointmentId: z.string().optional(),
});

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
    scheduleItems?: { dueDate: string; amount: number }[];
    agreementDocument?: {
      base64: string;
      mimeType: string;
      fileName: string;
      fileSize: number;
    };
  },
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const parsed = createPlanSchema.safeParse({
    patientId,
    billingId: data.billingId,
    totalAmount: data.totalAmount,
    downpayment: data.downpayment,
    method: data.method,
    reference: data.reference,
    notes: data.notes,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (data.downpayment > data.totalAmount)
    return { error: "Downpayment cannot exceed the total treatment amount." };

  try {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: user.clinicId },
    });
    if (!patient) return { error: "Patient not found." };

    // Verify billing belongs to this clinic
    const billing = await prisma.billing.findFirst({
      where: { id: data.billingId, clinicId: user.clinicId },
    });
    if (!billing) return { error: "Billing invoice not found in this clinic." };

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

      // 2. Record the downpayment as the first installment entry if > 0
      if (data.downpayment > 0) {
        await tx.installmentPayment.create({
          data: {
            installmentPlanId: plan.id,
            amount: data.downpayment,
            method: data.method as PaymentMethod,
            reference: data.reference || null,
            notes: "Downpayment",
          },
        });
      }

      // 3. Create schedule items if provided for the remaining balance (all start as PENDING)
      if (data.scheduleItems && data.scheduleItems.length > 0) {
        for (let i = 0; i < data.scheduleItems.length; i++) {
          const item = data.scheduleItems[i];
          await tx.installmentScheduleItem.create({
            data: {
              installmentPlanId: plan.id,
              installmentNumber: i + 1,
              dueDate: new Date(item.dueDate),
              amount: item.amount,
              status: "PENDING",
            },
          });
        }
      }

      // 4. Record downpayment on billing invoice if > 0
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

      if (billingForUpdate) {
        await tx.appointmentProcedure.updateMany({
          where: { appointmentId: billingForUpdate.appointmentId },
          data: { paymentStatus: newBillingStatus },
        });
      }

      // 5. Record standard Payment entry on the billing if downpayment > 0
      if (data.downpayment > 0) {
        await tx.payment.create({
          data: {
            billingId: data.billingId,
            amount: data.downpayment,
            method: data.method as PaymentMethod,
            reference: data.reference || null,
            notes: "Downpayment",
          },
        });
      }

      // Save Installment Agreement contract document photo if provided
      if (data.agreementDocument) {
        await tx.patientDocument.create({
          data: {
            patientId,
            clinicId: user.clinicId,
            type: "INSTALLMENT_AGREEMENT",
            title: `Installment Agreement - ${data.agreementDocument.fileName}`,
            content: data.agreementDocument.base64,
            mimeType: data.agreementDocument.mimeType,
            fileSize: data.agreementDocument.fileSize,
          },
        });
      }

      // 6. Update the Appointment and QueueEntry status to COMPLETED
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

    await generateCompensationLedgersForBilling(data.billingId, {
      createdBy: user.name,
    });

    revalidate(clinicSlug, patientId);
    return { success: true };
  } catch (error) {
    console.error("Create installment plan with downpayment error:", error);
    return {
      error:
        "Failed to create installment plan. Please check inputs and try again.",
    };
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

  const parsed = recordPaymentSchema.safeParse({
    planId,
    amount: data.amount,
    method: data.method,
    reference: data.reference,
    notes: data.notes,
    currentAppointmentId: data.currentAppointmentId,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

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

      // 3. Process payment against schedule items chronologically
      const pendingItems = await tx.installmentScheduleItem.findMany({
        where: { installmentPlanId: planId, status: "PENDING" },
        orderBy: { installmentNumber: "asc" },
      });

      const remainingPlanBalance = Number(plan.totalAmount) - newPlanPaid;

      if (remainingPlanBalance <= 0) {
        // Plan fully paid — delete remaining pending items
        await tx.installmentScheduleItem.deleteMany({
          where: { installmentPlanId: planId, status: "PENDING" },
        });
      } else if (pendingItems.length > 0) {
        let unallocatedPayment = data.amount;
        let lastItemDate = new Date(pendingItems[0].dueDate);
        let lastItemNumber = pendingItems[0].installmentNumber;

        for (const item of pendingItems) {
          lastItemDate = new Date(item.dueDate);
          lastItemNumber = item.installmentNumber;

          if (unallocatedPayment <= 0) {
            break;
          }

          const currentItemAmount = Number(item.amount);

          if (unallocatedPayment >= currentItemAmount) {
            // Payment fully covers this schedule item! Mark as PAID.
            await tx.installmentScheduleItem.update({
              where: { id: item.id },
              data: {
                status: "PAID",
                paidAt: new Date(),
              },
            });
            unallocatedPayment = Number(
              (unallocatedPayment - currentItemAmount).toFixed(2),
            );
          } else {
            // Payment partially covers this item! Reduce remaining amount.
            const newAmount = Number(
              (currentItemAmount - unallocatedPayment).toFixed(2),
            );
            await tx.installmentScheduleItem.update({
              where: { id: item.id },
              data: {
                amount: newAmount,
              },
            });
            unallocatedPayment = 0;
          }
        }

        // If all existing pending items were paid off, but remaining plan balance > 0:
        const remainingUnpaidItems = await tx.installmentScheduleItem.findMany({
          where: { installmentPlanId: planId, status: "PENDING" },
        });

        if (remainingUnpaidItems.length === 0 && remainingPlanBalance > 0) {
          const nextDueDate = new Date(lastItemDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);

          await tx.installmentScheduleItem.create({
            data: {
              installmentPlanId: planId,
              installmentNumber: lastItemNumber + 1,
              dueDate: nextDueDate,
              amount: Number(remainingPlanBalance.toFixed(2)),
              status: "PENDING",
            },
          });
        }
      }

      // 3. If plan is linked to a billing invoice, adjust billing progress
      if (plan.billing) {
        const newBillingPaid = Number(plan.billing.paidAmount) + data.amount;
        const newBillingStatus =
          newBillingPaid >= Number(plan.billing.totalAmount)
            ? "FULLY_PAID"
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

        await tx.appointmentProcedure.updateMany({
          where: { appointmentId: plan.billing.appointmentId },
          data: { paymentStatus: newBillingStatus },
        });
      }

      // 4. If currentAppointmentId is provided, verify clinic ownership and complete queue entry and appointment
      if (data.currentAppointmentId) {
        const currentAppt = await tx.appointment.findFirst({
          where: { id: data.currentAppointmentId, clinicId: user.clinicId },
        });
        if (currentAppt) {
          const currentQueue = await tx.queueEntry.findFirst({
            where: {
              appointmentId: data.currentAppointmentId,
              clinicId: user.clinicId,
            },
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
      }
    });

    if (plan.billingId) {
      await generateCompensationLedgersForBilling(plan.billingId, {
        createdBy: user.name,
      });
    }

    // Send receipt email
    const fullPlan = await prisma.installmentPlan.findUnique({
      where: { id: planId },
      include: {
        patient: { select: { firstName: true, lastName: true, email: true } },
        clinic: { include: { settings: true } },
      },
    });

    if (fullPlan?.patient.email && fullPlan.clinic) {
      const patientName = `${fullPlan.patient.firstName} ${fullPlan.patient.lastName}`;
      const clinicName = fullPlan.clinic.name;
      const remainingBalance = `$${(
        Number(fullPlan.totalAmount) - Number(fullPlan.paidAmount)
      ).toFixed(2)}`;

      await sendClinicEmail({
        to: fullPlan.patient.email,
        subject: `Installment Payment Received – ${clinicName}`,
        html: installmentReceiptEmail({
          clinicName,
          patientName,
          installmentNumber: 1,
          amountPaid: `$${data.amount.toFixed(2)}`,
          paymentMethod: data.method,
          remainingBalance,
        }),
        clinicSettings: fullPlan.clinic.settings,
        clinicName,
      });
    }

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

        await tx.appointmentProcedure.updateMany({
          where: { appointmentId: billing.appointmentId },
          data: { paymentStatus: status },
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

            await tx.appointmentProcedure.updateMany({
              where: { appointmentId: plan.billing.appointmentId },
              data: { paymentStatus: newBillingStatus },
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

    await generateCompensationLedgersForBilling(billingId, {
      createdBy: user.name,
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

export async function sendInstallmentReminder(
  clinicSlug: string,
  scheduleItemId: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const item = await prisma.installmentScheduleItem.findUnique({
      where: { id: scheduleItemId },
      include: {
        installmentPlan: {
          include: {
            patient: {
              select: { firstName: true, lastName: true, email: true },
            },
            clinic: { include: { settings: true } },
          },
        },
      },
    });

    if (!item || item.installmentPlan.clinicId !== user.clinicId) {
      return { error: "Installment schedule item not found." };
    }

    if (item.status === "PAID") {
      return { error: "This installment item is already paid." };
    }

    const patientEmail = item.installmentPlan.patient.email;
    if (!patientEmail) {
      return { error: "Patient does not have an email address on file." };
    }

    const patientName = `${item.installmentPlan.patient.firstName} ${item.installmentPlan.patient.lastName}`;
    const clinicName = item.installmentPlan.clinic.name;
    const clinicSettings = item.installmentPlan.clinic.settings;
    const isOverdue = new Date(item.dueDate) < new Date();

    const formattedDate = new Date(item.dueDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedAmount = `$${Number(item.amount).toFixed(2)}`;
    const remainingPlanBalance = `$${(
      Number(item.installmentPlan.totalAmount) -
      Number(item.installmentPlan.paidAmount)
    ).toFixed(2)}`;

    const emailHtml = isOverdue
      ? installmentOverdueEmail({
          clinicName,
          patientName,
          installmentNumber: item.installmentNumber,
          dueDate: formattedDate,
          amount: formattedAmount,
        })
      : installmentReminderEmail({
          clinicName,
          patientName,
          installmentNumber: item.installmentNumber,
          dueDate: formattedDate,
          amount: formattedAmount,
          remainingBalance: remainingPlanBalance,
        });

    const subject = isOverdue
      ? `Payment Overdue Notice – ${clinicName}`
      : `Upcoming Payment Reminder – ${clinicName}`;

    const sendRes = await sendClinicEmail({
      to: patientEmail,
      subject,
      html: emailHtml,
      clinicSettings,
      clinicName,
    });

    if (!sendRes.success) {
      return {
        error:
          sendRes.error ||
          "Failed to send email reminder. Please check your clinic SMTP settings.",
      };
    }

    await prisma.installmentScheduleItem.update({
      where: { id: scheduleItemId },
      data: { reminderSent: true },
    });

    revalidate(clinicSlug, item.installmentPlan.patientId);
    return { success: true };
  } catch (error) {
    console.error("Send installment reminder error:", error);
    return { error: "Failed to send installment reminder email." };
  }
}

export async function adjustInstallmentScheduleDate(
  clinicSlug: string,
  scheduleItemId: string,
  newDueDateStr: string,
  shiftSubsequentDates: boolean = true,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const targetDate = new Date(newDueDateStr);
  if (isNaN(targetDate.getTime())) {
    return { error: "Invalid date format." };
  }

  try {
    const item = await prisma.installmentScheduleItem.findUnique({
      where: { id: scheduleItemId },
      include: { installmentPlan: true },
    });

    if (!item) return { error: "Schedule item not found." };
    if (item.installmentPlan.clinicId !== user.clinicId) {
      return { error: "Unauthorized." };
    }

    const planId = item.installmentPlanId;

    await prisma.$transaction(async (tx) => {
      // Update target item's due date
      await tx.installmentScheduleItem.update({
        where: { id: scheduleItemId },
        data: {
          dueDate: targetDate,
        },
      });

      if (shiftSubsequentDates) {
        // Fetch all subsequent pending schedule items
        const subsequentItems = await tx.installmentScheduleItem.findMany({
          where: {
            installmentPlanId: planId,
            status: "PENDING",
            installmentNumber: { gt: item.installmentNumber },
          },
          orderBy: { installmentNumber: "asc" },
        });

        // Shift subsequent items by 1 month starting from targetDate
        let currentDate = new Date(targetDate);
        for (const subItem of subsequentItems) {
          currentDate = new Date(currentDate);
          currentDate.setMonth(currentDate.getMonth() + 1);
          await tx.installmentScheduleItem.update({
            where: { id: subItem.id },
            data: { dueDate: currentDate },
          });
        }
      }
    });

    revalidate(clinicSlug, item.installmentPlan.patientId);
    return { success: true };
  } catch (error) {
    console.error("Adjust installment schedule date error:", error);
    return { error: "Failed to adjust installment schedule date." };
  }
}
