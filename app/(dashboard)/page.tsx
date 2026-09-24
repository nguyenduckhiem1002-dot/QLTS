import Link from "next/link";
import { getDashboardData } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";

export default async function DashboardPage() {
  const [{ t, locale }, data] = await Promise.all([
    getTranslations(),
    getDashboardData(),
  ]);

  const {
    total,
    inUse,
    available,
    maintenance,
    categories,
    locations,
    utilization,
    statusReport,
    categoryReport,
    locationReport,
    recent,
  } = data;

  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const max = Math.max(total, 1);
  const categoryMax = Math.max(...categoryReport.map((item) => item.count), 1);
  const locationMax = Math.max(...locationReport.map((item) => item.count), 1);

  return (
    <section className="page">
      <header className="page-header dashboard-heading">
        <div>
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

      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <h2>{t("dashboard.reports")}</h2>
            <p>{t("dashboard.reportsHelp")}</p>
          </div>
        </div>

        <div className="report-grid">
          <article className="data-surface report-card utilization-card">
            <div className="surface-heading">
              <div>
                <h2>{t("dashboard.utilization")}</h2>
                <span>{t("dashboard.utilizationHelp")}</span>
              </div>
            </div>
            <div className="utilization-value">
              <strong>{utilization}%</strong>
              <span>{inUse} / {total} {t("common.assets")}</span>
            </div>
            <div className="report-track report-track-large">
              <span style={{ width: `${Math.min(utilization, 100)}%` }} />
            </div>
          </article>

          <article className="data-surface report-card">
            <div className="surface-heading">
              <div>
                <h2>{t("dashboard.statusReport")}</h2>
                <span>{t("dashboard.statusReportHelp")}</span>
              </div>
            </div>
            <div className="report-list">
              {statusReport.map((item) => {
                const percentage = total ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div className="report-row" key={item.status}>
                    <div className="report-row-heading">
                      <span>{t(`status.${item.status}`)}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className={`report-track report-track-${item.status.toLowerCase()}`}>
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="data-surface report-card">
            <div className="surface-heading">
              <div>
                <h2>{t("dashboard.categoryReport")}</h2>
                <span>{t("dashboard.categoryReportHelp")}</span>
              </div>
            </div>
            <div className="report-list">
              {categoryReport.length ? (
                categoryReport.map((item) => (
                  <div className="report-row" key={item.name}>
                    <div className="report-row-heading">
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="report-track">
                      <span
                        style={{
                          width: `${Math.round((item.count / categoryMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">{t("common.none")}</div>
              )}
            </div>
          </article>

          <article className="data-surface report-card">
            <div className="surface-heading">
              <div>
                <h2>{t("dashboard.locationReport")}</h2>
                <span>{t("dashboard.locationReportHelp")}</span>
              </div>
            </div>
            <div className="report-list">
              {locationReport.length ? (
                locationReport.map((item) => (
                  <div className="report-row" key={item.name}>
                    <div className="report-row-heading">
                      <span>{item.name}</span>
                      <strong>{item.count}</strong>
                    </div>
                    <div className="report-track">
                      <span
                        style={{
                          width: `${Math.round((item.count / locationMax) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">{t("common.none")}</div>
              )}
            </div>
          </article>
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
