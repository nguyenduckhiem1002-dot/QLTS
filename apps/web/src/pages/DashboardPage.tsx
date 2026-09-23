import {
  Boxes,
  CheckCircle2,
  CircleDot,
  MapPin,
  Tags,
  Wrench,
} from "lucide-react";
import { ErrorState, LoadingState } from "../components/PageState";
import { useI18n } from "../i18n";
import { useApi } from "../lib/api";
import type { DashboardSummary } from "../types";

export function DashboardPage() {
  const { t } = useI18n();
  const { data, error, loading } = useApi<DashboardSummary>("/api/dashboard");

  const cards = data
    ? [
        { label: t("dashboard.total"), value: data.total, icon: Boxes },
        { label: t("dashboard.inUse"), value: data.inUse, icon: CircleDot },
        { label: t("dashboard.available"), value: data.available, icon: CheckCircle2 },
        { label: t("dashboard.maintenance"), value: data.maintenance, icon: Wrench },
        { label: t("dashboard.categories"), value: data.categories, icon: Tags },
        { label: t("dashboard.locations"), value: data.locations, icon: MapPin },
      ]
    : [];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("app.name")}</p>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
      </header>

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState /> : null}

      {data ? (
        <>
          <div className="metric-grid">
            {cards.map(({ label, value, icon: Icon }) => (
              <article className="metric-card" key={label}>
                <div className="metric-icon">
                  <Icon size={20} />
                </div>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              </article>
            ))}
          </div>

          <article className="info-panel">
            <div className="info-panel-icon">
              <Boxes size={22} />
            </div>
            <div>
              <h2>{t("dashboard.noteTitle")}</h2>
              <p>{t("dashboard.noteBody")}</p>
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
