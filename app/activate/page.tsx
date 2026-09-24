import { AuthShell } from "@/components/auth-shell";
import { Notice } from "@/components/ui";
import { acceptInvitation } from "@/lib/actions/auth";
import { getInvitationPreview } from "@/lib/auth/invitation";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Kích hoạt tài khoản" };

export default async function ActivatePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getTranslations(), searchParams]);
  const token = params.token ?? "";
  const invitation = await getInvitationPreview(token);

  return (
    <AuthShell title={t("auth.activateTitle")} subtitle={t("auth.activateSubtitle")}>
      {!invitation ? (
        <Notice tone="error">{t("auth.invalidInvite")}</Notice>
      ) : (
        <>
          <div className="auth-identity">
            <strong>{invitation.user.name}</strong>
            <span>{invitation.user.email}</span>
          </div>

          {params.error === "mismatch" ? (
            <Notice tone="error">{t("auth.passwordMismatch")}</Notice>
          ) : params.error === "policy" ? (
            <Notice tone="error">{t("auth.passwordPolicy")}</Notice>
          ) : null}

          <form action={acceptInvitation} className="auth-form">
            <input type="hidden" name="token" value={token} />
            <label className="field">
              <span className="field-label">{t("auth.newPassword")}</span>
              <input name="password" type="password" autoComplete="new-password" required />
            </label>
            <label className="field">
              <span className="field-label">{t("auth.confirmPassword")}</span>
              <input name="confirmPassword" type="password" autoComplete="new-password" required />
            </label>
            <small className="field-hint">{t("auth.passwordPolicy")}</small>
            <button className="btn btn-primary" type="submit">
              {t("auth.activate")}
            </button>
          </form>
        </>
      )}
    </AuthShell>
  );
}
