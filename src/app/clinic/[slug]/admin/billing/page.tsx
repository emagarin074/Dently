import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/header"
import { BillingClient } from "@/components/admin/billing-client"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Billing" }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function BillingPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { status } = await searchParams
  const user = await requireAuth(slug)
  if (!user) redirect(`/clinic/${slug}/login`)

  const billings = await prisma.billing.findMany({
    where: {
      clinicId: user.clinicId,
      ...(status && status !== "ALL" ? { status: status as never } : {}),
    },
    include: {
      appointment: {
        include: {
          patient: { select: { id: true, firstName: true, lastName: true } },
          procedures: { include: { procedure: { select: { name: true } } } },
        },
      },
      payments: { orderBy: { paidAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Billing & Payments" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <BillingClient billings={JSON.parse(JSON.stringify(billings))} clinicSlug={slug} />
      </main>
    </>
  )
}
