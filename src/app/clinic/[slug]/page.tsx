import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClinicPublicPage } from "@/components/clinic/public-page";
import { WebsiteRenderer } from "@/components/clinic/website-renderer";
import {
  SectionBlock,
  GlobalStyles,
  DEFAULT_GLOBAL_STYLES,
} from "@/lib/website-builder/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug, isActive: true },
  });
  if (!clinic) return { title: "Clinic Not Found" };
  return {
    title: clinic.name,
    description: clinic.description || `Book an appointment at ${clinic.name}`,
  };
}

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug, isActive: true },
    include: {
      settings: true,
      websitePage: true,
      users: {
        where: { role: "DENTIST_ADMIN", isActive: true },
        select: { id: true, name: true, specialization: true },
      },
      procedures: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          description: true,
          priceType: true,
          price: true,
          priceMin: true,
          priceMax: true,
          category: true,
        },
      },
    },
  });

  if (!clinic) notFound();

  // Serialize Decimal fields
  const serializedClinic = {
    ...clinic,
    procedures: clinic.procedures.map((p) => ({
      ...p,
      price: p.price ? Number(p.price) : null,
      priceMin: p.priceMin ? Number(p.priceMin) : null,
      priceMax: p.priceMax ? Number(p.priceMax) : null,
    })),
  };

  // If website builder is configured and published, use it
  if (clinic.websitePage && clinic.websitePage.isPublished) {
    const sections = clinic.websitePage.sections as unknown as SectionBlock[];
    const globalStyles =
      (clinic.websitePage.globalStyles as unknown as GlobalStyles) ||
      DEFAULT_GLOBAL_STYLES;

    return (
      <WebsiteRenderer
        clinic={{
          slug: clinic.slug,
          name: clinic.name,
          description: clinic.description,
          address: clinic.address,
          phone: clinic.phone,
          email: clinic.email,
          procedures: serializedClinic.procedures,
          users: clinic.users,
        }}
        sections={sections}
        globalStyles={globalStyles}
      />
    );
  }

  // Fallback: original public page
  return <ClinicPublicPage clinic={serializedClinic} />;
}
