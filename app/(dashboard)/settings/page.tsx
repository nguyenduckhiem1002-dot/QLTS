import Link from "next/link";
import { StatusText } from "@/components/ui";
import { setLocale } from "@/lib/actions/settings";
import { getTranslations } from "@/lib/i18n";
import { isSmtpConfigured } from "@/lib/mail";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const { t, locale } = await getTranslations();
  const smtpReady = isSmtpConfigured();

  return (
    <section className="page page-narrow">
      <header className="page-head">
        <div>
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>
      </header>

      <div className="surface">
        <div className="settings-row">
          <div>
            <h2>{t("settings.language")}</h2>
            <p>{t("settings.languageHelp")}</p>
          </div>
          <form action={setLocale} className="settings-value">
            <div className="seg">
              <button name="locale" value="vi" aria-pressed={locale === "vi"}>
                {t("language.vi")}
              </button>
              <button name="locale" value="en" aria-pressed={locale === "en"}>
                {t("language.en")}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-row">
          <div>
            <h2>{t("settings.email")}</h2>
            <p>{t("settings.emailHelp")}</p>
          </div>
          <div className="settings-value">
            <StatusText
              status={smtpReady ? "ACTIVE" : "MAINTENANCE"}
              label={smtpReady ? t("settings.smtpReady") : t("settings.smtpMissing")}
            />
            <span>{smtpReady ? process.env.SMTP_HOST : t("settings.smtpHow")}</span>
          </div>
        </div>

        {isDemoMode() ? null : (
          <div className="settings-row">
            <div>
              <h2>{t("settings.account")}</h2>
              <p>{t("settings.accountHelp")}</p>
            </div>
            <div className="settings-value">
              <Link className="btn" href="/account/password">
                {t("auth.changePasswordTitle")}
              </Link>
            </div>
          </div>
        )}

        <div className="settings-row">
          <div>
            <h2>{t("settings.database")}</h2>
            <p>{t("settings.databaseValue")}</p>
          </div>
          <div className="settings-value">
            <span className="quiet-tag">PostgreSQL 16</span>
          </div>
        </div>
      </div>
    </section>
  );
}
