"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";
import { z } from "zod";
import { sendPlatformEmail, passwordResetEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const requestSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

const resetSchema = z
  .object({
    token: z.string().min(1, "Reset token is required."),
    password: z.string().min(8, "Password must be at least 8 characters long."),
    confirmPassword: z.string().min(8, "Confirm password is required."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function requestPasswordReset(formData: FormData) {
  const ip = await getClientIp();
  const rateLimitKey = `pwd_reset_${ip}`;
  const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000); // 5 attempts per 15 min

  if (!rateCheck.success) {
    const mins = Math.ceil(rateCheck.resetMs / 60000);
    return {
      error: `Too many password reset requests. Please try again in ${mins} minute(s).`,
    };
  }

  const emailRaw = formData.get("email") as string;
  const parsed = requestSchema.safeParse({ email: emailRaw });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      // Invalidate existing tokens for this email
      await prisma.passwordResetToken.deleteMany({
        where: { email },
      });

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          email,
          token,
          expiresAt,
        },
      });

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

      await sendPlatformEmail({
        to: user.email,
        subject: "Reset Your Dently Password",
        html: passwordResetEmail({
          recipientName: user.name,
          resetUrl,
        }),
      });
    }

    // Generic response to prevent account enumeration
    return {
      success: true,
      message:
        "If an account with that email exists, password reset instructions have been sent to your email address.",
    };
  } catch (error) {
    console.error("[Password Reset Request Error]:", error);
    return {
      error: "An unexpected error occurred. Please try again later.",
    };
  }
}

export async function verifyPasswordResetToken(token: string) {
  if (!token) {
    return { valid: false, error: "Missing token." };
  }

  try {
    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) {
      return { valid: false, error: "Invalid or expired reset link." };
    }

    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: record.id } });
      return { valid: false, error: "This password reset link has expired." };
    }

    return { valid: true, email: record.email };
  } catch (error) {
    console.error("[Verify Reset Token Error]:", error);
    return { valid: false, error: "Failed to verify reset token." };
  }
}

export async function resetPasswordWithToken(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const parsed = resetSchema.safeParse({ token, password, confirmPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const tokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token: parsed.data.token },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return {
        error: "This password reset link is invalid or has expired.",
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: tokenRecord.email },
    });

    if (!user) {
      return { error: "User account not found." };
    }

    const newPasswordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction(async (tx) => {
      // Update password
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash },
      });

      // Terminate all existing sessions for this user for security
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      // Delete the used token
      await tx.passwordResetToken.deleteMany({
        where: { email: tokenRecord.email },
      });
    });

    return {
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    };
  } catch (error) {
    console.error("[Reset Password Execution Error]:", error);
    return { error: "Failed to reset password. Please try again." };
  }
}
