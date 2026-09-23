import { MapPin } from "lucide-react";
import { LocationType } from "@prisma/client";
import { createLocation } from "@/lib/actions/reference";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Vị trí" };

export default async function LocationsPage() {
  const [{ t }, locations] = await Promise.all([
    getTranslations(),
    db.location.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

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
        <div className="card-grid">
          {locations.map((location) => (
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

        <form action={createLocation} className="panel compact-form">
          <div className="section-icon">
            <MapPin size={20} />
          </div>
          <h2>{t("locations.create")}</h2>
          <label>
            <span>{t("locations.name")}</span>
            <input name="name" required />
          </label>
          <label>
            <span>{t("locations.type")}</span>
            <select name="type" defaultValue={LocationType.OFFICE}>
              {Object.values(LocationType).map((type) => (
                <option value={type} key={type}>
                  {t(`location.${type}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("locations.address")}</span>
            <input name="address" />
          </label>
          <button className="button button-primary" type="submit">
            {t("common.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
