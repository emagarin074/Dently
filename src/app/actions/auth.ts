"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword, createSession, deleteSession } from "@/lib/auth"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const registerSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  yourName: z.string().min(2, "Your name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function registerClinic(formData: FormData) {
  const raw = {
    clinicName: formData.get("clinicName") as string,
    yourName: formData.get("yourName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const { clinicName, yourName, email, password } = parsed.data
  let redirectPath: string | null = null

  try {
    let slug = slugify(clinicName)
    const existing = await prisma.clinic.findUnique({ where: { slug } })
    if (existing) slug = slug + "-" + Date.now().toString(36)

    const existingUser = await prisma.user.findFirst({ where: { email } })
    if (existingUser) return { error: "An account with this email already exists." }

    const passwordHash = await hashPassword(password)

    const clinic = await prisma.clinic.create({
      data: {
        name: clinicName,
        slug,
        settings: { create: {} },
        users: {
          create: {
            name: yourName,
            email,
            passwordHash,
            role: "DENTIST_ADMIN",
          },
        },
      },
      include: { users: true },
    })

    const user = clinic.users[0]
    const token = await createSession(user.id)

    const cookieStore = await cookies()
    cookieStore.set("dently_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    redirectPath = `/clinic/${slug}/admin`
  } catch (error: unknown) {
    console.error("Registration error:", error)
    return { error: "Something went wrong. Please try again." }
  }

  if (redirectPath) {
    redirect(redirectPath)
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  clinicSlug: z.string().min(1),
})

export async function loginUser(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    clinicSlug: formData.get("clinicSlug") as string,
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) return { error: "Invalid credentials." }

  const { email, password, clinicSlug } = parsed.data
  let redirectPath: string | null = null

  try {
    const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } })
    if (!clinic) return { error: "Clinic not found." }

    const user = await prisma.user.findUnique({ where: { email_clinicId: { email, clinicId: clinic.id } } })
    if (!user || !user.isActive) return { error: "Invalid email or password." }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) return { error: "Invalid email or password." }

    const token = await createSession(user.id)

    const cookieStore = await cookies()
    cookieStore.set("dently_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    redirectPath = `/clinic/${clinicSlug}/admin`
  } catch (error: unknown) {
    console.error("Login error:", error)
    return { error: "Something went wrong. Please try again." }
  }

  if (redirectPath) {
    redirect(redirectPath)
  }
}

export async function logoutUser(clinicSlug: string) {
  const cookieStore = await cookies()
  const token = cookieStore.get("dently_session")?.value
  if (token) await deleteSession(token)
  cookieStore.delete("dently_session")
  redirect(`/clinic/${clinicSlug}/login`)
}

// Global login for SaaS (login page at /login)
export async function loginGlobal(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) return { error: "Email and password are required." }

  let redirectPath: string | null = null

  try {
    // Find ALL users with this email (handles multi-tenant correctly)
    const users = await prisma.user.findMany({
      where: { email, isActive: true },
      include: { clinic: true },
    })

    if (users.length === 0) return { error: "Invalid email or password." }

    // Try to verify password against each matching user
    let matchedUser: typeof users[0] | null = null
    for (const user of users) {
      const valid = await verifyPassword(password, user.passwordHash)
      if (valid) {
        matchedUser = user
        break
      }
    }

    if (!matchedUser) return { error: "Invalid email or password." }

    const token = await createSession(matchedUser.id)

    const cookieStore = await cookies()
    cookieStore.set("dently_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    })

    redirectPath = `/clinic/${matchedUser.clinic.slug}/admin`
  } catch (error: unknown) {
    console.error("Login error:", error)
    return { error: "Something went wrong. Please try again." }
  }

  if (redirectPath) {
    redirect(redirectPath)
  }
}
