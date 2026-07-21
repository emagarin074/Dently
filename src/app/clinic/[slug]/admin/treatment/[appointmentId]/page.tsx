import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/header";
import { TreatmentClient } from "@/components/admin/treatment-client";

interface Props {
  params: Promise<{ slug: string; appointmentId: string }>;
}

export default async function TreatmentPage({ params }: Props) {
  const { slug, appointmentId } = await params;
  const user = await requireAuth(slug);
  if (!user) redirect(`/clinic/${slug}/login`);

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId, clinicId: user.clinicId },
    include: {
      patient: {
        include: {
          installmentPlans: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
          },
        },
      },
      dentist: { select: { id: true, name: true } },
      queueEntry: true,
      billing: true,
      procedures: {
        include: {
          procedure: true,
          documents: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!appointment) notFound();

  const procedures = await prisma.procedure.findMany({
    where: { clinicId: user.clinicId, isActive: true },
    select: {
      id: true,
      name: true,
      category: true,
      priceType: true,
      price: true,
      priceMin: true,
      priceMax: true,
      hasOdontogram: true,
      hasToothSurface: true,
      hasUpperLower: true,
      hasQuadrant: true,
      hasMaterial: true,
      hasShade: true,
      hasSeverity: true,
      hasRemarks: true,
      hasPhotoUpload: true,
      hasXrayUpload: true,
      hasLabRequest: true,
      requireSignedConsent: true,
      requirePhoto: true,
      requireXray: true,
      requireLabDocs: true,
      consentTemplate: { select: { content: true, name: true } },
      priceRules: true,
    },
  });

  let hasExistingConsent = false;
  let hasExistingXray = false;
  let hasExistingPhoto = false;

  if (appointment.patientId) {
    const historicalDocs = await prisma.procedureDocument.findMany({
      where: {
        appointmentProcedure: {
          appointment: {
            patientId: appointment.patientId,
          },
        },
      },
      select: {
        type: true,
      },
    });

    const patientDocs = await prisma.patientDocument.findMany({
      where: {
        patientId: appointment.patientId,
      },
      select: {
        type: true,
      },
    });

    const allTypes = [
      ...historicalDocs.map((d) => d.type),
      ...patientDocs.map((d) => d.type),
    ];

    hasExistingConsent = allTypes.includes("CONSENT_FORM");
    hasExistingXray = allTypes.includes("XRAY");
    hasExistingPhoto = allTypes.includes("PHOTO");
  }

  return (
    <>
      <AdminHeader
        clinicSlug={slug}
        title="Treatment & Charting"
        userName={user.name}
      />
      <main className="flex-1 p-4 lg:p-6 bg-slate-50/50">
        <TreatmentClient
          clinicSlug={slug}
          appointment={JSON.parse(JSON.stringify(appointment))}
          procedures={JSON.parse(JSON.stringify(procedures))}
          hasExistingConsent={hasExistingConsent}
          hasExistingXray={hasExistingXray}
          hasExistingPhoto={hasExistingPhoto}
        />
      </main>
    </>
  );
}
