import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { CalendarClient } from "@/components/admin/calendar-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Calendar" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CalendarPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const [appointments, blocks, dentists, settings] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        clinicId: user.clinicId,
        preferredDate: { gte: firstOfMonth, lte: lastOfMonth },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        preferredDate: true,
        scheduledDate: true,
        scheduledTime: true,
        status: true,
        serviceType: true,
        patient: { select: { firstName: true, lastName: true } },
        bookingName: true,
        dentist: { select: { name: true } },
      },
    }),
    prisma.calendarBlock.findMany({
      where: { clinicId: user.clinicId, endDate: { gte: firstOfMonth } },
    }),
    prisma.user.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: { id: true, name: true },
    }),
    prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
      select: { operatingHours: true },
    }),
  ]);

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Calendar" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <CalendarClient
          appointments={JSON.parse(JSON.stringify(appointments))}
          blocks={JSON.parse(JSON.stringify(blocks))}
          dentists={dentists}
          operatingHours={settings?.operatingHours || null}
          clinicSlug={slug}
          userRole={user.role}
        />
      </main>
    </>
  );
}
