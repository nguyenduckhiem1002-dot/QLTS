import { ArrowLeft, ImagePlus, ScanBarcode } from "lucide-react";
import Link from "next/link";
import { createAsset } from "@/lib/actions/assets";
import { requirePermission } from "@/lib/auth/session";
import { getAssetFormOptions } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Thêm tài sản" };

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const demoMode = isDemoMode();
  if (!demoMode) await requirePermission("assets:write");

  const [{ t }, params, options] = await Promise.all([
    getTranslations(),
    searchParams,
    getAssetFormOptions(),
  ]);

  const errorMessage =
    params.error === "duplicate"
      ? t("assets.duplicate")
      : params.error === "image_type"
        ? t("assets.imageTypeError")
        : params.error === "image_size"
          ? t("assets.imageSizeError")
          : params.error === "barcode"
            ? t("assets.barcodeError")
            : params.error === "required"
              ? t("assets.required")
              : null;

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

      {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

      <form action={createAsset} className="form-card asset-create-form">
        <div className="form-section-heading">
          <div>
            <span className="form-kicker">{t("assets.identity")}</span>
            <h2>{t("assets.basicInfo")}</h2>
          </div>
        </div>

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
            <span className="label-with-icon">
              <ScanBarcode size={14} aria-hidden="true" />
              {t("assets.barcode")}
            </span>
            <input
              name="barcode"
              maxLength={80}
              placeholder={t("assets.barcodePlaceholder")}
              disabled={demoMode}
            />
            <small className="form-hint">{t("assets.barcodeHelp")}</small>
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

          <label className="form-span asset-image-field">
            <span className="label-with-icon">
              <ImagePlus size={14} aria-hidden="true" />
              {t("assets.image")}
            </span>
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={demoMode}
            />
            <small className="form-hint">{t("assets.imageHelp")}</small>
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
