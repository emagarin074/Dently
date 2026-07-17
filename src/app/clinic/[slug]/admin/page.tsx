import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Calendar,
  Users,
  CreditCard,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    apptStats,
    queueStats,
    todayAppointments,
    todayQueue,
    todayPayments,
    monthPayments,
    recentPatients,
    followUpsDue,
    patientsCount,
  ] = await Promise.all([
    // Appointment status counts (today)
    prisma.appointment.groupBy({
      by: ["status"],
      where: {
        clinicId: user.clinicId,
        preferredDate: { gte: today, lt: tomorrow },
      },
      _count: true,
    }),

    // Queue status counts (today)
    prisma.queueEntry.groupBy({
      by: ["status"],
      where: { clinicId: user.clinicId, date: { gte: today, lt: tomorrow } },
      _count: true,
    }),

    // Today's appointments list
    prisma.appointment.findMany({
      where: {
        clinicId: user.clinicId,
        preferredDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: { select: { firstName: true, lastName: true } },
        queueEntry: { select: { queueNumber: true, status: true } },
      },
      orderBy: [{ scheduledTime: "asc" }, { createdAt: "asc" }],
      take: 8,
    }),

    // Today's active queue
    prisma.queueEntry.findMany({
      where: {
        clinicId: user.clinicId,
        date: { gte: today, lt: tomorrow },
        status: { notIn: ["COMPLETED", "CANCELLED"] as never[] },
      },
      orderBy: { queueNumber: "asc" },
      take: 8,
    }),

    prisma.payment.findMany({
      where: {
        billing: { clinicId: user.clinicId },
        paidAt: { gte: today, lt: tomorrow },
      },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: {
        billing: { clinicId: user.clinicId },
        paidAt: { gte: firstOfMonth },
      },
      select: { amount: true },
    }),
    prisma.patient.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        phone: true,
      },
    }),
    prisma.followUp.count({
      where: {
        clinicId: user.clinicId,
        status: "PENDING",
        followUpDate: { lte: tomorrow },
      },
    }),
    prisma.patient.count({
      where: { clinicId: user.clinicId, isActive: true },
    }),
  ]);

  const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount), 0);
  const monthRevenue = monthPayments.reduce((s, p) => s + Number(p.amount), 0);

  function apptCount(status: string) {
    return apptStats.find((s) => s.status === status)?._count ?? 0;
  }
  function queueCount(status: string) {
    return queueStats.find((s) => s.status === status)?._count ?? 0;
  }

  const APPT_STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200/50",
    CONFIRMED: "bg-blue-50 text-blue-700 border border-blue-200/50",
    CHECKED_IN: "bg-indigo-50 text-indigo-700 border border-indigo-200/50",
    COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
    CANCELLED: "bg-rose-50 text-rose-700 border border-rose-200/50",
    NO_SHOW: "bg-slate-100 text-slate-700 border border-slate-200/50",
  };

  const QUEUE_STATUS_COLOR: Record<string, string> = {
    WAITING: "bg-amber-50 text-amber-700 border border-amber-200/50",
    IN_CONSULTATION: "bg-blue-50 text-blue-700 border border-blue-200/50",
    IN_TREATMENT: "bg-purple-50 text-purple-700 border border-purple-200/50",
    FOR_PAYMENT: "bg-orange-50 text-orange-700 border border-orange-200/50",
    COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  };

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Dashboard" userName={user.name} />
      <main className="flex-1 p-4 lg:p-8 space-y-8 bg-slate-50/50">
        {/* Revenue / KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2.5 space-y-0 pl-5 pr-4 pt-4">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Daily Revenue
              </CardTitle>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <CreditCard className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-5 pb-4">
              <div className="text-xl font-black text-slate-900">
                {formatCurrency(todayRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2.5 space-y-0 pl-5 pr-4 pt-4">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Monthly Revenue
              </CardTitle>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <TrendingUp className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-5 pb-4">
              <div className="text-xl font-black text-slate-900">
                {formatCurrency(monthRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2.5 space-y-0 pl-5 pr-4 pt-4">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Total Patients
              </CardTitle>
              <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-5 pb-4">
              <div className="text-xl font-black text-slate-900">
                {patientsCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <CardHeader className="flex flex-row items-center justify-between pb-2.5 space-y-0 pl-5 pr-4 pt-4">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Follow-ups Due
              </CardTitle>
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-105 transition-transform duration-200">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pl-5 pb-4">
              <div className="text-xl font-black text-rose-600">
                {followUpsDue}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consolidate layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments card */}
            <Card className="border-slate-200/60 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Today&apos;s Appointments
                  </CardTitle>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Daily consultations and clinic visit schedule
                  </p>
                </div>
                <Link
                  href={`/clinic/${slug}/admin/bookings?tab=today`}
                  className="text-xs text-primary font-bold hover:underline transition-all"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Horizontal stats summary bar */}
                <div className="flex flex-wrap gap-1.5 pb-4 border-b border-slate-100 mb-4 select-none">
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    Total: {todayAppointments.length}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100/50 px-2.5 py-1 rounded-lg">
                    Pending: {apptCount("PENDING")}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100/50 px-2.5 py-1 rounded-lg">
                    Confirmed: {apptCount("CONFIRMED")}
                  </span>
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-lg">
                    Checked In: {apptCount("CHECKED_IN")}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-lg">
                    Completed: {apptCount("COMPLETED")}
                  </span>
                </div>

                {todayAppointments.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    No appointments today
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todayAppointments.map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {appt.patient
                              ? `${appt.patient.firstName} ${appt.patient.lastName}`
                              : appt.bookingName}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {appt.serviceType || "General"}
                            {appt.scheduledTime
                              ? ` · ${appt.scheduledTime}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {appt.queueEntry && (
                            <span className="text-xs font-extrabold bg-indigo-50 border border-indigo-100/50 text-indigo-600 px-2 py-0.5 rounded-lg select-none">
                              #{appt.queueEntry.queueNumber}
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase select-none ${APPT_STATUS_COLOR[appt.status]}`}
                          >
                            {appt.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent patients card */}
            <Card className="border-slate-200/60 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Recent Patients
                  </CardTitle>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Recently registered patients in this workspace
                  </p>
                </div>
                <Link
                  href={`/clinic/${slug}/admin/patients`}
                  className="text-xs text-primary font-bold hover:underline transition-all"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="pt-4">
                {recentPatients.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    No patients yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentPatients.map((p) => (
                      <Link
                        key={p.id}
                        href={`/clinic/${slug}/admin/patients/${p.id}`}
                        className="flex items-center gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/80 rounded-2xl transition-all duration-200 group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-indigo-600/10 text-primary text-xs font-bold border border-primary/10 flex-shrink-0 select-none group-hover:scale-105 transition-transform duration-200">
                          {p.firstName[0]}
                          {p.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-primary transition-colors">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold tracking-wide mt-0.5">
                            {p.phone || formatDate(p.createdAt)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3 width) */}
          <div className="lg:col-span-1">
            {/* Active queue card */}
            <Card className="border-slate-200/60 shadow-sm bg-white h-full flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-extrabold text-slate-900 tracking-tight">
                    Active Queue
                  </CardTitle>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Real-time patient visits status queue
                  </p>
                </div>
                <Link
                  href={`/clinic/${slug}/admin/bookings?tab=queue`}
                  className="text-xs text-primary font-bold hover:underline transition-all"
                >
                  Manage
                </Link>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                {/* Horizontal stats summary bar */}
                <div className="flex flex-wrap gap-1.5 pb-4 border-b border-slate-100 mb-4 select-none">
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-100/50 px-2 py-1 rounded-lg">
                    Waiting: {queueCount("WAITING")}
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-100/50 px-2 py-1 rounded-lg">
                    Consult: {queueCount("IN_CONSULTATION")}
                  </span>
                  <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-100/50 px-2 py-1 rounded-lg">
                    Treating: {queueCount("IN_TREATMENT")}
                  </span>
                </div>

                {todayQueue.length === 0 ? (
                  <p className="text-sm text-slate-400 py-6 text-center">
                    Queue is empty
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todayQueue.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-black flex-shrink-0 select-none">
                          {q.queueNumber}
                        </span>
                        <p className="flex-1 text-sm font-bold text-slate-900 truncate">
                          {q.patientName}
                        </p>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide uppercase select-none ${QUEUE_STATUS_COLOR[q.status]}`}
                        >
                          {q.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
