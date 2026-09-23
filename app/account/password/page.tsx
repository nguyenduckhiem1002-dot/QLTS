import { redirect } from "next/navigation";
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
  const [user, { t }, params] = await Promise.all([
    requireUser(),
    getTranslations(),
    searchParams,
  ]);

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
    <main id="main-content" className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img src="/casla-logo-compact.svg" alt="Casla" />
          <span>{user.email}</span>
        </div>
        <div className="auth-heading">
          <div>
            <h1>{t("auth.changePasswordTitle")}</h1>
            <p>{t("auth.changePasswordSubtitle")}</p>
          </div>
        </div>

        {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

        <form action={changePassword} className="stack-form auth-form">
          <label>
            <span>{t("auth.currentPassword")}</span>
            <input name="currentPassword" type="password" autoComplete="current-password" required />
          </label>
          <label>
            <span>{t("auth.newPassword")}</span>
            <input name="newPassword" type="password" autoComplete="new-password" required />
          </label>
          <label>
            <span>{t("auth.confirmPassword")}</span>
            <input name="confirmPassword" type="password" autoComplete="new-password" required />
          </label>
          <small className="form-hint">{t("auth.passwordPolicy")}</small>
          <button className="button button-primary auth-submit" type="submit">
            {t("common.save")}
          </button>
        </form>
      </section>
    </main>
  );
}
