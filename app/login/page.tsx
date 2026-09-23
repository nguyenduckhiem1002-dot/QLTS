import { LockKeyhole } from "lucide-react";
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
    <main id="main-content" className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img src="/casla-logo-compact.svg" alt="Casla" />
          <span>{t("app.subtitle")}</span>
        </div>

        <div className="auth-heading">
          <div className="auth-icon"><LockKeyhole size={20} /></div>
          <div>
            <h1>{t("auth.loginTitle")}</h1>
            <p>{t("auth.loginSubtitle")}</p>
          </div>
        </div>

        {params.error ? (
          <div className="form-error">{t("auth.invalid")}</div>
        ) : null}

        <form action={login} className="stack-form auth-form">
          <label>
            <span>{t("auth.email")}</span>
            <input name="email" type="email" autoComplete="username" required autoFocus />
          </label>
          <label>
            <span>{t("auth.password")}</span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className="button button-primary auth-submit" type="submit">
            {t("auth.login")}
          </button>
        </form>
      </section>
    </main>
  );
}
