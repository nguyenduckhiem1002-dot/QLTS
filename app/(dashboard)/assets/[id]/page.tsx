import { ArrowLeft, RotateCcw, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { assignAsset, returnAsset } from "@/lib/actions/assets";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ t, locale }, asset, employees] = await Promise.all([
    getTranslations(),
    db.asset.findUnique({
      where: { id },
      include: {
        category: true,
        location: true,
        custodian: true,
        assignments: {
          include: { employee: true },
          orderBy: { assignedAt: "desc" },
          take: 12,
        },
      },
    }),
    db.employee.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!asset) notFound();

  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";
  const formatDate = (date: Date | null) =>
    date
      ? new Intl.DateTimeFormat(dateLocale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(date)
      : "—";

  return (
    <section className="page">
      <header className="page-header">
        <Link className="back-link" href="/assets">
          <ArrowLeft size={16} />
          {t("common.back")}
        </Link>
        <div className="detail-title-row">
          <div>
            <p className="eyebrow">{asset.code}</p>
            <h1>{asset.name}</h1>
            <p>{t("assets.detailTitle")}</p>
          </div>
          <span className={`status-badge status-${asset.status.toLowerCase()}`}>
            {t(`status.${asset.status}`)}
          </span>
        </div>
      </header>

      <div className="detail-grid">
        <article className="panel detail-panel">
          <dl className="detail-list">
            <div>
              <dt>{t("assets.serial")}</dt>
              <dd>{asset.serialNumber ?? "—"}</dd>
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
          <div className="section-icon">
            <UserRoundCheck size={20} />
          </div>
          <h2>{t("assets.assignment")}</h2>
          <p>{t("assets.assignmentHelp")}</p>

          <form action={assignAsset} className="stack-form">
            <input type="hidden" name="assetId" value={asset.id} />
            <label>
              <span>{t("assets.employee")}</span>
              <select
                name="employeeId"
                required
                defaultValue={asset.custodianId ?? ""}
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
              <input name="note" />
            </label>
            <button className="button button-primary" type="submit">
              {t("assets.assign")}
            </button>
          </form>

          {asset.custodianId ? (
            <form action={returnAsset} className="return-form">
              <input type="hidden" name="assetId" value={asset.id} />
              <p>{t("assets.returnHelp")}</p>
              <button className="button button-secondary" type="submit">
                <RotateCcw size={16} />
                {t("assets.return")}
              </button>
            </form>
          ) : null}
        </article>
      </div>

      <article className="panel history-panel">
        <div className="panel-heading">
          <h2>{t("assets.history")}</h2>
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
