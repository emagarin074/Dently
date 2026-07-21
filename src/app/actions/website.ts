"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { SectionBlock, GlobalStyles } from "@/lib/website-builder/types";
import { getTemplate } from "@/lib/website-builder/templates";

export async function getWebsitePage(clinicSlug: string) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const page = await prisma.websitePage.findUnique({
      where: { clinicId: user.clinicId },
    });
    return { success: true, page };
  } catch (error) {
    console.error("Get website page error:", error);
    return { error: "Failed to load website configuration." };
  }
}

export async function initializeWebsitePage(
  clinicSlug: string,
  templateId: string,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const template = getTemplate(templateId);
  if (!template) return { error: "Template not found." };

  try {
    const page = await prisma.websitePage.upsert({
      where: { clinicId: user.clinicId },
      update: {
        templateId,
        sections: JSON.parse(JSON.stringify(template.sections)),
        globalStyles: JSON.parse(JSON.stringify(template.globalStyles)),
      },
      create: {
        clinicId: user.clinicId,
        templateId,
        sections: JSON.parse(JSON.stringify(template.sections)),
        globalStyles: JSON.parse(JSON.stringify(template.globalStyles)),
        isPublished: true,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true, page };
  } catch (error) {
    console.error("Initialize website page error:", error);
    return { error: "Failed to initialize website." };
  }
}

export async function saveWebsiteSections(
  clinicSlug: string,
  sections: SectionBlock[],
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { sections: JSON.parse(JSON.stringify(sections)) },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true };
  } catch (error) {
    console.error("Save website sections error:", error);
    return { error: "Failed to save changes." };
  }
}

export async function saveWebsiteGlobalStyles(
  clinicSlug: string,
  globalStyles: GlobalStyles,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { globalStyles: JSON.parse(JSON.stringify(globalStyles)) },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true };
  } catch (error) {
    console.error("Save global styles error:", error);
    return { error: "Failed to save styles." };
  }
}

export async function toggleWebsitePublished(
  clinicSlug: string,
  isPublished: boolean,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { isPublished },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    return { success: true };
  } catch (error) {
    console.error("Toggle website published error:", error);
    return { error: "Failed to update publish status." };
  }
}

export async function updateSectionContent(
  clinicSlug: string,
  sectionId: string,
  content: Record<string, unknown>,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const page = await prisma.websitePage.findUnique({
      where: { clinicId: user.clinicId },
    });
    if (!page) return { error: "Website not configured." };

    const sections = page.sections as unknown as SectionBlock[];
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return { error: "Section not found." };

    sections[idx].content = { ...sections[idx].content, ...content };

    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { sections: JSON.parse(JSON.stringify(sections)) },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true };
  } catch (error) {
    console.error("Update section content error:", error);
    return { error: "Failed to update section." };
  }
}

export async function updateSectionStyle(
  clinicSlug: string,
  sectionId: string,
  style: Record<string, unknown>,
) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const page = await prisma.websitePage.findUnique({
      where: { clinicId: user.clinicId },
    });
    if (!page) return { error: "Website not configured." };

    const sections = page.sections as unknown as SectionBlock[];
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return { error: "Section not found." };

    sections[idx].style = { ...sections[idx].style, ...style };

    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { sections: JSON.parse(JSON.stringify(sections)) },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true };
  } catch (error) {
    console.error("Update section style error:", error);
    return { error: "Failed to update section style." };
  }
}

export async function addSection(clinicSlug: string, section: SectionBlock) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const page = await prisma.websitePage.findUnique({
      where: { clinicId: user.clinicId },
    });
    if (!page) return { error: "Website not configured." };

    const sections = page.sections as unknown as SectionBlock[];
    sections.push(section);

    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { sections: JSON.parse(JSON.stringify(sections)) },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true };
  } catch (error) {
    console.error("Add section error:", error);
    return { error: "Failed to add section." };
  }
}

export async function removeSection(clinicSlug: string, sectionId: string) {
  const user = await requireAdminAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    const page = await prisma.websitePage.findUnique({
      where: { clinicId: user.clinicId },
    });
    if (!page) return { error: "Website not configured." };

    const sections = (page.sections as unknown as SectionBlock[]).filter(
      (s) => s.id !== sectionId,
    );

    await prisma.websitePage.update({
      where: { clinicId: user.clinicId },
      data: { sections: JSON.parse(JSON.stringify(sections)) },
    });

    revalidatePath(`/clinic/${clinicSlug}`);
    revalidatePath(`/clinic/${clinicSlug}/admin/website`);
    return { success: true };
  } catch (error) {
    console.error("Remove section error:", error);
    return { error: "Failed to remove section." };
  }
}
