import Link from "next/link";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export default async function DashboardPage() {
  const { t, locale } = await getTranslations();

  const [total, inUse, available, maintenance, categories, locations, recent] =
    await Promise.all([
      db.asset.count(),
      db.asset.count({ where: { status: "IN_USE" } }),
      db.asset.count({ where: { status: "AVAILABLE" } }),
      db.asset.count({ where: { status: "MAINTENANCE" } }),
      db.category.count(),
      db.location.count(),
      db.asset.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 7,
      }),
    ]);

  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const max = Math.max(total, 1);

  return (
    <section className="page">
      <header className="page-header dashboard-heading">
        <div>
          <p className="eyebrow">{t("app.name")}</p>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/assets" className="text-action">
          {t("dashboard.viewAll")}
          <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="overview-board" aria-label={t("dashboard.title")}>
        <div className="overview-primary">
          <span className="overview-label">{t("dashboard.total")}</span>
          <strong className="overview-total">{total}</strong>
          <div className="overview-meta">
            <div>
              <strong>{categories}</strong>
              <span>{t("dashboard.categories")}</span>
            </div>
            <div>
              <strong>{locations}</strong>
              <span>{t("dashboard.locations")}</span>
            </div>
          </div>
        </div>

        <div className="status-grid">
          <div className="status-stat">
            <div className="status-stat-heading">
              <span>{t("dashboard.inUse")}</span>
              <strong>{inUse}</strong>
            </div>
            <progress className="status-progress progress-blue" value={inUse} max={max} />
          </div>
          <div className="status-stat">
            <div className="status-stat-heading">
              <span>{t("dashboard.available")}</span>
              <strong>{available}</strong>
            </div>
            <progress className="status-progress progress-green" value={available} max={max} />
          </div>
          <div className="status-stat">
            <div className="status-stat-heading">
              <span>{t("dashboard.maintenance")}</span>
              <strong>{maintenance}</strong>
            </div>
            <progress className="status-progress progress-amber" value={maintenance} max={max} />
          </div>
        </div>
      </section>

      <section className="data-surface recent-panel">
        <div className="surface-heading">
          <div>
            <h2>{t("dashboard.recent")}</h2>
            <span>{recent.length} {t("common.assets")}</span>
          </div>
          <Link href="/assets" className="surface-action">
            {t("dashboard.viewAll")}
          </Link>
        </div>

        <div className="recent-list">
          {recent.map((asset) => (
            <Link href={`/assets/${asset.id}`} className="recent-row" key={asset.id}>
              <div className="recent-identity">
                <span className="mono-code">{asset.code}</span>
                <div>
                  <strong>{asset.name}</strong>
                  <span>
                    {new Intl.DateTimeFormat(dateLocale, {
                      dateStyle: "medium",
                    }).format(asset.updatedAt)}
                  </span>
                </div>
              </div>
              <span className={`status-text status-${asset.status.toLowerCase()}`}>
                <i aria-hidden="true" />
                {t(`status.${asset.status}`)}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
