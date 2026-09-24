import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { Notice } from "@/components/ui";
import { changePassword } from "@/lib/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Đổi mật khẩu" };

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { t }, params] = await Promise.all([requireUser(), getTranslations(), searchParams]);

  if (isDemoMode()) redirect("/");

  const errorMessage =
    params.error === "mismatch"
      ? t("auth.passwordMismatch")
      : params.error === "policy"
        ? t("auth.passwordPolicy")
        : params.error === "current"
          ? t("auth.currentPasswordInvalid")
          : null;

  return (
    <AuthShell title={t("auth.changePasswordTitle")} subtitle={t("auth.changePasswordSubtitle")}>
      <div className="auth-identity">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
      </div>

      {errorMessage ? <Notice tone="error">{errorMessage}</Notice> : null}

      <form action={changePassword} className="auth-form">
        <label className="field">
          <span className="field-label">{t("auth.currentPassword")}</span>
          <input name="currentPassword" type="password" autoComplete="current-password" required />
        </label>
        <label className="field">
          <span className="field-label">{t("auth.newPassword")}</span>
          <input name="newPassword" type="password" autoComplete="new-password" required />
        </label>
        <label className="field">
          <span className="field-label">{t("auth.confirmPassword")}</span>
          <input name="confirmPassword" type="password" autoComplete="new-password" required />
        </label>
        <small className="field-hint">{t("auth.passwordPolicy")}</small>
        <button className="btn btn-primary" type="submit">
          {t("common.save")}
        </button>
      </form>
    </AuthShell>
  );
}
