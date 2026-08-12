import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { BookingsClient } from "@/components/admin/bookings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Appointments" };

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
}

export default async function BookingsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab, page } = await searchParams;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const take = 20;
  const skip = (parseInt(page || "1") - 1) * take;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const procedureSelect = {
    id: true,
    name: true,
    category: true,
    priceType: true,
    price: true,
    priceMin: true,
    priceMax: true,
    hasOdontogram: true,
    hasToothSurface: true,
    hasUpperLower: true,
    hasMaterial: true,
    hasShade: true,
    hasSeverity: true,
    hasRemarks: true,
    requireSignedConsent: true,
    consentTemplate: { select: { content: true, name: true } },
    priceRules: true,
  };

  const [
    requests,
    requestsTotal,
    todaySchedule,
    todayQueue,
    procedures,
    dentists,
    patients,
    blockedDates,
  ] = await Promise.all([
    // Tab 1 – pending booking requests (all future)
    prisma.appointment.findMany({
      where: { clinicId: user.clinicId, status: "PENDING" },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
        dentist: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),

    prisma.appointment.count({
      where: { clinicId: user.clinicId, status: "PENDING" },
    }),

    // Tab 2 – today's schedule (CONFIRMED or CHECKED_IN for today)
    prisma.appointment.findMany({
      where: {
        clinicId: user.clinicId,
        status: { in: ["CONFIRMED", "CHECKED_IN"] as never[] },
        preferredDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        dentist: { select: { id: true, name: true } },
        queueEntry: { select: { id: true, queueNumber: true, status: true } },
      },
      orderBy: [{ scheduledTime: "asc" }, { preferredDate: "asc" }],
    }),

    // Tab 3 – today's queue (all statuses, for kanban)
    prisma.queueEntry.findMany({
      where: { clinicId: user.clinicId, date: { gte: today, lt: tomorrow } },
      include: {
        appointment: {
          include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            dentist: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { queueNumber: "asc" },
    }),

    prisma.procedure.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: procedureSelect,
    }),

    prisma.user.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: { id: true, name: true },
    }),

    prisma.patient.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: { id: true, firstName: true, lastName: true, phone: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),

    // Blocked dates — for client-side validation in admin booking dialog
    prisma.calendarBlock.findMany({
      where: { clinicId: user.clinicId, endDate: { gte: today } },
      select: { startDate: true, endDate: true, title: true },
    }),
  ]);

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Appointments"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6">
        <BookingsClient
          requests={JSON.parse(JSON.stringify(requests))}
          requestsTotal={requestsTotal}
          page={parseInt(page || "1")}
          todaySchedule={JSON.parse(JSON.stringify(todaySchedule))}
          todayQueue={JSON.parse(JSON.stringify(todayQueue))}
          procedures={JSON.parse(JSON.stringify(procedures))}
          dentists={dentists}
          patients={JSON.parse(JSON.stringify(patients))}
          clinicSlug={slug}
          userRole={user.role}
          defaultTab={tab ?? "requests"}
          blockedDates={blockedDates.map((b) => ({
            startDate: b.startDate.toISOString().split("T")[0],
            endDate: b.endDate.toISOString().split("T")[0],
            title: b.title,
          }))}
        />
      </main>
    </>
  );
}
