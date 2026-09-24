import { AssetStatus } from "@prisma/client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, Notice } from "@/components/ui";
import { updateAsset } from "@/lib/actions/assets";
import { requirePermission } from "@/lib/auth/session";
import { getAssetForEdit, getAssetFormOptions } from "@/lib/data";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Sửa tài sản" };

const EDITABLE_STATUSES = [
  AssetStatus.AVAILABLE,
  AssetStatus.MAINTENANCE,
  AssetStatus.LOST,
  AssetStatus.DISPOSED,
] as const;

const errorMessages: Record<string, TranslationKey> = {
  required: "assets.required",
  barcode: "assets.barcodeError",
  duplicate: "assets.duplicate",
};

function toDateInput(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const demoMode = isDemoMode();
  const { id } = await params;

  // The permission check runs alongside the data loads instead of before them.
  const [, { t }, asset, options, query] = await Promise.all([
    demoMode ? null : requirePermission("assets:write"),
    getTranslations(),
    getAssetForEdit(id),
    getAssetFormOptions(),
    searchParams,
  ]);

  if (!asset) notFound();

  const error = query.error ? errorMessages[query.error] : undefined;
  const optional = t("common.optional");
  const required = t("common.required");
  const held = Boolean(asset.custodianId);
  const cost = asset.purchaseCost ? Number(asset.purchaseCost).toString() : "";

  return (
    <section className="page page-narrow">
      <header className="page-header">
        <Link className="back-link" href={`/assets/${asset.id}`}>
          <ArrowLeft size={16} aria-hidden="true" />
          {t("common.back")}
        </Link>
        <h1>{t("assets.edit")}</h1>
        <p>
          <span className="mono-inline">{asset.code}</span> {asset.name}
        </p>
      </header>

      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <form action={updateAsset} className="form-card sectioned-form">
        <input type="hidden" name="assetId" value={asset.id} />

        <fieldset className="form-section">
          <legend className="sr-only">{t("assets.basicInfo")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.basicInfo")}</h2>
            <p>{t("assets.basicInfoHelp")}</p>
          </div>
          <div className="form-grid">
            <label>
              <FieldLabel required requiredLabel={required}>{t("assets.code")}</FieldLabel>
              <input
                name="code"
                required
                defaultValue={asset.code}
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                disabled={demoMode}
              />
            </label>
            <label>
              <FieldLabel required requiredLabel={required}>{t("assets.name")}</FieldLabel>
              <input name="name" required defaultValue={asset.name} autoComplete="off" disabled={demoMode} />
            </label>
            <label>
              <FieldLabel optionalLabel={optional}>{t("assets.serial")}</FieldLabel>
              <input
                name="serialNumber"
                defaultValue={asset.serialNumber ?? ""}
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                disabled={demoMode}
              />
            </label>
            <label>
              <FieldLabel optionalLabel={optional}>{t("assets.barcode")}</FieldLabel>
              <input
                name="barcode"
                maxLength={80}
                defaultValue={asset.barcode ?? ""}
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
              <FieldLabel optionalLabel={optional}>{t("assets.category")}</FieldLabel>
              <select name="categoryId" defaultValue={asset.categoryId ?? ""} disabled={demoMode}>
                <option value="">{t("common.notSelected")}</option>
                {options.categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <FieldLabel optionalLabel={optional}>{t("assets.location")}</FieldLabel>
              <select name="locationId" defaultValue={asset.locationId ?? ""} disabled={demoMode}>
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
              <FieldLabel optionalLabel={optional}>{t("assets.purchaseDate")}</FieldLabel>
              <input
                name="purchaseDate"
                type="date"
                defaultValue={toDateInput(asset.purchaseDate)}
                disabled={demoMode}
              />
            </label>
            <label>
              <FieldLabel optionalLabel={optional}>{t("assets.purchaseCost")}</FieldLabel>
              <input
                name="purchaseCost"
                inputMode="numeric"
                pattern="[0-9.,\s]*"
                defaultValue={cost}
                autoComplete="off"
                className="input-mono"
                placeholder="18500000"
                disabled={demoMode}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend className="sr-only">{t("assets.statusSection")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.statusSection")}</h2>
            <p>{t("assets.statusSectionHelp")}</p>
          </div>
          <div className="form-grid">
            <div className="form-span">
              {held ? (
                <p className="inline-callout">
                  {t("assets.statusLocked").replace("{name}", asset.custodian?.name ?? "")}
                </p>
              ) : (
                <fieldset className="choice-group" disabled={demoMode}>
                  <legend className="field-label">{t("assets.status")}</legend>
                  <div className="choice-options">
                    {EDITABLE_STATUSES.map((status) => (
                      <label className="choice-chip" key={status}>
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          defaultChecked={
                            status === asset.status ||
                            (asset.status === AssetStatus.IN_USE && status === AssetStatus.AVAILABLE)
                          }
                        />
                        <span>{t(`status.${status}`)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
            <label className="form-span">
              <FieldLabel optionalLabel={optional}>{t("assets.description")}</FieldLabel>
              <textarea name="description" rows={4} defaultValue={asset.description ?? ""} disabled={demoMode} />
            </label>
          </div>
        </fieldset>

        <div className="form-actions">
          <Link className="button button-secondary" href={`/assets/${asset.id}`}>
            {t("common.cancel")}
          </Link>
          <SubmitButton className="button button-primary" disabled={demoMode} pendingLabel={t("common.saving")}>
            {t("common.saveChanges")}
          </SubmitButton>
        </div>
      </form>
    </section>
  );
}
