"use server";

import { UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  getCurrentUser,
  requireUser,
} from "@/lib/auth/session";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/token";
import { isDemoMode } from "@/lib/runtime";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function login(formData: FormData) {
  if (isDemoMode()) redirect("/");

  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/login?error=invalid");

  const user = await db.user.findUnique({ where: { email } });

  if (
    !user ||
    user.status !== UserStatus.ACTIVE ||
    !user.passwordHash ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    redirect("/login?error=invalid");
  }

  await createSession(user.id);
  await db.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect(user.mustChangePassword ? "/account/password" : "/");
}

export async function logout() {
  await destroySession();
  redirect(isDemoMode() ? "/" : "/login");
}

export async function changePassword(formData: FormData) {
  const currentUser = await requireUser();
  if (isDemoMode()) redirect("/");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword !== confirmPassword) {
    redirect("/account/password?error=mismatch");
  }

  if (validatePassword(newPassword)) {
    redirect("/account/password?error=policy");
  }

  const user = await db.user.findUnique({ where: { id: currentUser.id } });
  if (
    !user?.passwordHash ||
    !(await verifyPassword(currentPassword, user.passwordHash))
  ) {
    redirect("/account/password?error=current");
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  redirect("/");
}

export async function acceptInvitation(formData: FormData) {
  if (isDemoMode()) redirect("/");

  const token = field(formData, "token");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) redirect("/activate?error=invalid");
  if (password !== confirmPassword) {
    redirect(`/activate?token=${encodeURIComponent(token)}&error=mismatch`);
  }
  if (validatePassword(password)) {
    redirect(`/activate?token=${encodeURIComponent(token)}&error=policy`);
  }

  const invitation = await db.userInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date() ||
    invitation.user.status !== UserStatus.INVITED
  ) {
    redirect("/activate?error=invalid");
  }

  const passwordHash = await hashPassword(password);

  await db.$transaction([
    db.user.update({
      where: { id: invitation.userId },
      data: {
        passwordHash,
        status: UserStatus.ACTIVE,
        mustChangePassword: false,
      },
    }),
    db.userInvitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    }),
  ]);

  await createSession(invitation.userId);
  redirect("/");
}

export async function redirectAuthenticatedUser() {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/account/password" : "/");
}
