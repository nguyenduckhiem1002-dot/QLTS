import { UserRole, UserStatus } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
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

/*
 * Short-lived in-process cache of validated sessions, keyed by token hash.
 * Every page and server action needs the current user, and with a remote
 * database each lookup is a full round trip. Entries live at most
 * SESSION_CACHE_MS and are dropped whenever a user's session, role, status or
 * password changes (see clearSessionCache callers).
 */
const SESSION_CACHE_MS = 30_000;
const SESSION_CACHE_MAX = 500;

type CachedSession = { user: CurrentUser; expiresAt: number };

const globalForSessions = globalThis as unknown as {
  qltsSessionCache?: Map<string, CachedSession>;
};
const sessionCache = (globalForSessions.qltsSessionCache ??= new Map());

export function clearSessionCache(userId?: string) {
  if (!userId) {
    sessionCache.clear();
    return;
  }
  for (const [key, entry] of sessionCache) {
    if (entry.user.id === userId) sessionCache.delete(key);
  }
}

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
    const tokenHash = hashToken(token);
    sessionCache.delete(tokenHash);
    await db.userSession.deleteMany({
      where: { tokenHash },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

// Memoized per request: the layout and the page both need the user.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (isDemoMode()) return demoUser;

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const cached = sessionCache.get(tokenHash);
  if (cached && cached.expiresAt > Date.now()) return cached.user;
  if (cached) sessionCache.delete(tokenHash);

  const session = await db.userSession.findUnique({
    where: { tokenHash },
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

  if (sessionCache.size >= SESSION_CACHE_MAX) sessionCache.clear();
  sessionCache.set(tokenHash, {
    user: session.user,
    expiresAt: Math.min(Date.now() + SESSION_CACHE_MS, session.expiresAt.getTime()),
  });

  return session.user;
});

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
