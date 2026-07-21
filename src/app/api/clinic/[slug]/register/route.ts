import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const registerPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  middleName: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  address: z.string().max(500).optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(20).optional().nullable(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = registerPatientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const clinic = await prisma.clinic.findUnique({ where: { slug, isActive: true } })
    if (!clinic) return NextResponse.json({ error: "Clinic not found" }, { status: 404 })

    const data = parsed.data
    const patient = await prisma.patient.create({
      data: {
        clinicId: clinic.id,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        bloodType: data.bloodType || null,
        emergencyContactName: data.emergencyContactName || null,
        emergencyContactPhone: data.emergencyContactPhone || null,
      },
    })
    return NextResponse.json({ patientId: patient.id })
  } catch (error) {
    console.error("Register patient error:", error)
    return NextResponse.json({ error: "Failed to create patient" }, { status: 500 })
  }
}
