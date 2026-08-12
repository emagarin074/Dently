import { requireAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { SettingsClient } from "@/components/admin/settings-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireAdminAuth(slug);
  if (!user) redirect(`/clinic/${slug}/admin`);

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    include: {
      settings: true,
      compensationPrograms: {
        include: {
          rules: { orderBy: { priority: "asc" } },
          assignments: true,
        },
        orderBy: [{ name: "asc" }, { version: "desc" }],
      },
    },
  });

  if (!clinic) redirect(`/clinic/${slug}/admin`);

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Clinic Settings"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6">
        <SettingsClient
          clinic={JSON.parse(JSON.stringify(clinic))}
          clinicSlug={slug}
        />
      </main>
    </>
  );
}
