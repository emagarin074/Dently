import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const healthQuestionnaireSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  hasHypertension: z.boolean().optional().default(false),
  hasDiabetes: z.boolean().optional().default(false),
  hasHeartDisease: z.boolean().optional().default(false),
  hasBleedingDisorder: z.boolean().optional().default(false),
  isPregnant: z.boolean().optional().default(false),
  hasAllergies: z.boolean().optional().default(false),
  allergiesDetail: z.string().max(500).optional().nullable(),
  currentMedications: z.string().max(500).optional().nullable(),
  previousDentalWork: z.string().max(500).optional().nullable(),
  chiefComplaint: z.string().max(500).optional().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = healthQuestionnaireSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const clinic = await prisma.clinic.findUnique({ where: { slug, isActive: true } })
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 })

    const data = parsed.data

    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({ where: { id: data.patientId, clinicId: clinic.id } })
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

    await prisma.healthQuestionnaire.upsert({
      where: { patientId: data.patientId },
      update: {
        hasHypertension: data.hasHypertension,
        hasDiabetes: data.hasDiabetes,
        hasHeartDisease: data.hasHeartDisease,
        hasBleedingDisorder: data.hasBleedingDisorder,
        isPregnant: data.isPregnant,
        hasAllergies: data.hasAllergies,
        allergiesDetail: data.allergiesDetail || null,
        currentMedications: data.currentMedications || null,
        previousDentalWork: data.previousDentalWork || null,
        chiefComplaint: data.chiefComplaint || null,
      },
      create: {
        patientId: data.patientId,
        hasHypertension: data.hasHypertension,
        hasDiabetes: data.hasDiabetes,
        hasHeartDisease: data.hasHeartDisease,
        hasBleedingDisorder: data.hasBleedingDisorder,
        isPregnant: data.isPregnant,
        hasAllergies: data.hasAllergies,
        allergiesDetail: data.allergiesDetail || null,
        currentMedications: data.currentMedications || null,
        previousDentalWork: data.previousDentalWork || null,
        chiefComplaint: data.chiefComplaint || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Health questionnaire error:", error)
    return NextResponse.json({ error: "Failed to save health questionnaire" }, { status: 500 })
  }
}
