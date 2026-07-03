import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClinicPublicPage } from "@/components/clinic/public-page"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const clinic = await prisma.clinic.findUnique({ where: { slug, isActive: true } })
  if (!clinic) return { title: "Clinic Not Found" }
  return { title: clinic.name, description: clinic.description || `Book an appointment at ${clinic.name}` }
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params
  const clinic = await prisma.clinic.findUnique({
    where: { slug, isActive: true },
    include: {
      settings: true,
      users: { where: { role: "DENTIST_ADMIN", isActive: true }, select: { id: true, name: true, specialization: true } },
      procedures: { where: { isActive: true }, select: { id: true, name: true, description: true, priceType: true, price: true, priceMin: true, priceMax: true } },
    },
  })

  if (!clinic) notFound()

  // Serialize Decimal fields to plain numbers for client component
  const serializedClinic = {
    ...clinic,
    procedures: clinic.procedures.map((p) => ({
      ...p,
      price: p.price ? Number(p.price) : null,
      priceMin: p.priceMin ? Number(p.priceMin) : null,
      priceMax: p.priceMax ? Number(p.priceMax) : null,
    })),
  }

  return <ClinicPublicPage clinic={serializedClinic} />
}
