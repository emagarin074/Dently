"use server"

import { prisma } from "@/lib/prisma"
import { requireAdminAuth } from "@/lib/auth"
import { hashPassword } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["DENTIST_ADMIN", "ASSISTANT"]),
  phoneNumber: z.string().optional(),
  licenseNumber: z.string().optional(),
  specialization: z.string().optional(),
})

export async function createUser(clinicSlug: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const parsed = userSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const password = formData.get("password") as string
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters" }

  try {
    const existing = await prisma.user.findUnique({
      where: { email_clinicId: { email: parsed.data.email, clinicId: user.clinicId } },
    })
    if (existing) return { error: "A user with this email already exists in this clinic." }

    const passwordHash = await hashPassword(password)

    await prisma.user.create({
      data: {
        clinicId: user.clinicId,
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash,
        phoneNumber: parsed.data.phoneNumber || null,
        licenseNumber: parsed.data.licenseNumber || null,
        specialization: parsed.data.specialization || null,
      },
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/users`)
    return { success: true }
  } catch (error) {
    console.error("Create user error:", error)
    return { error: "Failed to create user." }
  }
}

export async function toggleUserActive(clinicSlug: string, userId: string, isActive: boolean) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }
  if (user.id === userId) return { error: "Cannot deactivate yourself" }

  try {
    await prisma.user.update({ where: { id: userId, clinicId: user.clinicId }, data: { isActive } })
    revalidatePath(`/clinic/${clinicSlug}/admin/users`)
    return { success: true }
  } catch (error) {
    console.error("Toggle user active error:", error)
    return { error: "Failed to update user status." }
  }
}

export async function resetUserPassword(clinicSlug: string, userId: string, newPassword: string) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  if (newPassword.length < 8) return { error: "Password must be at least 8 characters" }

  try {
    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({ where: { id: userId, clinicId: user.clinicId }, data: { passwordHash } })
    return { success: true }
  } catch (error) {
    console.error("Reset user password error:", error)
    return { error: "Failed to reset password." }
  }
}

export async function updateUser(clinicSlug: string, userId: string, formData: FormData) {
  const user = await requireAdminAuth(clinicSlug)
  if (!user) return { error: "Unauthorized" }

  const raw = Object.fromEntries(formData.entries())
  const parsed = userSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  try {
    await prisma.user.update({
      where: { id: userId, clinicId: user.clinicId },
      data: {
        name: parsed.data.name,
        role: parsed.data.role,
        phoneNumber: parsed.data.phoneNumber || null,
        licenseNumber: parsed.data.licenseNumber || null,
        specialization: parsed.data.specialization || null,
      },
    })

    revalidatePath(`/clinic/${clinicSlug}/admin/users`)
    return { success: true }
  } catch (error) {
    console.error("Update user error:", error)
    return { error: "Failed to update user." }
  }
}
