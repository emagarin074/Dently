import { requireAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { UsersClient } from "@/components/admin/users-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Users" };

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;
  const user = await requireAdminAuth(slug);
  if (!user) redirect(`/clinic/${slug}/admin`);

  const take = 20;
  const skip = (parseInt(page || "1") - 1) * take;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { name: "asc" },
      take,
      skip,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        licenseNumber: true,
        specialization: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: { clinicId: user.clinicId } }),
  ]);

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="User Management"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6">
        <UsersClient
          users={JSON.parse(JSON.stringify(users))}
          total={total}
          page={parseInt(page || "1")}
          clinicSlug={slug}
          currentUserId={user.id}
        />
      </main>
    </>
  );
}
