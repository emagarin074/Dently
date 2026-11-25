import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClinicPublicPage } from "@/components/clinic/public-page";
import { PublicUnavailablePage } from "@/components/clinic/public-unavailable-page";
import { WebsiteRenderer } from "@/components/clinic/website-renderer";
import { ModernTemplate } from "@/components/clinic/templates/modern-template";
import { ClassicTemplate } from "@/components/clinic/templates/classic-template";
import { MinimalTemplate } from "@/components/clinic/templates/minimal-template";
import { BoldTemplate } from "@/components/clinic/templates/bold-template";
import { getClinicAccessStatus } from "@/lib/subscription-status";
import { getOrSetCache, TenantCacheKeys } from "@/lib/cache/tenant-cache";
import { getTemplate } from "@/lib/website-builder/templates";
import {
  SectionBlock,
  GlobalStyles,
  DEFAULT_GLOBAL_STYLES,
} from "@/lib/website-builder/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ branch?: string; previewTemplate?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: { websitePage: true },
  });
  if (!clinic) return { title: "Clinic Not Found" };

  const accessStatus = getClinicAccessStatus(clinic);
  if (accessStatus !== "ACTIVE") {
    return {
      title: `${clinic.name} Temporarily Unavailable`,
      description: "This clinic page is temporarily unavailable.",
    };
  }

  let iconObj: { url: string; type?: string; sizes?: string } = {
    url: "/favicon.ico",
  };
  if (clinic.websitePage?.sections) {
    const sections = clinic.websitePage.sections as {
      type: string;
      content: Record<string, unknown>;
    }[];
    const templateData = (sections.find((s) => s.type.endsWith("_data"))
      ?.content || sections[0]?.content) as Record<string, string> | undefined;
    const logoType = templateData?.logoType || "text";

    // Add a cache buster query parameter so the browser is forced to refetch
    const cacheBuster = `?v=${Date.now()}`;

    if (logoType === "image" && templateData?.logoImage) {
      iconObj = {
        url: `${templateData.logoImage}${templateData.logoImage.includes("?") ? "&" : "?"}v=${Date.now()}`,
        sizes: "any",
      };
    } else {
      const logoIcon = templateData?.logoIcon || "Smile";
      iconObj = {
        url: `/api/icon/${logoIcon}${cacheBuster}`,
        type: "image/svg+xml",
        sizes: "any",
      };
    }
  }

  return {
    title: clinic.name,
    description: `Book an appointment at ${clinic.name}`,
    icons: {
      icon: [iconObj],
      shortcut: [iconObj],
      apple: [iconObj],
    },
  };
}

export default async function ClinicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { branch, previewTemplate } = await searchParams;
  const clinic = await getOrSetCache(
    TenantCacheKeys.clinicPublicWebsite(slug),
    300,
    async () => {
      return prisma.clinic.findUnique({
        where: { slug },
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
          branches: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              isPrimary: true,
            },
            orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
          },
        },
      });
    },
  );

  if (!clinic) notFound();

  const accessStatus = getClinicAccessStatus(clinic);
  if (accessStatus !== "ACTIVE") {
    return (
      <PublicUnavailablePage clinicName={clinic.name} status={accessStatus} />
    );
  }

  // Fetch active calendar blocks for this clinic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const calendarBlocks = await prisma.calendarBlock.findMany({
    where: { clinicId: clinic.id, endDate: { gte: today } },
    select: { startDate: true, endDate: true, title: true },
  });
  const blockedDates = calendarBlocks.map((b) => ({
    startDate: b.startDate.toISOString().split("T")[0],
    endDate: b.endDate.toISOString().split("T")[0],
    title: b.title,
  }));

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
  const initialBranchId =
    clinic.branches.find((clinicBranch) => clinicBranch.id === branch)?.id ||
    clinic.branches.find((clinicBranch) => clinicBranch.isPrimary)?.id ||
    clinic.branches[0]?.id ||
    "";

  // If viewing in live template preview mode
  if (previewTemplate) {
    const t = getTemplate(previewTemplate);
    const data = t?.sections[0]?.content || {};
    if (previewTemplate === "classic") {
      return (
        <ClassicTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }
    if (previewTemplate === "minimal") {
      return (
        <MinimalTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }
    if (previewTemplate === "bold") {
      return (
        <BoldTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }
    return (
      <ModernTemplate
        clinic={serializedClinic}
        data={data}
        initialBranchId={initialBranchId}
        blockedDates={blockedDates}
      />
    );
  }

  // If website builder is configured and published, use it
  if (clinic.websitePage && clinic.websitePage.isPublished) {
    const sections = clinic.websitePage.sections as unknown as SectionBlock[];
    const globalStyles =
      (clinic.websitePage.globalStyles as unknown as GlobalStyles) ||
      DEFAULT_GLOBAL_STYLES;

    if (clinic.websitePage.templateId === "modern") {
      const data = sections[0]?.content || {};
      return (
        <ModernTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }

    if (clinic.websitePage.templateId === "classic") {
      const data = sections[0]?.content || {};
      return (
        <ClassicTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }

    if (clinic.websitePage.templateId === "minimal") {
      const data = sections[0]?.content || {};
      return (
        <MinimalTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }

    if (clinic.websitePage.templateId === "bold") {
      const data = sections[0]?.content || {};
      return (
        <BoldTemplate
          clinic={serializedClinic}
          data={data}
          initialBranchId={initialBranchId}
          blockedDates={blockedDates}
        />
      );
    }

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
          branches: clinic.branches,
        }}
        sections={sections}
        globalStyles={globalStyles}
        initialBranchId={initialBranchId}
        blockedDates={blockedDates}
      />
    );
  }

  // Fallback: original public page
  return (
    <ClinicPublicPage
      clinic={serializedClinic}
      initialBranchId={initialBranchId}
      blockedDates={blockedDates}
    />
  );
}
