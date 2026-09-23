import { Languages, Network } from "lucide-react";
import { useI18n } from "../i18n";

export function SettingsPage() {
  const { locale, setLocale, t } = useI18n();

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.settings")}</p>
          <h1>{t("settings.title")}</h1>
          <p>{t("settings.subtitle")}</p>
        </div>
      </header>

      <div className="settings-stack">
        <article className="settings-card">
          <div className="settings-card-title">
            <Languages size={20} />
            <div>
              <h2>{t("settings.language")}</h2>
              <p>{t("settings.languageHelp")}</p>
            </div>
          </div>

          <div className="segmented-control">
            <button
              className={locale === "vi" ? "selected" : ""}
              onClick={() => setLocale("vi")}
            >
              {t("language.vi")}
            </button>
            <button
              className={locale === "en" ? "selected" : ""}
              onClick={() => setLocale("en")}
            >
              {t("language.en")}
            </button>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-title">
            <Network size={20} />
            <div>
              <h2>{t("settings.architecture")}</h2>
              <p>{t("settings.architectureValue")}</p>
            </div>
          </div>
          <div className="settings-meta">
            <strong>{t("settings.api")}</strong>
            <span>{t("settings.apiValue")}</span>
          </div>
        </article>
      </div>
    </section>
  );
}
