import { getSession } from "@/lib/auth";

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;

  const superAdminEnv = process.env.SUPER_ADMIN_EMAILS || "";
  const allowedEmails = superAdminEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length > 0) {
    return allowedEmails.includes(email.toLowerCase());
  }

  // If no SUPER_ADMIN_EMAILS is configured, in development allow authenticated users
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  return false;
}

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !session.user) {
    return null;
  }

  if (!isSuperAdminEmail(session.user.email)) {
    return null;
  }

  return session.user;
}
