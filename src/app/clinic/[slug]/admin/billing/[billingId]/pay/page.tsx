import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { PayClient } from "@/components/admin/pay-client";

interface Props {
  params: Promise<{ slug: string; billingId: string }>;
}

export default async function PayPage({ params }: Props) {
  const { slug, billingId } = await params;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const billing = await prisma.billing.findUnique({
    where: { id: billingId, clinicId: user.clinicId },
    include: {
      payments: { orderBy: { paidAt: "desc" } },
      installmentPlan: {
        include: {
          installments: { orderBy: { paidAt: "desc" } },
        },
      },
      appointment: {
        include: {
          patient: {
            include: {
              installmentPlans: {
                where: { status: "ACTIVE" },
                include: {
                  installments: { orderBy: { paidAt: "desc" } },
                },
              },
            },
          },
          dentist: { select: { id: true, name: true } },
          procedures: {
            include: {
              procedure: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!billing) notFound();

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Checkout Billing"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6 bg-slate-50/50">
        <PayClient
          clinicSlug={slug}
          billing={JSON.parse(JSON.stringify(billing))}
        />
      </main>
    </>
  );
}
