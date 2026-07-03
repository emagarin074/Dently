import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { PatientDetailClient } from "@/components/admin/patient-detail-client"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string; patientId: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { patientId } = await params
  const patient = await prisma.patient.findUnique({ where: { id: patientId } })
  if (!patient) return { title: "Patient Not Found" }
  return { title: `${patient.firstName} ${patient.lastName}` }
}

export default async function PatientDetailPage({ params, searchParams }: Props) {
  const { slug, patientId } = await params
  const { tab } = await searchParams
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: user.clinicId },
    include: {
      healthQuestionnaire: true,
      appointments: {
        include: {
          dentist: { select: { name: true } },
          procedures: { include: { procedure: true } },
          billing: { include: { payments: true } },
        },
        orderBy: { preferredDate: "desc" },
      },
      patientNotes: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { followUpDate: "asc" } },
    },
  })

  if (!patient) notFound()

  const [dentists, procedures] = await Promise.all([
    prisma.user.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: { id: true, name: true, role: true },
    }),
    prisma.procedure.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: {
        id: true, name: true, category: true, priceType: true,
        price: true, priceMin: true, priceMax: true,
        hasOdontogram: true, hasToothSurface: true, hasUpperLower: true,
        hasMaterial: true, hasShade: true, hasSeverity: true, hasRemarks: true,
        requireSignedConsent: true,
        consentTemplate: { select: { content: true, name: true } },
      },
    }),
  ])

  return (
    <>
      <AdminHeader clinicSlug={slug} title={`${patient.firstName} ${patient.lastName}`} userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <PatientDetailClient
          patient={JSON.parse(JSON.stringify(patient))}
          dentists={dentists}
          procedures={JSON.parse(JSON.stringify(procedures))}
          clinicSlug={slug}
          userRole={user.role}
          defaultTab={tab ?? "overview"}
        />
      </main>
    </>
  )
}
