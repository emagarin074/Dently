import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function generateToken() {
  // Use cryptographically secure random bytes (opaque token, no timestamp leak)
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Clean up any expired sessions for this user
  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  await prisma.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("dently_session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: { include: { clinic: { include: { settings: true } } } } },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

type SessionUser = NonNullable<Awaited<ReturnType<typeof getSession>>>["user"];

export async function requireAuth(clinicSlug: string): Promise<
  | (Omit<SessionUser, "clinicId" | "clinic"> & {
      clinicId: string;
      clinic: NonNullable<SessionUser["clinic"]>;
    })
  | null
>;
export async function requireAuth(): Promise<SessionUser | null>;
export async function requireAuth(
  clinicSlug?: string,
): Promise<SessionUser | null> {
  const session = await getSession();
  if (!session) return null;

  if (clinicSlug) {
    if (!session.user.clinic || session.user.clinic.slug !== clinicSlug)
      return null;
    return session.user;
  }

  return session.user;
}

export async function requireAdminAuth(clinicSlug: string) {
  const user = await requireAuth(clinicSlug);
  if (!user || user.role !== UserRole.DENTIST_ADMIN) return null;
  return user;
}

export async function deleteSession(token: string) {
  await prisma.session.deleteMany({ where: { token } });
}
