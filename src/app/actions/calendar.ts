"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { BlockType } from "@prisma/client"

const VALID_BLOCK_TYPES: string[] = Object.values(BlockType)

export async function createCalendarBlock(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  const title = formData.get("title") as string
  const type = (formData.get("type") as string) || "CLINIC_CLOSED"
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string

  if (!title) return { error: "Title is required" }
  if (!startDate || !endDate) return { error: "Start and end dates are required" }
  if (!VALID_BLOCK_TYPES.includes(type)) return { error: "Invalid block type." }

  try {
    await prisma.calendarBlock.create({
      data: {
        clinicId: user.clinicId,
        title,
        type: type as BlockType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        dentistId: (formData.get("dentistId") as string) || null,
        notes: (formData.get("notes") as string) || null,
      },
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/calendar`)
    return { success: true }
  } catch (error) {
    console.error("Create calendar block error:", error)
    return { error: "Failed to create calendar block." }
  }
}

export async function deleteCalendarBlock(clinicSlug: string, blockId: string) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  try {
    await prisma.calendarBlock.delete({ where: { id: blockId, clinicId: user.clinicId } })
    revalidatePath(`/clinic/${clinicSlug}/admin/calendar`)
    return { success: true }
  } catch (error) {
    console.error("Delete calendar block error:", error)
    return { error: "Failed to delete calendar block." }
  }
}
