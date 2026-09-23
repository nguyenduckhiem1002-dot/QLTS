import { MapPin } from "lucide-react";
import { ErrorState, LoadingState } from "../components/PageState";
import { useI18n } from "../i18n";
import { useApi } from "../lib/api";
import type { Location } from "../types";

export function LocationsPage() {
  const { t } = useI18n();
  const { data, error, loading } = useApi<Location[]>("/api/locations");

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.locations")}</p>
          <h1>{t("locations.title")}</h1>
          <p>{t("locations.subtitle")}</p>
        </div>
      </header>

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState /> : null}

      {data ? (
        <div className="card-grid">
          {data.map((location) => (
            <article className="entity-card" key={location.id}>
              <div className="location-copy">
                <div className="entity-icon">
                  <MapPin size={19} />
                </div>
                <div>
                  <h2>{location.name}</h2>
                  <p>{t(`location.${location.type}`)}</p>
                  {location.address ? <small>{location.address}</small> : null}
                </div>
              </div>
              <div className="entity-count">
                <strong>{location._count.assets}</strong>
                <span>{t("common.assets")}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
