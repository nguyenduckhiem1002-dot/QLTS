import { db } from "@/lib/db";
import { hashToken } from "@/lib/auth/token";
import { isDemoMode } from "@/lib/runtime";

export async function getInvitationPreview(token: string) {
  if (isDemoMode() || !token) return null;

  const invitation = await db.userInvitation.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      expiresAt: true,
      acceptedAt: true,
      user: {
        select: {
          email: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (
    !invitation ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date() ||
    invitation.user.status !== "INVITED"
  ) {
    return null;
  }

  return invitation;
}
