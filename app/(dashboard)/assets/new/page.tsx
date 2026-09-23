import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createAsset } from "@/lib/actions/assets";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Thêm tài sản" };

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ t }, params, categories, locations] = await Promise.all([
    getTranslations(),
    searchParams,
    db.category.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <section className="page page-narrow">
      <header className="page-header">
        <Link className="back-link" href="/assets">
          <ArrowLeft size={16} />
          {t("common.back")}
        </Link>
        <h1>{t("assets.createTitle")}</h1>
        <p>{t("assets.createSubtitle")}</p>
      </header>

      {params.error === "duplicate" ? (
        <div className="form-error">{t("assets.duplicate")}</div>
      ) : null}

      <form action={createAsset} className="form-card">
        <div className="form-grid">
          <label>
            <span>{t("assets.code")}</span>
            <input name="code" required autoFocus />
          </label>

          <label>
            <span>{t("assets.name")}</span>
            <input name="name" required />
          </label>

          <label>
            <span>{t("assets.serial")}</span>
            <input name="serialNumber" />
          </label>

          <label>
            <span>{t("assets.category")}</span>
            <select name="categoryId" defaultValue="">
              <option value="">—</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{t("assets.location")}</span>
            <select name="locationId" defaultValue="">
              <option value="">—</option>
              {locations.map((location) => (
                <option value={location.id} key={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-span">
            <span>{t("assets.description")}</span>
            <textarea name="description" rows={4} />
          </label>
        </div>

        <div className="form-actions">
          <Link className="button button-secondary" href="/assets">
            {t("common.back")}
          </Link>
          <button className="button button-primary" type="submit">
            {t("common.create")}
          </button>
        </div>
      </form>
    </section>
  );
}
