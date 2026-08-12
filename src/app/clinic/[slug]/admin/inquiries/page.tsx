import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { InquiriesClient } from "@/components/admin/inquiries-client";
import { getInquiries } from "@/app/actions/inquiries";
import { Metadata } from "next";
import { AdminHeader } from "@/components/admin/header";

export const metadata: Metadata = {
  title: "Inquiries | Admin Dashboard",
};

export default async function InquiriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireAuth(slug);

  if (!user) {
    redirect(`/clinic/${slug}/login`);
  }

  const clinic = await prisma.clinic.findUnique({
    where: { slug },
  });

  if (!clinic) {
    redirect("/");
  }

  const { inquiries, total } = await getInquiries(clinic.id, 0, 20);

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Inquiries" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <InquiriesClient
          initialInquiries={inquiries}
          total={total}
          clinicId={clinic.id}
          clinicSlug={slug}
        />
      </main>
    </>
  );
}
