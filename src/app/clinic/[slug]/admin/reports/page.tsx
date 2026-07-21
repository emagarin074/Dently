import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { ReportsClient } from "@/components/admin/reports-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Reports" }

interface Props { params: Promise<{ slug: string }> }

export default async function ReportsPage({ params }: Props) {
  const { slug } = await params
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  const now = new Date()
  const today = new Date(now); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const firstOfYear = new Date(now.getFullYear(), 0, 1)

  const [dailyPayments, monthlyPayments, yearlyPayments, appointmentsByStatus, procedureStats, dentistRevenue] = await Promise.all([
    prisma.payment.findMany({
      where: { billing: { clinicId: user.clinicId }, paidAt: { gte: today, lt: tomorrow } },
      select: { amount: true, method: true },
    }),
    prisma.payment.findMany({
      where: { billing: { clinicId: user.clinicId }, paidAt: { gte: firstOfMonth } },
      select: { amount: true, paidAt: true },
    }),
    prisma.payment.findMany({
      where: { billing: { clinicId: user.clinicId }, paidAt: { gte: firstOfYear } },
      select: { amount: true, paidAt: true },
    }),
    prisma.appointment.groupBy({
      by: ["status"],
      where: { clinicId: user.clinicId },
      _count: { id: true },
    }),
    prisma.appointmentProcedure.groupBy({
      by: ["procedureId"],
      where: { appointment: { clinicId: user.clinicId } },
      _count: { id: true },
      _sum: { price: true },
    }),
    prisma.appointmentProcedure.groupBy({
      by: ["dentistId"],
      where: { appointment: { clinicId: user.clinicId } },
      _count: { id: true },
      _sum: { price: true },
    }),
  ])

  // Enrich procedure stats
  const procedureIds = procedureStats.map(s => s.procedureId)
  const procedures = await prisma.procedure.findMany({
    where: { id: { in: procedureIds } },
    select: { id: true, name: true },
  })

  const dentistIds = dentistRevenue.filter(d => d.dentistId).map(d => d.dentistId!)
  const dentists = await prisma.user.findMany({
    where: { id: { in: dentistIds } },
    select: { id: true, name: true },
  })

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Reports" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <ReportsClient
          dailyRevenue={dailyPayments.reduce((s, p) => s + Number(p.amount), 0)}
          monthlyRevenue={monthlyPayments.reduce((s, p) => s + Number(p.amount), 0)}
          yearlyRevenue={yearlyPayments.reduce((s, p) => s + Number(p.amount), 0)}
          monthlyData={JSON.parse(JSON.stringify(monthlyPayments))}
          appointmentsByStatus={JSON.parse(JSON.stringify(appointmentsByStatus))}
          procedureStats={procedureStats.map(s => ({
            procedureId: s.procedureId,
            name: procedures.find(p => p.id === s.procedureId)?.name || "Unknown",
            count: s._count.id,
            revenue: Number(s._sum.price || 0),
          }))}
          dentistRevenue={dentistRevenue.map(d => ({
            dentistId: d.dentistId,
            name: dentists.find(u => u.id === d.dentistId)?.name || "Unknown",
            procedures: d._count.id,
            revenue: Number(d._sum.price || 0),
          }))}
        />
      </main>
    </>
  )
}
