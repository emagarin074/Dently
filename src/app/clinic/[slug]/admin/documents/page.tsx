import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { DocumentsClient } from "@/components/admin/documents-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Documents" }

interface Props { params: Promise<{ slug: string }> }

export default async function DocumentsPage({ params }: Props) {
  const { slug } = await params
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  const [templates, recentDocs] = await Promise.all([
    prisma.documentTemplate.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { name: "asc" },
    }),
    prisma.patientDocument.findMany({
      where: { clinicId: user.clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ])

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Documents" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <DocumentsClient
          templates={JSON.parse(JSON.stringify(templates))}
          documents={JSON.parse(JSON.stringify(recentDocs))}
          clinicSlug={slug}
          userRole={user.role}
        />
      </main>
    </>
  )
}
