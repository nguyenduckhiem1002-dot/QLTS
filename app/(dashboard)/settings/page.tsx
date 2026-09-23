import { setLocale } from "@/lib/actions/settings";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const { t, locale } = await getTranslations();

  return (
    <section className="page page-narrow">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.settings")}</p>
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>
      </header>

      <section className="settings-surface">
        <div className="settings-row">
          <div>
            <h2>{t("settings.language")}</h2>
            <p>{t("settings.languageHelp")}</p>
          </div>
          <form action={setLocale} className="segmented-control">
            <button
              name="locale"
              value="vi"
              className={locale === "vi" ? "selected" : ""}
              aria-pressed={locale === "vi"}
            >
              {t("language.vi")}
            </button>
            <button
              name="locale"
              value="en"
              className={locale === "en" ? "selected" : ""}
              aria-pressed={locale === "en"}
            >
              {t("language.en")}
            </button>
          </form>
        </div>

        <div className="settings-row">
          <div>
            <h2>{t("settings.architecture")}</h2>
            <p>{t("settings.architectureValue")}</p>
          </div>
          <div className="settings-meta">
            <strong>{t("settings.navigation")}</strong>
            <span>{t("settings.navigationValue")}</span>
          </div>
        </div>

        <div className="settings-row">
          <div>
            <h2>{t("settings.database")}</h2>
            <p>{t("settings.databaseValue")}</p>
          </div>
          <span className="quiet-tag quiet-tag-strong">PostgreSQL 16</span>
        </div>
      </section>
    </section>
  );
}
