import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { ProceduresClient } from "@/components/admin/procedures-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Procedures" }

interface Props { params: Promise<{ slug: string }> }

export default async function ProceduresPage({ params }: Props) {
  const { slug } = await params
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  if (user.role !== "DENTIST_ADMIN") redirect(`/clinic/${slug}/admin`)

  const [procedures, consentTemplates] = await Promise.all([
    prisma.procedure.findMany({
      where: { clinicId: user.clinicId },
      include: { consentTemplate: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.documentTemplate.findMany({
      where: { clinicId: user.clinicId, type: "CONSENT_FORM", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Procedure Builder" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <ProceduresClient
          procedures={JSON.parse(JSON.stringify(procedures))}
          consentTemplates={consentTemplates}
          clinicSlug={slug}
        />
      </main>
    </>
  )
}
