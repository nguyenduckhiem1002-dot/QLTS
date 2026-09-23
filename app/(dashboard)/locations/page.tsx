import { LocationType } from "@prisma/client";
import { createLocation } from "@/lib/actions/reference";
import { getLocations } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Vị trí" };

export default async function LocationsPage() {
  const [{ t }, locations] = await Promise.all([
    getTranslations(),
    getLocations(),
  ]);
  const demoMode = isDemoMode();

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.locations")}</p>
          <h1>{t("locations.title")}</h1>
          <p>{t("locations.subtitle")}</p>
        </div>
      </header>

      <div className="split-layout">
        <section className="collection-surface" aria-label={t("locations.title")}>
          <div className="collection-heading">
            <span>{t("locations.name")}</span>
            <span>{t("locations.assetCount")}</span>
          </div>

          {locations.map((location) => (
            <article className="collection-row" key={location.id}>
              <div>
                <div className="collection-title-line">
                  <h2>{location.name}</h2>
                  <span className="quiet-tag">{t(`location.${location.type}`)}</span>
                </div>
                <p>{location.address ?? t("common.none")}</p>
              </div>
              <strong className="collection-count">{location._count.assets}</strong>
            </article>
          ))}

          {locations.length === 0 ? (
            <div className="empty-state">{t("common.none")}</div>
          ) : null}
        </section>

        <form action={createLocation} className="panel compact-form">
          <div className="form-intro">
            <span className="form-kicker">{t("nav.locations")}</span>
            <h2>{t("locations.create")}</h2>
          </div>
          <label>
            <span>{t("locations.name")}</span>
            <input name="name" required disabled={demoMode} />
          </label>
          <label>
            <span>{t("locations.type")}</span>
            <select name="type" defaultValue={LocationType.OFFICE} disabled={demoMode}>
              {Object.values(LocationType).map((type) => (
                <option value={type} key={type}>
                  {t(`location.${type}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("locations.address")}</span>
            <input name="address" disabled={demoMode} />
          </label>
          <button className="button button-primary" type="submit" disabled={demoMode}>
            {t("common.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
