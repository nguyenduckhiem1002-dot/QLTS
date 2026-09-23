import { KeyRound } from "lucide-react";
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
    <main id="main-content" className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <img src="/casla-logo-compact.svg" alt="Casla" />
          <span>{t("app.subtitle")}</span>
        </div>

        <div className="auth-heading">
          <div className="auth-icon"><KeyRound size={20} /></div>
          <div>
            <h1>{t("auth.activateTitle")}</h1>
            <p>{t("auth.activateSubtitle")}</p>
          </div>
        </div>

        {!invitation ? (
          <div className="form-error">{t("auth.invalidInvite")}</div>
        ) : (
          <>
            <div className="invite-identity">
              <strong>{invitation.user.name}</strong>
              <span>{invitation.user.email}</span>
            </div>

            {params.error === "mismatch" ? (
              <div className="form-error">{t("auth.passwordMismatch")}</div>
            ) : params.error === "policy" ? (
              <div className="form-error">{t("auth.passwordPolicy")}</div>
            ) : null}

            <form action={acceptInvitation} className="stack-form auth-form">
              <input type="hidden" name="token" value={token} />
              <label>
                <span>{t("auth.newPassword")}</span>
                <input name="password" type="password" autoComplete="new-password" required />
              </label>
              <label>
                <span>{t("auth.confirmPassword")}</span>
                <input name="confirmPassword" type="password" autoComplete="new-password" required />
              </label>
              <small className="form-hint">{t("auth.passwordPolicy")}</small>
              <button className="button button-primary auth-submit" type="submit">
                {t("auth.activate")}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
