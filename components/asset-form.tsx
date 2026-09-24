import { AssetStatus } from "@prisma/client";
import Link from "next/link";
import { ImagePicker } from "@/components/image-picker";
import { LabelPreview } from "@/components/label-preview";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel } from "@/components/ui";
import type { TranslationKey } from "@/lib/i18n";

const EDITABLE_STATUSES = [
  AssetStatus.AVAILABLE,
  AssetStatus.MAINTENANCE,
  AssetStatus.LOST,
  AssetStatus.DISPOSED,
] as const;

type Option = { id: string; name: string };

export type AssetFormValues = {
  id: string;
  code: string;
  name: string;
  serialNumber: string | null;
  barcode: string | null;
  description: string | null;
  status: AssetStatus;
  categoryId: string | null;
  locationId: string | null;
  custodianId: string | null;
  purchaseDate: Date | null;
  purchaseCost: unknown;
  custodian: { name: string } | null;
};

function toDateInput(date: Date | null) {
  if (!date) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

// Shared by "new" and "edit": same sections, same label preview.
export function AssetForm({
  t,
  action,
  asset,
  options,
  disabled,
  cancelHref,
}: {
  t: (key: TranslationKey) => string;
  action: (formData: FormData) => void;
  asset?: AssetFormValues;
  options: { categories: Option[]; locations: Option[] };
  disabled: boolean;
  cancelHref: string;
}) {
  const optional = t("common.optional");
  const required = t("common.required");
  const formId = asset ? `asset-form-${asset.id}` : "asset-form-new";
  const cost = asset?.purchaseCost ? Number(asset.purchaseCost).toString() : "";

  return (
    <div className="form-layout">
      <form id={formId} action={action} className="surface form-surface">
        {asset ? <input type="hidden" name="assetId" value={asset.id} /> : null}

        <fieldset className="form-section" disabled={disabled}>
          <legend className="sr-only">{t("assets.basicInfo")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.basicInfo")}</h2>
            <p>{t("assets.basicInfoHelp")}</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <FieldLabel required requiredLabel={required}>{t("assets.code")}</FieldLabel>
              <input
                name="code"
                required
                autoFocus={!asset}
                defaultValue={asset?.code}
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                placeholder="TS-IT-0001"
              />
            </label>
            <label className="field">
              <FieldLabel required requiredLabel={required}>{t("assets.name")}</FieldLabel>
              <input name="name" required defaultValue={asset?.name} autoComplete="off" />
            </label>
            <label className="field">
              <FieldLabel optionalLabel={optional}>{t("assets.serial")}</FieldLabel>
              <input
                name="serialNumber"
                defaultValue={asset?.serialNumber ?? ""}
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
              />
            </label>
            <label className="field">
              <FieldLabel optionalLabel={optional}>{t("assets.barcode")}</FieldLabel>
              <input
                name="barcode"
                maxLength={80}
                defaultValue={asset?.barcode ?? ""}
                autoComplete="off"
                spellCheck={false}
                className="input-mono"
                placeholder={t("assets.barcodePlaceholder")}
                aria-describedby={`${formId}-barcode-help`}
              />
              <small className="field-hint" id={`${formId}-barcode-help`}>
                {t("assets.barcodeHelp")}
              </small>
            </label>
          </div>
        </fieldset>

        <fieldset className="form-section" disabled={disabled}>
          <legend className="sr-only">{t("assets.classification")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.classification")}</h2>
            <p>{t("assets.classificationHelp")}</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <FieldLabel optionalLabel={optional}>{t("assets.category")}</FieldLabel>
              <select name="categoryId" defaultValue={asset?.categoryId ?? ""}>
                <option value="">{t("common.notSelected")}</option>
                {options.categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <FieldLabel optionalLabel={optional}>{t("assets.location")}</FieldLabel>
              <select name="locationId" defaultValue={asset?.locationId ?? ""}>
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

        <fieldset className="form-section" disabled={disabled}>
          <legend className="sr-only">{t("assets.purchase")}</legend>
          <div className="form-section-intro" aria-hidden="true">
            <h2>{t("assets.purchase")}</h2>
            <p>{t("assets.purchaseHelp")}</p>
          </div>
          <div className="form-grid">
            <label className="field">
              <FieldLabel optionalLabel={optional}>{t("assets.purchaseDate")}</FieldLabel>
              <input name="purchaseDate" type="date" defaultValue={toDateInput(asset?.purchaseDate ?? null)} />
            </label>
            <label className="field">
              <FieldLabel optionalLabel={optional}>{t("assets.purchaseCost")}</FieldLabel>
              <input
                name="purchaseCost"
                inputMode="numeric"
                pattern="[0-9.,\s]*"
                defaultValue={cost}
                autoComplete="off"
                className="input-mono"
                placeholder="18.500.000"
              />
            </label>
          </div>
        </fieldset>

        {asset ? (
          <fieldset className="form-section" disabled={disabled}>
            <legend className="sr-only">{t("assets.statusSection")}</legend>
            <div className="form-section-intro" aria-hidden="true">
              <h2>{t("assets.statusSection")}</h2>
              <p>{t("assets.statusSectionHelp")}</p>
            </div>
            <div className="form-grid">
              <div className="form-span">
                {asset.custodianId ? (
                  <p className="inline-callout">
                    {t("assets.statusLocked").replace("{name}", asset.custodian?.name ?? "")}
                  </p>
                ) : (
                  <fieldset className="choice-group">
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
              <label className="field form-span">
                <FieldLabel optionalLabel={optional}>{t("assets.description")}</FieldLabel>
                <textarea name="description" rows={4} defaultValue={asset.description ?? ""} />
              </label>
            </div>
          </fieldset>
        ) : (
          <fieldset className="form-section" disabled={disabled}>
            <legend className="sr-only">{t("assets.mediaNotes")}</legend>
            <div className="form-section-intro" aria-hidden="true">
              <h2>{t("assets.mediaNotes")}</h2>
              <p>{t("assets.mediaNotesHelp")}</p>
            </div>
            <div className="form-grid">
              <div className="form-span">
                <ImagePicker
                  name="image"
                  disabled={disabled}
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
              <label className="field form-span">
                <FieldLabel optionalLabel={optional}>{t("assets.description")}</FieldLabel>
                <textarea name="description" rows={4} placeholder={t("assets.descriptionPlaceholder")} />
              </label>
            </div>
          </fieldset>
        )}

        <div className="form-footer">
          <Link className="btn" href={cancelHref}>
            {t("common.cancel")}
          </Link>
          <SubmitButton disabled={disabled} pendingLabel={t("common.saving")}>
            {asset ? t("common.saveChanges") : t("assets.save")}
          </SubmitButton>
        </div>
      </form>

      <aside className="form-aside" aria-label={t("assets.labelPreview")}>
        <h2>{t("assets.labelPreview")}</h2>
        <LabelPreview
          formId={formId}
          owner={t("assets.tagOwner")}
          placeholderCode="TS-..."
          placeholderName={t("assets.name")}
          barcodeAlt={t("assets.barcode")}
          locations={options.locations}
        />
        <p>{t("assets.labelPreviewHelp")}</p>
      </aside>
    </div>
  );
}
