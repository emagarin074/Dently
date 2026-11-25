import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Users,
  CreditCard,
  Clock,
  TrendingUp,
  ArrowUpRight,
  Plus,
  UserPlus,
  CheckCircle2,
  CalendarCheck,
  Stethoscope,
  ChevronRight,
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
    clinicSettings,
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
    prisma.clinicSettings.findUnique({
      where: { clinicId: user.clinicId },
      select: { queueWorkflow: true },
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

  function getApptBadgeVariant(
    status: string,
  ): "warning" | "indigo" | "success" | "destructive" | "secondary" {
    switch (status) {
      case "PENDING":
        return "warning";
      case "CONFIRMED":
      case "CHECKED_IN":
        return "indigo";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "destructive";
      default:
        return "secondary";
    }
  }

  function getQueueBadgeVariant(
    status: string,
  ): "warning" | "indigo" | "success" | "secondary" {
    switch (status) {
      case "WAITING":
        return "warning";
      case "IN_CONSULTATION":
      case "IN_TREATMENT":
      case "FOR_PAYMENT":
        return "indigo";
      case "COMPLETED":
        return "success";
      default:
        return "secondary";
    }
  }

  const formattedToday = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Dashboard"
        userName={user.name}
        plan={user.clinic.plan}
        planExpiresAt={
          user.clinic.planExpiresAt
            ? user.clinic.planExpiresAt.toISOString()
            : null
        }
        clinicName={user.clinic.name}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Workspace Greeting & Quick Action Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Practice Overview
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {formattedToday} · {user.clinic.name}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-8 gap-1.5 text-xs font-semibold shadow-2xs"
            >
              <Link href={`/clinic/${slug}/admin/patients`}>
                <UserPlus className="h-3.5 w-3.5 text-slate-500" />
                <span>Add Patient</span>
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 gap-1.5 text-xs font-semibold shadow-xs"
            >
              <Link href={`/clinic/${slug}/admin/bookings?tab=requests`}>
                <Plus className="h-3.5 w-3.5" />
                <span>New Appointment</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Linear-style KPI Row */}
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {/* Daily Revenue */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Daily Revenue
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {formatCurrency(todayRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center text-emerald-700 font-medium">
                  {todayPayments.length} payment
                  {todayPayments.length === 1 ? "" : "s"}
                </span>
                <span>today</span>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                MTD Revenue
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/50">
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {formatCurrency(monthRevenue)}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center text-indigo-700 font-medium">
                  Month to date
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Patients */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Active Patients
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-200/50">
                <Users className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {patientsCount}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                <span className="text-sky-700 font-medium">
                  Registered records
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Follow-ups Due */}
          <Card className="border border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Follow-ups Due
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200/50">
                <Clock className="h-3.5 w-3.5" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-mono">
                {followUpsDue}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                <span
                  className={
                    followUpsDue > 0
                      ? "text-rose-600 font-medium"
                      : "text-slate-500"
                  }
                >
                  {followUpsDue > 0 ? "Requires attention" : "All up to date"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Consolidate Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width): Today's Schedule & Recent Patients */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Appointments Card */}
            <Card className="border border-slate-200/80 bg-white shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4 sm:p-5">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-slate-600" />
                    Today&apos;s Appointments
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Scheduled visits and consultations for today
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <Link href={`/clinic/${slug}/admin/bookings?tab=today`}>
                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {/* Horizontal status breakdown badges */}
                <div className="flex flex-wrap items-center gap-1.5 pb-4 border-b border-slate-100 mb-4 select-none">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    Total: {todayAppointments.length}
                  </span>
                  <Badge variant="warning">
                    Pending: {apptCount("PENDING")}
                  </Badge>
                  <Badge variant="indigo">
                    Confirmed: {apptCount("CONFIRMED")}
                  </Badge>
                  <Badge variant="indigo">
                    Checked In: {apptCount("CHECKED_IN")}
                  </Badge>
                  <Badge variant="success">
                    Completed: {apptCount("COMPLETED")}
                  </Badge>
                </div>

                {todayAppointments.length === 0 ? (
                  <div className="py-10 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">
                      No appointments scheduled for today yet.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="mt-3 h-8 text-xs"
                    >
                      <Link
                        href={`/clinic/${slug}/admin/bookings?tab=requests`}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Create Appointment
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todayAppointments.map((appt) => {
                      const patientName = appt.patient
                        ? `${appt.patient.firstName} ${appt.patient.lastName}`
                        : appt.bookingName || "Guest Patient";
                      const initials = patientName
                        .split(" ")
                        .map((n) => n[0])
                        .filter(Boolean)
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <div
                          key={appt.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex-shrink-0 group-hover:bg-slate-200 transition-colors">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                {patientName}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-medium text-slate-700">
                                  {appt.serviceType || "General Procedure"}
                                </span>
                                {appt.scheduledTime && (
                                  <>
                                    <span>·</span>
                                    <span className="font-mono text-slate-600">
                                      {appt.scheduledTime}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {appt.queueEntry && (
                              <span className="text-[11px] font-mono font-bold bg-indigo-50 border border-indigo-200/60 text-indigo-700 px-2 py-0.5 rounded-md">
                                #{appt.queueEntry.queueNumber}
                              </span>
                            )}
                            <Badge variant={getApptBadgeVariant(appt.status)}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              {appt.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Patients Card */}
            <Card className="border border-slate-200/80 bg-white shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4 sm:p-5">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Users className="h-4 w-4 text-slate-600" />
                    Recent Patients
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Latest patients registered in this clinic
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <Link href={`/clinic/${slug}/admin/patients`}>
                    Directory <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {recentPatients.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No patient records found yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {recentPatients.map((p) => {
                      const pInitials =
                        `${p.firstName[0] || ""}${p.lastName[0] || ""}`.toUpperCase();
                      return (
                        <Link
                          key={p.id}
                          href={`/clinic/${slug}/admin/patients/${p.id}`}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70 transition-all duration-150 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold flex-shrink-0 shadow-2xs">
                              {pInitials}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-primary transition-colors">
                                {p.lastName}, {p.firstName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {p.phone || formatDate(p.createdAt)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1/3 width): Live Queue & Practice Actions */}
          <div className="space-y-6">
            {/* Active Queue Card */}
            <Card className="border border-slate-200/80 bg-white shadow-2xs">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-4 sm:p-5">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-600" />
                    Live Queue
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Patients physically at clinic
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  <Link href={`/clinic/${slug}/admin/bookings?tab=queue`}>
                    Manage <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                {/* Workflow summary pills */}
                <div className="flex flex-wrap gap-1.5 pb-3 border-b border-slate-100 mb-3 select-none">
                  {clinicSettings?.queueWorkflow !== "DIRECT_TREATMENT" && (
                    <Badge variant="warning">
                      Waiting: {queueCount("WAITING")}
                    </Badge>
                  )}
                  {clinicSettings?.queueWorkflow === "FULL_WORKFLOW" && (
                    <Badge variant="indigo">
                      Consult: {queueCount("IN_CONSULTATION")}
                    </Badge>
                  )}
                  <Badge variant="indigo">
                    Treating: {queueCount("IN_TREATMENT")}
                  </Badge>
                </div>

                {todayQueue.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                    <p className="text-xs font-medium text-slate-500">
                      No patients in queue currently.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check in arriving appointments to add to queue.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {todayQueue.map((q) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-2"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white text-xs font-mono font-bold flex-shrink-0">
                            #{q.queueNumber}
                          </span>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {q.patientName}
                          </p>
                        </div>
                        <Badge variant={getQueueBadgeVariant(q.status)}>
                          {q.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Practice Shortcuts */}
            <Card className="border border-slate-200/80 bg-white shadow-2xs">
              <CardHeader className="border-b border-slate-100 p-4 sm:p-5">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                  Quick Shortcuts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-1">
                <Link
                  href={`/clinic/${slug}/admin/procedures`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-3.5 w-3.5 text-slate-500" />
                    <span>Procedure Builder</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </Link>
                <Link
                  href={`/clinic/${slug}/admin/billing`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                    <span>Billing & Invoices</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </Link>
                <Link
                  href={`/clinic/${slug}/admin/qr?tab=intake`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Patient Intake QR</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
