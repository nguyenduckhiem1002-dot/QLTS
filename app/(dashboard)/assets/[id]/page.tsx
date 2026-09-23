import {
  ArrowLeft,
  ImagePlus,
  RotateCcw,
  ScanBarcode,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  assignAsset,
  removeAssetImage,
  replaceAssetImage,
  returnAsset,
} from "@/lib/actions/assets";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssetDetail, getEmployeesForAssignment } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;

  const [{ t, locale }, asset, employees, currentUser, pageParams] =
    await Promise.all([
      getTranslations(),
      getAssetDetail(id),
      getEmployeesForAssignment(),
      getCurrentUser(),
      searchParams,
    ]);

  if (!asset) notFound();

  const demoMode = isDemoMode();
  const canManage = hasPermission(currentUser?.role, "assets:write");
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat(dateLocale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date)
      : "—";

  const mediaError =
    pageParams.error === "image_type"
      ? t("assets.imageTypeError")
      : pageParams.error === "image_size"
        ? t("assets.imageSizeError")
        : pageParams.error === "image_required"
          ? t("assets.imageRequired")
          : null;

  const mediaSuccess =
    pageParams.success === "image"
      ? t("assets.imageUpdated")
      : pageParams.success === "image_removed"
        ? t("assets.imageRemoved")
        : null;

  const imageUrl = asset.image
    ? `/api/assets/${asset.id}/image?v=${asset.image.updatedAt.getTime()}`
    : null;

  return (
    <section className="page">
      <header className="page-header">
        <Link className="back-link" href="/assets">
          <ArrowLeft size={15} aria-hidden="true" />
          {t("common.back")}
        </Link>
        <div className="detail-title-row">
          <div>
            <p className="eyebrow mono-eyebrow">{asset.code}</p>
            <h1>{asset.name}</h1>
            <p>{t("assets.detailTitle")}</p>
          </div>
          <span className={`status-text status-${asset.status.toLowerCase()}`}>
            <i aria-hidden="true" />
            {t(`status.${asset.status}`)}
          </span>
        </div>
      </header>

      {mediaError ? <div className="form-error">{mediaError}</div> : null}
      {mediaSuccess ? <div className="form-success">{mediaSuccess}</div> : null}

      <section className="asset-media-grid" aria-label={t("assets.media")}>
        <article className="data-surface asset-image-panel">
          <div className="surface-heading">
            <div>
              <h2>{t("assets.image")}</h2>
              <span>{asset.image?.fileName ?? t("assets.noImage")}</span>
            </div>
            <ImagePlus size={18} aria-hidden="true" />
          </div>

          <div className="asset-image-frame">
            {imageUrl ? (
              <img src={imageUrl} alt={`${asset.name} - ${t("assets.image")}`} />
            ) : (
              <div className="asset-image-empty">
                <ImagePlus size={30} aria-hidden="true" />
                <span>{t("assets.noImage")}</span>
              </div>
            )}
          </div>

          {canManage && !demoMode ? (
            <div className="asset-image-actions">
              <form action={replaceAssetImage} className="asset-image-upload">
                <input type="hidden" name="assetId" value={asset.id} />
                <label>
                  <span>{asset.image ? t("assets.replaceImage") : t("assets.addImage")}</span>
                  <input
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                  />
                </label>
                <button className="button button-secondary" type="submit">
                  {asset.image ? t("assets.replaceImage") : t("assets.addImage")}
                </button>
              </form>

              {asset.image ? (
                <form action={removeAssetImage}>
                  <input type="hidden" name="assetId" value={asset.id} />
                  <button className="button button-danger-soft" type="submit">
                    <Trash2 size={15} aria-hidden="true" />
                    {t("assets.removeImage")}
                  </button>
                </form>
              ) : null}
            </div>
          ) : null}
        </article>

        <article className="data-surface barcode-panel">
          <div className="surface-heading">
            <div>
              <h2>{t("assets.barcode")}</h2>
              <span>{t("assets.barcodeType")}</span>
            </div>
            <ScanBarcode size={18} aria-hidden="true" />
          </div>

          <div className="barcode-frame">
            <img
              src={`/api/assets/${asset.id}/barcode`}
              alt={`${t("assets.barcode")} ${asset.barcode ?? asset.code}`}
            />
          </div>

          <div className="barcode-meta">
            <div>
              <span>{t("assets.barcodeValue")}</span>
              <strong>{asset.barcode ?? asset.code}</strong>
            </div>
            <a
              className="surface-action"
              href={`/api/assets/${asset.id}/barcode`}
              target="_blank"
              rel="noreferrer"
            >
              {t("assets.openBarcode")}
            </a>
          </div>
        </article>
      </section>

      <div className="detail-grid detail-grid-spaced">
        <article className="data-surface detail-panel">
          <dl className="detail-list">
            <div>
              <dt>{t("assets.code")}</dt>
              <dd className="mono-value">{asset.code}</dd>
            </div>
            <div>
              <dt>{t("assets.barcode")}</dt>
              <dd className="mono-value">{asset.barcode ?? asset.code}</dd>
            </div>
            <div>
              <dt>{t("assets.serial")}</dt>
              <dd className="mono-value">{asset.serialNumber ?? "—"}</dd>
            </div>
            <div>
              <dt>{t("assets.category")}</dt>
              <dd>{asset.category?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>{t("assets.location")}</dt>
              <dd>{asset.location?.name ?? "—"}</dd>
            </div>
            <div>
              <dt>{t("assets.custodian")}</dt>
              <dd>{asset.custodian?.name ?? "—"}</dd>
            </div>
            <div className="detail-span">
              <dt>{t("assets.description")}</dt>
              <dd>{asset.description ?? "—"}</dd>
            </div>
          </dl>
        </article>

        <article className="panel action-panel">
          <div className="form-intro">
            <span className="form-kicker">{t("assets.status")}</span>
            <h2>{t("assets.assignment")}</h2>
            <p>{t("assets.assignmentHelp")}</p>
          </div>

          <form action={assignAsset} className="stack-form">
            <input type="hidden" name="assetId" value={asset.id} />
            <label>
              <span>{t("assets.employee")}</span>
              <select
                name="employeeId"
                required
                defaultValue={asset.custodianId ?? ""}
                disabled={demoMode || !canManage}
              >
                <option value="" disabled>
                  —
                </option>
                {employees.map((employee) => (
                  <option value={employee.id} key={employee.id}>
                    {employee.name}
                    {employee.department ? ` · ${employee.department}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("assets.note")}</span>
              <input name="note" disabled={demoMode || !canManage} />
            </label>
            <button
              className="button button-primary"
              type="submit"
              disabled={demoMode || !canManage}
            >
              {t("assets.assign")}
            </button>
          </form>

          {asset.custodianId ? (
            <form action={returnAsset} className="return-form">
              <input type="hidden" name="assetId" value={asset.id} />
              <p>{t("assets.returnHelp")}</p>
              <button
                className="button button-secondary"
                type="submit"
                disabled={demoMode || !canManage}
              >
                <RotateCcw size={15} aria-hidden="true" />
                {t("assets.return")}
              </button>
            </form>
          ) : null}
        </article>
      </div>

      <article className="data-surface history-panel">
        <div className="surface-heading">
          <div>
            <h2>{t("assets.history")}</h2>
            <span>{asset.assignments.length}</span>
          </div>
        </div>

        <div className="history-list">
          {asset.assignments.length ? (
            asset.assignments.map((assignment) => (
              <div className="history-row" key={assignment.id}>
                <div>
                  <strong>{assignment.employee.name}</strong>
                  <span>
                    {t("assets.assignedAt")}: {formatDate(assignment.assignedAt)}
                  </span>
                </div>
                <div className="history-return">
                  <span>{t("assets.returnedAt")}</span>
                  <strong>{formatDate(assignment.returnedAt)}</strong>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">{t("common.none")}</div>
          )}
        </div>
      </article>
    </section>
  );
}
