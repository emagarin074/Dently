import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { DocumentsClient } from "@/components/admin/documents-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documents" };

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function DocumentsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const take = 20;
  const skip = (parseInt(page || "1") - 1) * take;

  const [clinic, templates, recentDocs, documentsTotal] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { name: true, address: true, phone: true, email: true },
    }),
    prisma.documentTemplate.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { name: "asc" },
    }),
    prisma.patientDocument.findMany({
      where: { clinicId: user.clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.patientDocument.count({ where: { clinicId: user.clinicId } }),
  ]);

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Documents" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <DocumentsClient
          templates={JSON.parse(JSON.stringify(templates))}
          documents={JSON.parse(JSON.stringify(recentDocs))}
          total={documentsTotal}
          page={parseInt(page || "1")}
          clinicSlug={slug}
          userRole={user.role}
          clinicInfo={clinic ? JSON.parse(JSON.stringify(clinic)) : null}
        />
      </main>
    </>
  );
}
