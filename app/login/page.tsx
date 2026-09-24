import { AuthShell } from "@/components/auth-shell";
import { Notice } from "@/components/ui";
import { login, redirectAuthenticatedUser } from "@/lib/actions/auth";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await redirectAuthenticatedUser();
  const [{ t }, params] = await Promise.all([getTranslations(), searchParams]);

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      {params.error ? <Notice tone="error">{t("auth.invalid")}</Notice> : null}
      <form action={login} className="auth-form">
        <label className="field">
          <span className="field-label">{t("auth.email")}</span>
          <input name="email" type="email" autoComplete="username" required autoFocus />
        </label>
        <label className="field">
          <span className="field-label">{t("auth.password")}</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn btn-primary" type="submit">
          {t("auth.login")}
        </button>
      </form>
      <p className="field-hint">{t("auth.noAccount")}</p>
    </AuthShell>
  );
}
