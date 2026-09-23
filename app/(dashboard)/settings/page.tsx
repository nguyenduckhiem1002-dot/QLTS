import { Database, Languages, Network } from "lucide-react";
import { setLocale } from "@/lib/actions/settings";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const { t, locale } = await getTranslations();

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

          <form action={setLocale} className="segmented-control">
            <button
              name="locale"
              value="vi"
              className={locale === "vi" ? "selected" : ""}
            >
              {t("language.vi")}
            </button>
            <button
              name="locale"
              value="en"
              className={locale === "en" ? "selected" : ""}
            >
              {t("language.en")}
            </button>
          </form>
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
            <strong>{t("settings.navigation")}</strong>
            <span>{t("settings.navigationValue")}</span>
          </div>
        </article>

        <article className="settings-card">
          <div className="settings-card-title">
            <Database size={20} />
            <div>
              <h2>{t("settings.database")}</h2>
              <p>{t("settings.databaseValue")}</p>
            </div>
          </div>
          <span className="architecture-chip">PostgreSQL 16</span>
        </article>
      </div>
    </section>
  );
}
