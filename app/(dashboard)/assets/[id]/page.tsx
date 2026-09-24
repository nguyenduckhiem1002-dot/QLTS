import { ChevronLeft, House, Pencil, Printer, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetPhoto } from "@/components/asset-photo";
import { SubmitButton } from "@/components/submit-button";
import { Notice } from "@/components/ui";
import {
  assignAsset,
  removeAssetImage,
  replaceAssetImage,
  returnAsset,
} from "@/lib/actions/assets";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssetDetail, getEmployeesForAssignment } from "@/lib/data";
import { getInitials } from "@/lib/format";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

const successMessages: Record<string, TranslationKey> = {
  image: "assets.imageUpdated",
  image_removed: "assets.imageRemoved",
  updated: "assets.updated",
  assigned: "assets.assigned",
  returned: "assets.returned",
};

const errorMessages: Record<string, TranslationKey> = {
  image_type: "assets.imageTypeError",
  image_size: "assets.imageSizeError",
  image_required: "assets.imageRequired",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const asset = await getAssetDetail((await params).id);
  return { title: asset ? `${asset.code} ${asset.name}` : "Tài sản" };
}

export default async function AssetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;

  const [{ t, locale }, asset, employees, currentUser, pageParams] = await Promise.all([
    getTranslations(),
    getAssetDetail(id),
    getEmployeesForAssignment(),
    getCurrentUser(),
    searchParams,
  ]);

  if (!asset) notFound();

  const demoMode = isDemoMode();
  const canManage = hasPermission(currentUser?.role, "assets:write");
  const editable = canManage && !demoMode;
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const shortDate = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const dateTime = new Intl.DateTimeFormat(dateLocale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const number = new Intl.NumberFormat(dateLocale, { maximumFractionDigits: 0 });

  const success = pageParams.success ? successMessages[pageParams.success] : undefined;
  const error = pageParams.error ? errorMessages[pageParams.error] : undefined;
  const none = <span className="ad-empty-value">{t("common.notAvailable")}</span>;
  const barcodeValue = asset.barcode ?? asset.code;
  const barcodeUrl = `/api/assets/${asset.id}/barcode`;
  const imageUrl = asset.image
    ? `/api/assets/${asset.id}/image?v=${asset.image.updatedAt.getTime()}`
    : null;

  const activeAssignment = asset.custodianId
    ? asset.assignments.find((assignment) => !assignment.returnedAt)
    : undefined;
  const subtitle = [
    asset.category?.name,
    asset.purchaseDate
      ? t("assets.purchasedOn").replace("{date}", shortDate.format(asset.purchaseDate))
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <section className="page asset-detail">
      <Link className="ad-back" href="/assets">
        <ChevronLeft size={16} aria-hidden="true" />
        {t("nav.assets")}
      </Link>

      {success ? <Notice tone="success">{t(success)}</Notice> : null}
      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <div className="ad-layout">
        <aside className="ad-side">
          <AssetPhoto
            assetId={asset.id}
            imageUrl={imageUrl}
            fill={Boolean(asset.image?.fileName.startsWith("minh-hoa-"))}
            editable={editable}
            uploadAction={replaceAssetImage}
            removeAction={removeAssetImage}
            labels={{
              alt: asset.name,
              empty: t("assets.noImage"),
              change: t("assets.clickToChangePhoto"),
              add: t("assets.clickToAddPhoto"),
              remove: t("assets.removeImage"),
              removeConfirm: t("assets.removeImageConfirm"),
              uploading: t("assets.uploading"),
              help: t("assets.imageHelp"),
              typeError: t("assets.imageTypeError"),
              sizeError: t("assets.imageSizeError"),
            }}
          />

          <article className="ad-tag" aria-label={t("assets.barcode")}>
            <div className="ad-tag-head">
              <span>{t("assets.tagOwner")}</span>
              <i className="ad-tag-hole" aria-hidden="true" />
            </div>
            <div className="ad-tag-barcode">
              <img src={barcodeUrl} alt={`${t("assets.barcode")} ${barcodeValue}`} />
            </div>
            <strong className="ad-tag-code">{barcodeValue}</strong>
            <span className="ad-tag-name">{asset.name}</span>
            <div className="ad-tag-foot">
              <span>{t("assets.tagType")}</span>
              <a className="ad-tag-print" href={barcodeUrl} target="_blank" rel="noreferrer">
                <Printer size={15} aria-hidden="true" />
                {t("assets.printLabel")}
              </a>
            </div>
          </article>
        </aside>

        <div className="ad-main">
          <header className="ad-header">
            <div>
              <span className={`status-pill status-pill-${asset.status.toLowerCase()}`}>
                <i aria-hidden="true" />
                {t(`status.${asset.status}`)}
              </span>
              <h1>{asset.name}</h1>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>
            {editable ? (
              <Link className="button button-primary" href={`/assets/${asset.id}/edit`}>
                <Pencil size={15} aria-hidden="true" />
                {t("common.edit")}
              </Link>
            ) : null}
          </header>

          <section className="ad-handover">
            <div className="ad-handover-state">
              {asset.custodian ? (
                <span className="avatar ad-handover-avatar" aria-hidden="true">
                  {getInitials(asset.custodian.name)}
                </span>
              ) : (
                <span className="ad-handover-icon" aria-hidden="true">
                  <House size={19} strokeWidth={1.8} />
                </span>
              )}
              <div className="ad-handover-copy">
                {asset.custodian ? (
                  <>
                    <strong>{t("assets.heldBy").replace("{name}", asset.custodian.name)}</strong>
                    <span>
                      {[
                        activeAssignment
                          ? t("assets.heldSince").replace(
                              "{date}",
                              shortDate.format(activeAssignment.assignedAt),
                            )
                          : null,
                        asset.custodian.department,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      {editable ? `. ${t("assets.heldHelp")}` : null}
                    </span>
                  </>
                ) : (
                  <>
                    <strong>
                      {asset.location
                        ? t("assets.atLocation").replace("{location}", asset.location.name)
                        : t("assets.noLocation")}
                    </strong>
                    <span>
                      {editable ? t("assets.notAssignedHelp") : t("assets.notAssignedReadonly")}
                    </span>
                  </>
                )}
              </div>
              {editable && asset.custodian ? (
                <form action={returnAsset}>
                  <input type="hidden" name="assetId" value={asset.id} />
                  <SubmitButton className="button button-secondary" pendingLabel={t("common.saving")}>
                    <RotateCcw size={15} aria-hidden="true" />
                    {t("assets.returnShort")}
                  </SubmitButton>
                </form>
              ) : null}
            </div>

            {editable ? (
              <form action={assignAsset} className="ad-handover-form">
                <input type="hidden" name="assetId" value={asset.id} />
                <label>
                  <span className="field-label">
                    {asset.custodian ? t("assets.transferTo") : t("assets.assignTo")}
                  </span>
                  <select name="employeeId" required defaultValue="">
                    <option value="" disabled>
                      {t("assets.chooseEmployee")}
                    </option>
                    {employees
                      .filter((employee) => employee.id !== asset.custodianId)
                      .map((employee) => (
                        <option value={employee.id} key={employee.id}>
                          {employee.name}
                          {employee.department ? ` (${employee.department})` : ""}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  <span className="field-label">
                    {t("assets.note")}
                    <em className="ad-label-optional">({t("common.optional").toLowerCase()})</em>
                  </span>
                  <input name="note" autoComplete="off" placeholder={t("assets.notePlaceholder")} />
                </label>
                <SubmitButton className="button button-primary ad-handover-submit" pendingLabel={t("common.saving")}>
                  {asset.custodian ? t("assets.transfer") : t("assets.handover")}
                </SubmitButton>
              </form>
            ) : null}
          </section>

          <section className="ad-section">
            <h2>{t("assets.details")}</h2>
            <dl className="ad-facts">
              <div>
                <dt>{t("assets.category")}</dt>
                <dd>{asset.category?.name ?? none}</dd>
              </div>
              <div>
                <dt>{t("assets.location")}</dt>
                <dd>{asset.location?.name ?? none}</dd>
              </div>
              <div>
                <dt>{t("assets.serial")}</dt>
                <dd className="ad-mono">{asset.serialNumber ?? none}</dd>
              </div>
              <div>
                <dt>{t("assets.purchaseDate")}</dt>
                <dd>{asset.purchaseDate ? shortDate.format(asset.purchaseDate) : none}</dd>
              </div>
              <div>
                <dt>{t("assets.purchaseCostShort")}</dt>
                <dd className="ad-number">
                  {asset.purchaseCost ? `${number.format(Number(asset.purchaseCost))} đ` : none}
                </dd>
              </div>
              <div>
                <dt>{t("assets.code")}</dt>
                <dd className="ad-mono">{asset.code}</dd>
              </div>
              <div className="ad-facts-span">
                <dt>{t("assets.description")}</dt>
                <dd>
                  {asset.description ??
                    (editable ? (
                      <Link className="ad-inline-link" href={`/assets/${asset.id}/edit`}>
                        {t("assets.addDescription")}
                      </Link>
                    ) : (
                      none
                    ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="ad-section">
            <h2>
              {t("assets.history")}
              <span>{t("assets.historyCount").replace("{n}", String(asset.assignments.length))}</span>
            </h2>
            {asset.assignments.length ? (
              <ol className="ad-history">
                {asset.assignments.map((assignment) => (
                  <li key={assignment.id} className={assignment.returnedAt ? undefined : "is-active"}>
                    <span className="avatar avatar-sm" aria-hidden="true">
                      {getInitials(assignment.employee.name)}
                    </span>
                    <div className="ad-history-main">
                      <strong>{assignment.employee.name}</strong>
                      {assignment.note ? <span>{assignment.note}</span> : null}
                    </div>
                    <div className="ad-history-dates">
                      <span>{dateTime.format(assignment.assignedAt)}</span>
                      {assignment.returnedAt ? (
                        <span>
                          {t("assets.returnedAt")}: {dateTime.format(assignment.returnedAt)}
                        </span>
                      ) : (
                        <span className="ad-history-badge">{t("assets.stillHolding")}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="ad-history-empty">
                <strong>{t("assets.historyEmptyTitle")}</strong> {t("assets.historyEmptyHelp")}
              </p>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
