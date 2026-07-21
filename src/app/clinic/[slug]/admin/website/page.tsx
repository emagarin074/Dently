import { requireAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { WebsiteBuilderClient } from "@/components/admin/website-builder/builder-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Website Builder" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function WebsiteBuilderPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireAdminAuth(slug);
  if (!user) redirect(`/clinic/${slug}/admin`);

  const [page, clinic] = await Promise.all([
    prisma.websitePage.findUnique({ where: { clinicId: user.clinicId } }),
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      include: {
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
        users: {
          where: { role: "DENTIST_ADMIN", isActive: true },
          select: { id: true, name: true, specialization: true },
        },
      },
    }),
  ]);

  const serializedClinic = clinic
    ? {
        ...clinic,
        procedures: clinic.procedures.map(
          (p: {
            id: string;
            name: string;
            description: string | null;
            priceType: string;
            price: unknown;
            priceMin: unknown;
            priceMax: unknown;
            category: string | null;
          }) => ({
            ...p,
            price: p.price ? Number(p.price) : null,
            priceMin: p.priceMin ? Number(p.priceMin) : null,
            priceMax: p.priceMax ? Number(p.priceMax) : null,
          }),
        ),
      }
    : null;

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Website Builder"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6">
        <WebsiteBuilderClient
          clinicSlug={slug}
          initialPage={page ? JSON.parse(JSON.stringify(page)) : null}
          clinic={
            serializedClinic
              ? JSON.parse(JSON.stringify(serializedClinic))
              : null
          }
        />
      </main>
    </>
  );
}
