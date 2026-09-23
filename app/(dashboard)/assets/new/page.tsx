import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createAsset } from "@/lib/actions/assets";
import { getAssetFormOptions } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Thêm tài sản" };

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ t }, params, options] = await Promise.all([
    getTranslations(),
    searchParams,
    getAssetFormOptions(),
  ]);
  const demoMode = isDemoMode();

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
            <input name="code" required autoFocus disabled={demoMode} />
          </label>

          <label>
            <span>{t("assets.name")}</span>
            <input name="name" required disabled={demoMode} />
          </label>

          <label>
            <span>{t("assets.serial")}</span>
            <input name="serialNumber" disabled={demoMode} />
          </label>

          <label>
            <span>{t("assets.category")}</span>
            <select name="categoryId" defaultValue="" disabled={demoMode}>
              <option value="">—</option>
              {options.categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>{t("assets.location")}</span>
            <select name="locationId" defaultValue="" disabled={demoMode}>
              <option value="">—</option>
              {options.locations.map((location) => (
                <option value={location.id} key={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-span">
            <span>{t("assets.description")}</span>
            <textarea name="description" rows={4} disabled={demoMode} />
          </label>
        </div>

        <div className="form-actions">
          <Link className="button button-secondary" href="/assets">
            {t("common.back")}
          </Link>
          <button className="button button-primary" type="submit" disabled={demoMode}>
            {t("common.create")}
          </button>
        </div>
      </form>
    </section>
  );
}
