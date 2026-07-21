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
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page } = await searchParams;
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

  const take = 20;
  const skip = (parseInt(page || "1") - 1) * take;

  const { inquiries, total } = await getInquiries(clinic.id, skip, take);

  return (
    <>
      <AdminHeader clinicSlug={slug} title="Inquiries" userName={user.name} />
      <main className="flex-1 p-4 lg:p-6">
        <InquiriesClient
          inquiries={inquiries}
          total={total}
          page={parseInt(page || "1")}
          clinicSlug={slug}
        />
      </main>
    </>
  );
}
