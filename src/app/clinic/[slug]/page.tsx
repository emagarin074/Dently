import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ClinicPublicPage } from "@/components/clinic/public-page";
import { WebsiteRenderer } from "@/components/clinic/website-renderer";
import { ModernTemplate } from "@/components/clinic/templates/modern-template";
import {
  SectionBlock,
  GlobalStyles,
  DEFAULT_GLOBAL_STYLES,
} from "@/lib/website-builder/types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug, isActive: true },
    include: { websitePage: true },
  });
  if (!clinic) return { title: "Clinic Not Found" };

  let iconObj: { url: string; type?: string; sizes?: string } = {
    url: "/favicon.ico",
  };
  if (clinic.websitePage?.sections) {
    const sections = clinic.websitePage.sections as {
      type: string;
      content: Record<string, unknown>;
    }[];
    const modernData = sections.find((s) => s.type === "modern_data")
      ?.content as Record<string, string> | undefined;
    const logoType = modernData?.logoType || "text";

    // Add a cache buster query parameter so the browser is forced to refetch
    const cacheBuster = `?v=${Date.now()}`;

    if (logoType === "image" && modernData?.logoImage) {
      iconObj = {
        url: `${modernData.logoImage}${modernData.logoImage.includes("?") ? "&" : "?"}v=${Date.now()}`,
        sizes: "any",
      };
    } else {
      const logoIcon = modernData?.logoIcon || "Smile";
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

export default async function ClinicPage({ params }: Props) {
  const { slug } = await params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug, isActive: true },
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
    },
  });

  if (!clinic) notFound();

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
        }}
        sections={sections}
        globalStyles={globalStyles}
        blockedDates={blockedDates}
      />
    );
  }

  // Fallback: original public page
  return (
    <ClinicPublicPage clinic={serializedClinic} blockedDates={blockedDates} />
  );
}
