import { AdminHeader } from "@/components/admin/header";
import { BranchesClient } from "@/components/admin/branches-client";
import { requireAdminAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Branches" };

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function BranchesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page } = await searchParams;
  const user = await requireAdminAuth(slug);
  if (!user) redirect(`/clinic/${slug}/admin`);

  const currentPage = Math.max(parseInt(page || "1"), 1);
  const take = 20;
  const skip = (currentPage - 1) * take;

  const [branches, total, users] = await Promise.all([
    prisma.branch.findMany({
      where: { clinicId: user.clinicId },
      include: {
        userAssignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
      take,
      skip,
    }),
    prisma.branch.count({ where: { clinicId: user.clinicId } }),
    prisma.user.findMany({
      where: { clinicId: user.clinicId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Branches" userName={user.name} />
      <main className="flex-1 space-y-6 p-4 lg:p-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Branch Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage clinic locations and assign staff to the branches they work
            in.
          </p>
        </div>

        <BranchesClient
          clinicSlug={slug}
          branches={JSON.parse(JSON.stringify(branches))}
          users={JSON.parse(JSON.stringify(users))}
          branchLimit={user.clinic.branchLimit}
          total={total}
          page={currentPage}
        />
      </main>
    </>
  );
}
