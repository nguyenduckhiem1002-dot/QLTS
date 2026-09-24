import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ImagePicker } from "@/components/image-picker";
import { SubmitButton } from "@/components/submit-button";
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

  // The permission check runs alongside the data loads instead of before them;
  // it still redirects before anything renders.
  const [, { t }, params, options] = await Promise.all([
    demoMode ? null : requirePermission("assets:write"),
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

  const required = (
    <abbr className="field-required" title={t("common.required")}>
      *
    </abbr>
  );
  const optional = <em className="field-optional">{t("common.optional")}</em>;

  return (
    <section className="page page-narrow">
      <header className="page-header">
        <Link className="back-link" href="/assets">
          <ArrowLeft size={16} aria-hidden="true" />
          {t("common.back")}
        </Link>
        <h1>{t("assets.createTitle")}</h1>
        <p>{t("assets.createSubtitle")}</p>
      </header>

      {errorMessage ? (
        <div className="form-error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <form action={createAsset} className="form-card sectioned-form">
        <fieldset className="form-section">
          <legend className="sr-only">{t("assets.basicInfo")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.basicInfo")}</h2>
            <p>{t("assets.basicInfoHelp")}</p>
          </div>

          <div className="form-grid">
            <label>
              <span className="field-label">
                {t("assets.code")}
                {required}
              </span>
              <input
                name="code"
                required
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                disabled={demoMode}
              />
            </label>

            <label>
              <span className="field-label">
                {t("assets.name")}
                {required}
              </span>
              <input name="name" required autoComplete="off" disabled={demoMode} />
            </label>

            <label>
              <span className="field-label">
                {t("assets.serial")}
                {optional}
              </span>
              <input
                name="serialNumber"
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                disabled={demoMode}
              />
            </label>

            <label>
              <span className="field-label">
                {t("assets.barcode")}
                {optional}
              </span>
              <input
                name="barcode"
                maxLength={80}
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                placeholder={t("assets.barcodePlaceholder")}
                aria-describedby="barcode-help"
                disabled={demoMode}
              />
              <small className="form-hint" id="barcode-help">
                {t("assets.barcodeHelp")}
              </small>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="sr-only">{t("assets.classification")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.classification")}</h2>
            <p>{t("assets.classificationHelp")}</p>
          </div>

          <div className="form-grid">
            <label>
              <span className="field-label">
                {t("assets.category")}
                {optional}
              </span>
              <select name="categoryId" defaultValue="" disabled={demoMode}>
                <option value="">{t("common.notSelected")}</option>
                {options.categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="field-label">
                {t("assets.location")}
                {optional}
              </span>
              <select name="locationId" defaultValue="" disabled={demoMode}>
                <option value="">{t("common.notSelected")}</option>
                {options.locations.map((location) => (
                  <option value={location.id} key={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="sr-only">{t("assets.purchase")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.purchase")}</h2>
            <p>{t("assets.purchaseHelp")}</p>
          </div>

          <div className="form-grid">
            <label>
              <span className="field-label">
                {t("assets.purchaseDate")}
                {optional}
              </span>
              <input name="purchaseDate" type="date" disabled={demoMode} />
            </label>

            <label>
              <span className="field-label">
                {t("assets.purchaseCost")}
                {optional}
              </span>
              <input
                name="purchaseCost"
                inputMode="numeric"
                pattern="[0-9.,s]*"
                autoComplete="off"
                className="input-mono"
                placeholder="18500000"
                disabled={demoMode}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="sr-only">{t("assets.mediaNotes")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.mediaNotes")}</h2>
            <p>{t("assets.mediaNotesHelp")}</p>
          </div>

          <div className="form-grid">
            <div className="form-span">
              <ImagePicker
                name="image"
                disabled={demoMode}
                labels={{
                  label: t("assets.image"),
                  cta: t("assets.imageCta"),
                  help: t("assets.imageHelp"),
                  remove: t("common.remove"),
                  typeError: t("assets.imageTypeError"),
                  sizeError: t("assets.imageSizeError"),
                }}
              />
            </div>

            <label className="form-span">
              <span className="field-label">
                {t("assets.description")}
                {optional}
              </span>
              <textarea name="description" rows={4} disabled={demoMode} />
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <Link className="button button-secondary" href="/assets">
            {t("common.back")}
          </Link>
          <SubmitButton className="button button-primary" disabled={demoMode} pendingLabel={t("common.saving")}>
            {t("common.create")}
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}
