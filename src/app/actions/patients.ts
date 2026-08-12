"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  middleName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  bloodType: z.string().optional(),
  notes: z.string().optional(),
});

export async function createPatient(clinicSlug: string, formData: FormData) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { dateOfBirth, email, ...rest } = parsed.data;

  try {
    const patient = await prisma.patient.create({
      data: {
        clinicId: user.clinicId,
        ...rest,
        email: email || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/patients`);
    return { success: true, patientId: patient.id };
  } catch (error) {
    console.error("Create patient error:", error);
    return { error: "Failed to create patient." };
  }
}

export async function updatePatient(
  clinicSlug: string,
  patientId: string,
  formData: FormData,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = patientSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { dateOfBirth, email, ...rest } = parsed.data;

  try {
    await prisma.patient.update({
      where: { id: patientId, clinicId: user.clinicId },
      data: {
        ...rest,
        email: email || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/patients`);
    revalidatePath(`/clinic/${clinicSlug}/admin/patients/${patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Update patient error:", error);
    return { error: "Failed to update patient." };
  }
}

export async function saveHealthQuestionnaire(
  clinicSlug: string,
  patientId: string,
  formData: FormData,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  try {
    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: user.clinicId },
    });
    if (!patient) return { error: "Patient not found" };

    const getBool = (key: string) => formData.getAll(key).includes("true");

    const data = {
      hasHypertension: getBool("hasHypertension"),
      hasDiabetes: getBool("hasDiabetes"),
      hasHeartDisease: getBool("hasHeartDisease"),
      hasBleedingDisorder: getBool("hasBleedingDisorder"),
      isPregnant: getBool("isPregnant"),
      hasAllergies: getBool("hasAllergies"),
      allergiesDetail: (formData.get("allergiesDetail") as string) || null,
      currentMedications:
        (formData.get("currentMedications") as string) || null,
      previousDentalWork:
        (formData.get("previousDentalWork") as string) || null,
      chiefComplaint: (formData.get("chiefComplaint") as string) || null,
      additionalNotes: (formData.get("additionalNotes") as string) || null,
    };

    await prisma.healthQuestionnaire.upsert({
      where: { patientId },
      update: { ...data, updatedAt: new Date() },
      create: { patientId, ...data },
    });

    revalidatePath(`/clinic/${clinicSlug}/admin/patients/${patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Save health questionnaire error:", error);
    return { error: "Failed to save health questionnaire." };
  }
}

export async function addPatientNote(
  clinicSlug: string,
  patientId: string,
  content: string,
) {
  const user = await requireAuth(clinicSlug);
  if (!user) return { error: "Unauthorized" };

  if (!content || !content.trim())
    return { error: "Note content is required." };

  try {
    // Verify patient belongs to this clinic (fixes cross-tenant bug)
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, clinicId: user.clinicId },
    });
    if (!patient) return { error: "Patient not found" };

    await prisma.patientNote.create({
      data: { patientId, content: content.trim() },
    });
    revalidatePath(`/clinic/${clinicSlug}/admin/patients/${patientId}`);
    return { success: true };
  } catch (error) {
    console.error("Add patient note error:", error);
    return { error: "Failed to add note." };
  }
}
