import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Calendar, Users, CreditCard, Clock, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Dashboard" }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { slug } = await params
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

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
      where: { clinicId: user.clinicId, preferredDate: { gte: today, lt: tomorrow } },
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
      where: { clinicId: user.clinicId, preferredDate: { gte: today, lt: tomorrow } },
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
      where: { billing: { clinicId: user.clinicId }, paidAt: { gte: today, lt: tomorrow } },
      select: { amount: true },
    }),
    prisma.payment.findMany({
      where: { billing: { clinicId: user.clinicId }, paidAt: { gte: firstOfMonth } },
      select: { amount: true },
    }),
    prisma.patient.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, createdAt: true, phone: true },
    }),
    prisma.followUp.count({
      where: { clinicId: user.clinicId, status: "PENDING", followUpDate: { lte: tomorrow } },
    }),
    prisma.patient.count({ where: { clinicId: user.clinicId, isActive: true } }),
  ])

  const todayRevenue = todayPayments.reduce((s, p) => s + Number(p.amount), 0)
  const monthRevenue = monthPayments.reduce((s, p) => s + Number(p.amount), 0)

  function apptCount(status: string) {
    return apptStats.find((s) => s.status === status)?._count ?? 0
  }
  function queueCount(status: string) {
    return queueStats.find((s) => s.status === status)?._count ?? 0
  }

  const APPT_STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CHECKED_IN: "bg-primary/10 text-primary",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-gray-100 text-gray-800",
  }

  const QUEUE_STATUS_COLOR: Record<string, string> = {
    WAITING: "bg-yellow-100 text-yellow-800",
    IN_CONSULTATION: "bg-blue-100 text-blue-800",
    IN_TREATMENT: "bg-purple-100 text-purple-800",
    FOR_PAYMENT: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
  }

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Dashboard" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6 space-y-6">

        {/* Revenue row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(todayRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{patientsCount}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Follow-ups Due</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-600">{followUpsDue}</div></CardContent>
          </Card>
        </div>

        {/* Appointment stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Today&apos;s Appointment Stats
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              { status: "PENDING", label: "Pending" },
              { status: "CONFIRMED", label: "Confirmed" },
              { status: "CHECKED_IN", label: "Checked In" },
              { status: "COMPLETED", label: "Completed" },
              { status: "CANCELLED", label: "Cancelled" },
              { status: "NO_SHOW", label: "No-show" },
            ].map(({ status, label }) => (
              <Card key={status}>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold">{apptCount(status)}</div>
                  <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${APPT_STATUS_COLOR[status]}`}>{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Queue stats */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Today&apos;s Queue Stats
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { status: "WAITING", label: "Waiting" },
              { status: "IN_CONSULTATION", label: "In Consultation" },
              { status: "IN_TREATMENT", label: "In Treatment" },
              { status: "FOR_PAYMENT", label: "For Payment" },
              { status: "COMPLETED", label: "Completed Today" },
            ].map(({ status, label }) => (
              <Card key={status}>
                <CardContent className="pt-4 pb-3 text-center">
                  <div className="text-2xl font-bold">{queueCount(status)}</div>
                  <div className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full inline-block ${QUEUE_STATUS_COLOR[status]}`}>{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Today's appointments list */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Today&apos;s Appointments</CardTitle>
              <Link href={`/clinic/${slug}/admin/bookings?tab=today`} className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No appointments today</p>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((appt) => (
                    <div key={appt.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {appt.patient ? `${appt.patient.firstName} ${appt.patient.lastName}` : appt.bookingName}
                        </p>
                        <p className="text-xs text-muted-foreground">{appt.serviceType || "General"}{appt.scheduledTime ? ` · ${appt.scheduledTime}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {appt.queueEntry && (
                          <span className="text-xs font-bold text-primary">#{appt.queueEntry.queueNumber}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPT_STATUS_COLOR[appt.status]}`}>
                          {appt.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Active Queue</CardTitle>
              <Link href={`/clinic/${slug}/admin/bookings?tab=queue`} className="text-xs text-primary hover:underline">Manage</Link>
            </CardHeader>
            <CardContent>
              {todayQueue.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Queue is empty</p>
              ) : (
                <div className="space-y-2">
                  {todayQueue.map((q) => (
                    <div key={q.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold flex-shrink-0">
                        {q.queueNumber}
                      </span>
                      <p className="flex-1 text-sm font-medium truncate">{q.patientName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUEUE_STATUS_COLOR[q.status]}`}>
                        {q.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent patients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Patients</CardTitle>
              <Link href={`/clinic/${slug}/admin/patients`} className="text-xs text-primary hover:underline">View all</Link>
            </CardHeader>
            <CardContent>
              {recentPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No patients yet</p>
              ) : (
                <div className="space-y-3">
                  {recentPatients.map((p) => (
                    <Link key={p.id} href={`/clinic/${slug}/admin/patients/${p.id}`}
                      className="flex items-center gap-3 py-1 hover:bg-accent rounded-lg px-2 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold flex-shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.phone || formatDate(p.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  )
}
