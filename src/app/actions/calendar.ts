"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { BlockType } from "@prisma/client";
import { getOpenDays, getDayName } from "@/lib/operating-days";

const VALID_BLOCK_TYPES: string[] = Object.values(BlockType);

export interface ConflictingAppointment {
  id: string;
  preferredDate: string;
  bookingName: string | null;
  patientName: string | null;
  status: string;
  dayName: string;
}

export async function updateOperatingDays(
  clinicSlug: string,
  newOpenDays: number[],
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });

    const currentOpenDays = getOpenDays(settings?.operatingHours);
    const closedDays = currentOpenDays.filter(
      (day) => !newOpenDays.includes(day),
    );

    if (closedDays.length > 0) {
      // Find future active appointments
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const futureAppointments = await prisma.appointment.findMany({
        where: {
          clinicId: user.clinicId,
          preferredDate: { gte: startOfToday },
          status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
        },
        select: {
          id: true,
          preferredDate: true,
          bookingName: true,
          status: true,
          patient: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      const conflicts: ConflictingAppointment[] = [];

      for (const appt of futureAppointments) {
        const apptDate = new Date(appt.preferredDate);
        const dayOfWeek = apptDate.getDay();

        if (closedDays.includes(dayOfWeek)) {
          const patientName = appt.patient
            ? `${appt.patient.firstName} ${appt.patient.lastName}`
            : appt.bookingName || "Patient";

          conflicts.push({
            id: appt.id,
            preferredDate: apptDate.toISOString(),
            bookingName: appt.bookingName,
            patientName,
            status: appt.status,
            dayName: getDayName(dayOfWeek),
          });
        }
      }

      if (conflicts.length > 0) {
        const closedNames = closedDays.map(getDayName).join(", ");
        return {
          error: `Cannot close ${closedNames}. There are ${conflicts.length} active appointment(s) scheduled on future ${closedNames}(s). Please cancel or reschedule them first.`,
          conflicts,
        };
      }
    }

    // Save operating hours
    await prisma.clinicSettings.upsert({
      where: { clinicId: user.clinicId },
      update: {
        operatingHours: { openDays: newOpenDays },
      },
      create: {
        clinicId: user.clinicId,
        operatingHours: { openDays: newOpenDays },
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/calendar`);
    revalidatePath(`/clinic/${clinicSlug}/admin/settings`);
    revalidatePath(`/clinic/${clinicSlug}`);

    return { success: true };
  } catch (error) {
    console.error("Update operating days error:", error);
    return { error: "Failed to update operating days." };
  }
}

export async function createCalendarBlock(
  clinicSlug: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const type = (formData.get("type") as string) || "CLINIC_CLOSED";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!title) return { error: "Title is required" };
  if (!startDate || !endDate)
    return { error: "Start and end dates are required" };

  const startD = new Date(startDate + "T00:00:00.000Z");
  const endD = new Date(endDate + "T23:59:59.999Z");

  if (startD > endD)
    return { error: "Start date must be before or equal to end date" };

  // Prevent blocking past dates
  const todayStr = new Date().toISOString().split("T")[0];
  if (startDate < todayStr) return { error: "Cannot block dates in the past" };

  if (!VALID_BLOCK_TYPES.includes(type))
    return { error: "Invalid block type." };

  try {
    // Check clinic operating days
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    const openDays = getOpenDays(settings?.operatingHours);

    // Ensure range contains only regularly OPEN days using UTC iteration
    const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
    const [eYear, eMonth, eDay] = endDate.split("-").map(Number);
    const current = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const endCheck = new Date(Date.UTC(eYear, eMonth - 1, eDay));

    while (current <= endCheck) {
      const dayOfWeek = current.getUTCDay();
      if (!openDays.includes(dayOfWeek)) {
        const dayName = getDayName(dayOfWeek);
        const dateStr = current.toISOString().split("T")[0];
        return {
          error: `Cannot block date ${dateStr} because the clinic is already regularly closed on ${dayName}s. Adjust Operating Days if you wish to open and block this day.`,
        };
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Check for overlaps
    const overlapping = await prisma.calendarBlock.findFirst({
      where: {
        clinicId: user.clinicId,
        startDate: { lte: endD },
        endDate: { gte: startD },
      },
    });

    if (overlapping)
      return { error: "These dates overlap with an existing block." };

    // Check for existing appointments
    const existingAppointments = await prisma.appointment.findFirst({
      where: {
        clinicId: user.clinicId,
        preferredDate: {
          gte: startD,
          lte: endD,
        },
        status: { not: "CANCELLED" },
      },
    });

    if (existingAppointments)
      return {
        error:
          "Cannot block dates with existing appointments. Please cancel or reschedule them first.",
      };

    await prisma.calendarBlock.create({
      data: {
        clinicId: user.clinicId,
        title,
        type: type as BlockType,
        startDate: startD,
        endDate: endD,
        dentistId: (formData.get("dentistId") as string) || null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Create calendar block error:", error);
    return { error: "Failed to create calendar block." };
  }
}

export async function deleteCalendarBlock(clinicSlug: string, blockId: string) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.calendarBlock.delete({
      where: { id: blockId, clinicId: user.clinicId },
    });
    revalidatePath(`/clinic/${clinicSlug}/admin/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Delete calendar block error:", error);
    return { error: "Failed to delete calendar block." };
  }
}

export async function updateCalendarBlock(
  clinicSlug: string,
  blockId: string,
  formData: FormData,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const title = formData.get("title") as string;
  const type = (formData.get("type") as string) || "CLINIC_CLOSED";
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!title) return { error: "Title is required" };
  if (!startDate || !endDate)
    return { error: "Start and end dates are required" };

  const startD = new Date(startDate + "T00:00:00.000Z");
  const endD = new Date(endDate + "T23:59:59.999Z");

  if (startD > endD)
    return { error: "Start date must be before or equal to end date" };

  // Prevent blocking past dates
  const todayStr = new Date().toISOString().split("T")[0];
  if (startDate < todayStr) return { error: "Cannot block dates in the past" };

  if (!VALID_BLOCK_TYPES.includes(type))
    return { error: "Invalid block type." };

  try {
    // Check clinic operating days
    const settings = await prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
    });
    const openDays = getOpenDays(settings?.operatingHours);

    // Ensure range contains only regularly OPEN days using UTC iteration
    const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
    const [eYear, eMonth, eDay] = endDate.split("-").map(Number);
    const current = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const endCheck = new Date(Date.UTC(eYear, eMonth - 1, eDay));

    while (current <= endCheck) {
      const dayOfWeek = current.getUTCDay();
      if (!openDays.includes(dayOfWeek)) {
        const dayName = getDayName(dayOfWeek);
        const dateStr = current.toISOString().split("T")[0];
        return {
          error: `Cannot block date ${dateStr} because the clinic is already regularly closed on ${dayName}s. Adjust Operating Days if you wish to open and block this day.`,
        };
      }
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // Check for overlaps, excluding the current block
    const overlapping = await prisma.calendarBlock.findFirst({
      where: {
        clinicId: user.clinicId,
        id: { not: blockId },
        startDate: { lte: endD },
        endDate: { gte: startD },
      },
    });

    if (overlapping)
      return { error: "These dates overlap with an existing block." };

    // Check for existing appointments
    const existingAppointments = await prisma.appointment.findFirst({
      where: {
        clinicId: user.clinicId,
        preferredDate: {
          gte: startD,
          lte: endD,
        },
        status: { not: "CANCELLED" },
      },
    });

    if (existingAppointments)
      return {
        error:
          "Cannot block dates with existing appointments. Please cancel or reschedule them first.",
      };

    await prisma.calendarBlock.update({
      where: { id: blockId, clinicId: user.clinicId },
      data: {
        title,
        type: type as BlockType,
        startDate: startD,
        endDate: endD,
        dentistId: (formData.get("dentistId") as string) || null,
        notes: (formData.get("notes") as string) || null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Update calendar block error:", error);
    return { error: "Failed to update calendar block." };
  }
}
