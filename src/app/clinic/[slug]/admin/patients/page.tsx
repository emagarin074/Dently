import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { PatientsClient } from "@/components/admin/patients-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Patients" }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function PatientsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { q, page } = await searchParams
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  const take = 20
  const skip = (parseInt(page || "1") - 1) * take

  const where = {
    clinicId: user.clinicId,
    isActive: true,
    ...(q ? {
      OR: [
        { firstName: { contains: q, mode: "insensitive" as const } },
        { lastName: { contains: q, mode: "insensitive" as const } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
  }

  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { lastName: "asc" },
      take,
      skip,
      include: {
        _count: { select: { appointments: true } },
      },
    }),
    prisma.patient.count({ where }),
  ])

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Patients" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <PatientsClient
          patients={JSON.parse(JSON.stringify(patients))}
          total={total}
          page={parseInt(page || "1")}
          clinicSlug={slug}
        />
      </main>
    </>
  )
}
