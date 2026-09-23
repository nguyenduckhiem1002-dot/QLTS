import { UserRole, UserStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { generateToken, hashToken } from "@/lib/auth/token";
import { isDemoMode } from "@/lib/runtime";

const SESSION_COOKIE = "casla_assets_session";
const SESSION_DAYS = 7;

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
};

const demoUser: CurrentUser = {
  id: "demo-admin",
  email: "demo@casla.local",
  name: "Demo Admin",
  role: UserRole.ADMIN,
  status: UserStatus.ACTIVE,
  mustChangePassword: false,
};

function sessionCookieSecure() {
  return process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase() === "true";
}

export async function createSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.userSession.create({
    data: { tokenHash, userId, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  if (isDemoMode()) return;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.userSession.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDemoMode()) return demoUser;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          mustChangePassword: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date() || session.user.status !== UserStatus.ACTIVE) {
    await db.userSession.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    redirect("/forbidden");
  }
  return user;
}

export async function requireAdmin() {
  return requirePermission("users:manage");
}
