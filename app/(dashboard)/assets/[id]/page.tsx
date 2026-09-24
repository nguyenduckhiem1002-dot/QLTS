import { ArrowLeftRight, ChevronLeft, House, Pencil, Printer, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetLabel } from "@/components/asset-label";
import { AssetPhoto } from "@/components/asset-photo";
import { Drawer, DrawerCancel } from "@/components/drawer";
import { SubmitButton } from "@/components/submit-button";
import { FieldLabel, Notice, StatusText } from "@/components/ui";
import {
  assignAsset,
  removeAssetImage,
  replaceAssetImage,
  returnAsset,
} from "@/lib/actions/assets";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssetDetail, getEmployeesForAssignment } from "@/lib/data";
import { dateLocaleOf, fill, getInitials } from "@/lib/format";
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
  const editable = hasPermission(currentUser?.role, "assets:write") && !demoMode;
  const dateLocale = dateLocaleOf(locale);
  const shortDate = new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric" });
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
  const none = <span className="facts-empty">{t("common.notAvailable")}</span>;
  const barcodeValue = asset.barcode ?? asset.code;
  const imageUrl = asset.image ? `/api/assets/${asset.id}/image?v=${asset.image.updatedAt.getTime()}` : null;
  const activeAssignment = asset.custodianId
    ? asset.assignments.find((assignment) => !assignment.returnedAt)
    : undefined;
  const canAssign = asset.status !== "DISPOSED" && asset.status !== "LOST";
  const subtitle = [asset.category?.name, asset.location?.name].filter(Boolean).join(", ");

  const assignDrawer = (
    <Drawer
      trigger={
        <>
          <ArrowLeftRight size={16} aria-hidden="true" />
          {asset.custodian ? t("assets.transfer") : t("assets.handover")}
        </>
      }
      triggerClassName={asset.custodian ? "btn" : "btn btn-primary"}
      title={asset.custodian ? t("assets.transferTitle") : t("assets.handoverTitle")}
      description={`${asset.code} ${asset.name}`}
      closeLabel={t("common.close")}
    >
      <form action={assignAsset} className="drawer-form">
        <input type="hidden" name="assetId" value={asset.id} />
        <div className="drawer-body">
          {asset.custodian ? (
            <p className="inline-callout">{fill(t("assets.transferHelp"), { name: asset.custodian.name })}</p>
          ) : null}
          <label className="field">
            <FieldLabel required requiredLabel={t("common.required")}>
              {asset.custodian ? t("assets.transferTo") : t("assets.assignTo")}
            </FieldLabel>
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
          <label className="field">
            <FieldLabel optionalLabel={t("common.optional")}>{t("assets.note")}</FieldLabel>
            <textarea name="note" rows={3} placeholder={t("assets.notePlaceholder")} />
          </label>
          <p className="field-hint">{t("assets.handoverHint")}</p>
        </div>
        <div className="drawer-foot">
          <DrawerCancel>{t("common.cancel")}</DrawerCancel>
          <SubmitButton pendingLabel={t("common.saving")}>
            {asset.custodian ? t("assets.transfer") : t("assets.handover")}
          </SubmitButton>
        </div>
      </form>
    </Drawer>
  );

  return (
    <section className="page">
      <Link className="back-link" href="/assets">
        <ChevronLeft size={16} aria-hidden="true" />
        {t("nav.assets")}
      </Link>

      {success ? <Notice tone="success">{t(success)}</Notice> : null}
      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <header className="detail-head">
        <div className="detail-title">
          <div className="detail-title-meta">
            <span className="tag">{asset.code}</span>
            <StatusText status={asset.status} label={t(`status.${asset.status}`)} pill />
          </div>
          <h1>{asset.name}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="page-actions">
          <Link className="btn" href={`/assets/labels?ids=${asset.id}`}>
            <Printer size={16} aria-hidden="true" />
            {t("assets.printLabel")}
          </Link>
          {editable ? (
            <Link className="btn" href={`/assets/${asset.id}/edit`}>
              <Pencil size={15} aria-hidden="true" />
              {t("common.edit")}
            </Link>
          ) : null}
          {editable && asset.custodian ? (
            <form action={returnAsset}>
              <input type="hidden" name="assetId" value={asset.id} />
              <SubmitButton className="btn btn-primary" pendingLabel={t("common.saving")}>
                <RotateCcw size={15} aria-hidden="true" />
                {t("assets.returnShort")}
              </SubmitButton>
            </form>
          ) : null}
          {editable && canAssign ? assignDrawer : null}
        </div>
      </header>

      <div className="detail-grid">
        <div className="detail-main">
          <section className="surface holder" aria-label={t("assets.custodian")}>
            {asset.custodian ? (
              <span className="avatar avatar-lg" aria-hidden="true">
                {getInitials(asset.custodian.name)}
              </span>
            ) : (
              <span className="holder-icon" aria-hidden="true">
                <House size={20} strokeWidth={1.8} />
              </span>
            )}
            <div className="holder-copy">
              {asset.custodian ? (
                <>
                  <strong>{fill(t("assets.heldBy"), { name: asset.custodian.name })}</strong>
                  <span>
                    {[
                      asset.custodian.department,
                      activeAssignment
                        ? fill(t("assets.heldSince"), { date: shortDate.format(activeAssignment.assignedAt) })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </>
              ) : (
                <>
                  <strong>
                    {asset.location
                      ? fill(t("assets.atLocation"), { location: asset.location.name })
                      : t("assets.noLocation")}
                  </strong>
                  <span>{editable && canAssign ? t("assets.notAssignedHelp") : t("assets.notAssignedReadonly")}</span>
                </>
              )}
            </div>
            {asset.custodianId ? (
              <Link className="btn btn-sm" href="/employees">
                {t("assets.viewEmployees")}
              </Link>
            ) : null}
          </section>

          <section className="surface" aria-labelledby="facts-title">
            <div className="surface-head">
              <h2 id="facts-title">{t("assets.details")}</h2>
            </div>
            <dl className="facts">
              <div>
                <dt>{t("assets.code")}</dt>
                <dd className="mono">{asset.code}</dd>
              </div>
              <div>
                <dt>{t("assets.serial")}</dt>
                <dd className="mono">{asset.serialNumber ?? none}</dd>
              </div>
              <div>
                <dt>{t("assets.category")}</dt>
                <dd>{asset.category?.name ?? none}</dd>
              </div>
              <div>
                <dt>{t("assets.location")}</dt>
                <dd>{asset.location?.name ?? none}</dd>
              </div>
              <div>
                <dt>{t("assets.purchaseDate")}</dt>
                <dd>{asset.purchaseDate ? shortDate.format(asset.purchaseDate) : none}</dd>
              </div>
              <div>
                <dt>{t("assets.purchaseCostShort")}</dt>
                <dd className="num">{asset.purchaseCost ? `${number.format(Number(asset.purchaseCost))} đ` : none}</dd>
              </div>
              <div className="facts-wide">
                <dt>{t("assets.description")}</dt>
                <dd>
                  {asset.description ??
                    (editable ? (
                      <Link className="link-btn" href={`/assets/${asset.id}/edit`}>
                        {t("assets.addDescription")}
                      </Link>
                    ) : (
                      none
                    ))}
                </dd>
              </div>
            </dl>
          </section>

          <section className="surface" aria-labelledby="history-title">
            <div className="surface-head">
              <h2 id="history-title">{t("assets.history")}</h2>
              <span>{fill(t("assets.historyCount"), { n: asset.assignments.length })}</span>
            </div>
            {asset.assignments.length ? (
              <ol className="timeline">
                {asset.assignments.map((assignment) => (
                  <li
                    key={assignment.id}
                    className={assignment.returnedAt ? undefined : "is-active"}
                    data-status={assignment.returnedAt ? "AVAILABLE" : "IN_USE"}
                  >
                    <span className="timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{fill(t("assets.handedTo"), { name: assignment.employee.name })}</strong>
                      <p>
                        {[
                          assignment.note,
                          assignment.returnedAt
                            ? fill(t("assets.returnedOn"), { date: dateTime.format(assignment.returnedAt) })
                            : t("assets.stillHolding"),
                        ]
                          .filter(Boolean)
                          .join(". ")}
                      </p>
                    </div>
                    <time dateTime={assignment.assignedAt.toISOString()}>{dateTime.format(assignment.assignedAt)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="timeline-empty">
                <strong>{t("assets.historyEmptyTitle")}</strong> {t("assets.historyEmptyHelp")}
              </p>
            )}
          </section>
        </div>

        <aside className="detail-side">
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
          <AssetLabel
            owner={t("assets.tagOwner")}
            code={asset.code}
            name={asset.name}
            barcodeSrc={`/api/assets/${asset.id}/barcode`}
            barcodeAlt={`${t("assets.barcode")} ${barcodeValue}`}
            footer={<span>{t("assets.tagType")}</span>}
          />
        </aside>
      </div>
    </section>
  );
}
