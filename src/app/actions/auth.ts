"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  deleteSession,
} from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { z } from "zod";

import { Gender } from "@prisma/client";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const registerUserSchema = z
  .object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Last name is required"),
    middleName: z.string().optional(),
    suffix: z.string().optional(),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters"),
    phoneNumber: z.string().min(5, "Phone number is required"),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"], {
      message: "Please select a valid gender",
    }),
    dateOfBirth: z.string().min(1, "Birthdate is required"),
    plan: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function registerUser(formData: FormData) {
  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    middleName: (formData.get("middleName") as string) || undefined,
    suffix: (formData.get("suffix") as string) || undefined,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    phoneNumber: formData.get("phoneNumber") as string,
    gender: formData.get("gender") as string,
    dateOfBirth: formData.get("dateOfBirth") as string,
    plan: (formData.get("plan") as string) || undefined,
  };

  const parsed = registerUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const {
    firstName,
    lastName,
    middleName,
    suffix,
    email,
    password,
    phoneNumber,
    gender,
    dateOfBirth,
    plan,
  } = parsed.data;
  let redirectPath: string | null = null;

  try {
    const existingUser = await prisma.user.findFirst({ where: { email } });
    if (existingUser)
      return { error: "An account with this email already exists." };

    const passwordHash = await hashPassword(password);
    const fullName = [firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ");

    const user = await prisma.user.create({
      data: {
        name: fullName,
        firstName,
        lastName,
        middleName,
        suffix,
        email,
        passwordHash,
        phoneNumber,
        gender: gender as Gender,
        dateOfBirth: new Date(dateOfBirth),
        role: "DENTIST_ADMIN",
      },
    });

    const token = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set("dently_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    redirectPath = plan ? `/clinic/new?plan=${plan}` : "/";
  } catch (error: unknown) {
    console.error("User registration error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}

const registerClinicSchema = z.object({
  clinicName: z.string().min(2, "Clinic name must be at least 2 characters"),
  plan: z.string().optional(),
});

export async function registerClinicForUser(formData: FormData) {
  const raw = {
    clinicName: formData.get("clinicName") as string,
    plan: (formData.get("plan") as string) || undefined,
  };

  const parsed = registerClinicSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { clinicName, plan } = parsed.data;
  let redirectPath: string | null = null;

  try {
    const session = await prisma.session.findUnique({
      // We retrieve user directly using getSession logic
      where: { token: (await cookies()).get("dently_session")?.value || "" },
      include: { user: true },
    });

    if (!session || !session.user) {
      return { error: "Unauthorized. Please sign in." };
    }

    const currentUser = session.user;
    if (currentUser.clinicId) {
      return { error: "You already have an active clinic workspace." };
    }

    let slug = slugify(clinicName);
    const existing = await prisma.clinic.findUnique({ where: { slug } });
    if (existing) slug = slug + "-" + Date.now().toString(36);

    const result = await prisma.$transaction(async (tx) => {
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug,
          plan: plan || "Starter",
          settings: { create: {} },
        },
      });

      await tx.user.update({
        where: { id: currentUser.id },
        data: {
          clinicId: clinic.id,
          role: "DENTIST_ADMIN",
        },
      });

      return clinic;
    });

    redirectPath = `/clinic/${result.slug}/admin`;
  } catch (error: unknown) {
    console.error("Clinic registration error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  clinicSlug: z.string().min(1),
});

export async function loginUser(formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    clinicSlug: formData.get("clinicSlug") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { error: "Invalid credentials." };

  const { email, password, clinicSlug } = parsed.data;

  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`login_${ip}_${email}`, 5, 900000);
  if (!rateCheck.success) {
    const mins = Math.ceil(rateCheck.resetMs / 60000);
    return {
      error: `Too many failed login attempts. Please wait ${mins} minute(s) before trying again.`,
    };
  }

  let redirectPath: string | null = null;

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { slug: clinicSlug },
    });
    if (!clinic) return { error: "Clinic not found." };

    const user = await prisma.user.findUnique({
      where: { email_clinicId: { email, clinicId: clinic.id } },
    });
    if (!user || !user.isActive) return { error: "Invalid email or password." };

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return { error: "Invalid email or password." };

    const token = await createSession(user.id);

    const cookieStore = await cookies();
    cookieStore.set("dently_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    redirectPath = `/clinic/${clinicSlug}/admin`;
  } catch (error: unknown) {
    console.error("Login error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}

export async function logoutUser(clinicSlug: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("dently_session")?.value;
  if (token) await deleteSession(token);
  cookieStore.delete("dently_session");
  redirect(`/clinic/${clinicSlug}/login`);
}

// Global login for SaaS (login page at /login)
export async function loginGlobal(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const ip = await getClientIp();
  const rateCheck = checkRateLimit(`login_${ip}_${email}`, 5, 900000);
  if (!rateCheck.success) {
    const mins = Math.ceil(rateCheck.resetMs / 60000);
    return {
      error: `Too many failed login attempts. Please wait ${mins} minute(s) before trying again.`,
    };
  }

  let redirectPath: string | null = null;

  try {
    // Find ALL users with this email (handles multi-tenant correctly)
    const users = await prisma.user.findMany({
      where: { email, isActive: true },
      include: { clinic: true },
    });

    if (users.length === 0) return { error: "Invalid email or password." };

    // Try to verify password against each matching user
    let matchedUser: (typeof users)[0] | null = null;
    for (const user of users) {
      const valid = await verifyPassword(password, user.passwordHash);
      if (valid) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) return { error: "Invalid email or password." };

    const token = await createSession(matchedUser.id);

    const cookieStore = await cookies();
    cookieStore.set("dently_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    redirectPath = "/";
  } catch (error: unknown) {
    console.error("Login error:", error);
    return { error: "Something went wrong. Please try again." };
  }

  if (redirectPath) {
    redirect(redirectPath);
  }
}

export async function logoutGlobal() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dently_session")?.value;
  if (token) await deleteSession(token);
  cookieStore.delete("dently_session");
  redirect("/login");
}
