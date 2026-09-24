"use server";

import { UserRole, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clearSessionCache, requireAdmin } from "@/lib/auth/session";
import { generateToken, hashToken } from "@/lib/auth/token";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import {
  isSmtpConfigured,
  sendAccountCreatedEmail,
  sendInvitationEmail,
  sendSmtpTestEmail,
} from "@/lib/mail";
import { isDemoMode } from "@/lib/runtime";

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function roleFromForm(formData: FormData) {
  const role = field(formData, "role") as UserRole;
  return Object.values(UserRole).includes(role) ? role : UserRole.VIEWER;
}

async function ensureNotRemovingLastAdmin(userId: string, nextAdminState: boolean) {
  if (nextAdminState) return;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true },
  });

  if (!target || target.role !== UserRole.ADMIN || target.status !== UserStatus.ACTIVE) {
    return;
  }

  const otherAdmins = await db.user.count({
    where: {
      id: { not: userId },
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  if (otherAdmins === 0) {
    redirect("/users?error=last_admin");
  }
}

export async function createUserAccount(formData: FormData) {
  const actor = await requireAdmin();
  if (isDemoMode()) redirect("/users?error=readonly");

  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const role = roleFromForm(formData);
  const mode = field(formData, "provisionMode") === "direct" ? "direct" : "invite";

  if (!name || !email) redirect("/users?error=required");

  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) redirect("/users?error=duplicate");

  if (mode === "invite") {
    if (!isSmtpConfigured()) redirect("/users?error=smtp_missing");

    const rawToken = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await db.user.create({
      data: {
        name,
        email,
        role,
        status: UserStatus.INVITED,
        invitations: {
          create: {
            tokenHash: hashToken(rawToken),
            expiresAt,
          },
        },
      },
    });

    try {
      await sendInvitationEmail({ name, email, token: rawToken });
    } catch (error) {
      console.error("Failed to send invitation email", error);
      await db.user.delete({ where: { id: user.id } });
      redirect("/users?error=smtp_send");
    }

    await db.auditLog.create({
      data: {
        entityType: "User",
        entityId: user.id,
        action: "INVITE",
        actor: actor.email,
        payload: { email, role },
      },
    });

    redirect("/users?success=invited");
  }

  const password = String(formData.get("password") ?? "");
  if (validatePassword(password)) redirect("/users?error=password_policy");

  const user = await db.user.create({
    data: {
      name,
      email,
      role,
      status: UserStatus.ACTIVE,
      passwordHash: await hashPassword(password),
      mustChangePassword: true,
    },
  });

  await db.auditLog.create({
    data: {
      entityType: "User",
      entityId: user.id,
      action: "CREATE_DIRECT",
      actor: actor.email,
      payload: { email, role },
    },
  });

  if (isSmtpConfigured()) {
    try {
      await sendAccountCreatedEmail({ name, email });
    } catch (error) {
      console.error("Account created but notification email failed", error);
    }
  }

  redirect("/users?success=created");
}

export async function resendInvitation(formData: FormData) {
  await requireAdmin();
  if (isDemoMode()) redirect("/users?error=readonly");
  if (!isSmtpConfigured()) redirect("/users?error=smtp_missing");

  const userId = field(formData, "userId");
  const user = await db.user.findUnique({ where: { id: userId } });

  if (!user || user.status !== UserStatus.INVITED) {
    redirect("/users?error=invalid_user");
  }

  const rawToken = generateToken();
  const invitation = await db.userInvitation.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  try {
    await sendInvitationEmail({
      email: user.email,
      name: user.name,
      token: rawToken,
    });
  } catch (error) {
    console.error("Failed to resend invitation", error);
    await db.userInvitation.delete({ where: { id: invitation.id } });
    redirect("/users?error=smtp_send");
  }

  redirect("/users?success=resent");
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireAdmin();
  if (isDemoMode()) redirect("/users?error=readonly");

  const userId = field(formData, "userId");
  const role = roleFromForm(formData);

  if (userId === actor.id && role !== UserRole.ADMIN) {
    redirect("/users?error=self_role");
  }

  await ensureNotRemovingLastAdmin(userId, role === UserRole.ADMIN);

  await db.user.update({
    where: { id: userId },
    data: { role },
  });
  clearSessionCache(userId);

  redirect("/users?success=role");
}

export async function toggleUserStatus(formData: FormData) {
  const actor = await requireAdmin();
  if (isDemoMode()) redirect("/users?error=readonly");

  const userId = field(formData, "userId");
  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) redirect("/users?error=invalid_user");

  const nextStatus =
    target.status === UserStatus.DISABLED ? UserStatus.ACTIVE : UserStatus.DISABLED;

  if (userId === actor.id && nextStatus === UserStatus.DISABLED) {
    redirect("/users?error=self_disable");
  }

  await ensureNotRemovingLastAdmin(
    userId,
    target.role === UserRole.ADMIN && nextStatus === UserStatus.ACTIVE,
  );

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { status: nextStatus },
    }),
    ...(nextStatus === UserStatus.DISABLED
      ? [db.userSession.deleteMany({ where: { userId } })]
      : []),
  ]);
  clearSessionCache(userId);

  redirect("/users?success=status");
}

export async function testSmtp() {
  const actor = await requireAdmin();
  if (isDemoMode()) redirect("/users?error=readonly");
  if (!isSmtpConfigured()) redirect("/users?error=smtp_missing");

  try {
    await sendSmtpTestEmail(actor.email);
  } catch (error) {
    console.error("SMTP test failed", error);
    redirect("/users?error=smtp_send");
  }

  redirect("/users?success=smtp");
}
