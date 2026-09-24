import {
  ArrowLeftRight,
  ChevronRight,
  ImageIcon,
  PackageSearch,
  Pencil,
  Plus,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { TemplateText } from "@/components/template-text";
import { StatusText } from "@/components/ui";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data";
import { dateLocaleOf, fill, formatMoneyShort, relativeTime } from "@/lib/format";
import { getTranslations, type TranslationKey } from "@/lib/i18n";

const activityStyle: Record<string, { icon: LucideIcon; status?: string }> = {
  ASSIGN: { icon: ArrowLeftRight, status: "IN_USE" },
  RETURN: { icon: Undo2, status: "AVAILABLE" },
  CREATE: { icon: Plus },
  UPDATE: { icon: Pencil },
  REPLACE_IMAGE: { icon: ImageIcon },
  REMOVE_IMAGE: { icon: ImageIcon },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ by?: string }>;
}) {
  const [{ t, locale }, data, user, params] = await Promise.all([
    getTranslations(),
    getDashboardData(),
    getCurrentUser(),
    searchParams,
  ]);

  const dateLocale = dateLocaleOf(locale);
  const number = new Intl.NumberFormat(dateLocale, { maximumFractionDigits: 0 });
  const today = new Intl.DateTimeFormat(dateLocale, { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date());
  const canManage = hasPermission(user?.role, "assets:write");
  const byLocation = params.by === "location";
  const distribution = byLocation ? data.locationReport : data.categoryReport;
  const distributionMax = Math.max(...distribution.map((row) => row.count), 1);

  type Attention = { count: number; status: string; href: string; title: TranslationKey; help: TranslationKey };
  const attentionItems: Attention[] = [
    { count: data.maintenance, status: "MAINTENANCE", href: "/assets?status=MAINTENANCE", title: "dashboard.attnMaintenance", help: "dashboard.attnMaintenanceHelp" },
    { count: data.lost, status: "LOST", href: "/assets?status=LOST", title: "dashboard.attnLost", help: "dashboard.attnLostHelp" },
    { count: data.noImage, status: "IN_USE", href: "/assets?flag=no-image", title: "dashboard.attnNoImage", help: "dashboard.attnNoImageHelp" },
    { count: data.noLocation, status: "DISPOSED", href: "/assets?flag=no-location", title: "dashboard.attnNoLocation", help: "dashboard.attnNoLocationHelp" },
  ];
  const attention = attentionItems.filter((item) => item.count > 0);

  // Circumference of the r=42 gauge ring.
  const ring = 2 * Math.PI * 42;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{t("dashboard.title")}</h1>
          <p>{today}</p>
        </div>
        <div className="page-actions">
          <Link className="btn" href="/assets">
            <PackageSearch size={16} aria-hidden="true" />
            {t("dashboard.viewAll")}
          </Link>
          {canManage ? (
            <Link className="btn btn-primary" href="/assets/new">
              <Plus size={16} aria-hidden="true" />
              {t("assets.add")}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="surface overview">
        <section aria-labelledby="overview-total">
          <span className="overview-label" id="overview-total">
            {t("dashboard.total")}
          </span>
          <div className="overview-figures">
            <div>
              <strong className="num">{number.format(data.total)}</strong>
              <small>{t("dashboard.totalHelp")}</small>
            </div>
            {data.totalValue > 0 ? (
              <div>
                <strong className="num overview-value">{formatMoneyShort(data.totalValue, locale)}</strong>
                <small>{t("dashboard.totalValue")}</small>
              </div>
            ) : null}
          </div>

          <div className="stack-bar" role="img" aria-label={t("dashboard.statusReport")}>
            {data.statusReport
              .filter((row) => row.count > 0)
              .map((row) => (
                <i
                  key={row.status}
                  data-status={row.status}
                  style={{ flexGrow: row.count }}
                  title={`${t(`status.${row.status}`)}: ${row.count}`}
                />
              ))}
          </div>
          <div className="legend">
            {data.statusReport.map((row) => (
              <Link key={row.status} href={`/assets?status=${row.status}`}>
                <StatusText status={row.status} label={t(`status.${row.status}`)} />
                <b className="num">{number.format(row.count)}</b>
              </Link>
            ))}
          </div>
        </section>

        <section className="utilization" aria-labelledby="overview-utilization">
          <span className="overview-label" id="overview-utilization">
            {t("dashboard.utilization")}
          </span>
          <div className="gauge">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-3)" strokeWidth="12" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--use)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(ring * data.utilization) / 100} ${ring}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div>
              <strong className="num">{data.utilization}%</strong>
              <p>{fill(t("dashboard.utilizationDetail"), { n: data.inUse, total: data.total })}</p>
            </div>
          </div>
          <div className="mini-stats">
            <div>
              <b className="num">{number.format(data.available)}</b>
              <span>{t("dashboard.availableHelp")}</span>
            </div>
            <div>
              <b className="num">
                {data.categoryCount} / {data.locationCount}
              </b>
              <span>{t("dashboard.categoriesLocations")}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="two-col">
        <section className="surface" aria-labelledby="attention-title">
          <div className="surface-head">
            <h2 id="attention-title">{t("dashboard.attention")}</h2>
            <span>{fill(t("dashboard.attentionCount"), { n: attention.length })}</span>
          </div>
          {attention.length ? (
            <div className="attention">
              {attention.map((item) => (
                <Link key={item.href} href={item.href} data-status={item.status}>
                  <span className="attention-count num">{number.format(item.count)}</span>
                  <span className="attention-copy">
                    <strong>{t(item.title)}</strong>
                    <span>{t(item.help)}</span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="attention-clear">{t("dashboard.attentionClear")}</p>
          )}
        </section>

        <section className="surface" aria-labelledby="activity-title">
          <div className="surface-head">
            <h2 id="activity-title">{t("dashboard.activity")}</h2>
          </div>
          {data.activity.length ? (
            <ul className="feed">
              {data.activity.map((item) => {
                const known = item.action in activityStyle;
                const style = known ? activityStyle[item.action] : activityStyle.UPDATE;
                const Icon = style.icon;
                const key = (known ? `activity.${item.action}` : "activity.UPDATE") as TranslationKey;
                return (
                  <li key={item.id}>
                    <span className="feed-icon" data-status={style.status}>
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <p>
                      <TemplateText
                        template={t(key)}
                        slots={{
                          actor: <b>{item.actor ?? t("activity.system")}</b>,
                          asset: item.asset ? (
                            <Link href={`/assets/${item.asset.id}`}>
                              <span className="tag">{item.asset.code}</span> {item.asset.name}
                            </Link>
                          ) : (
                            t("activity.deletedAsset")
                          ),
                          employee: <b>{item.employeeName ?? t("activity.someone")}</b>,
                        }}
                      />
                    </p>
                    <time dateTime={item.createdAt.toISOString()}>{relativeTime(item.createdAt, locale)}</time>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="attention-clear">{t("dashboard.activityEmpty")}</p>
          )}
        </section>
      </div>

      <section className="surface" aria-labelledby="distribution-title">
        <div className="surface-head">
          <h2 id="distribution-title">{t("dashboard.distribution")}</h2>
          <nav className="seg" aria-label={t("dashboard.distribution")}>
            <Link href="/" scroll={false} aria-current={byLocation ? undefined : "true"}>
              {t("dashboard.byCategory")}
            </Link>
            <Link href="/?by=location" scroll={false} aria-current={byLocation ? "true" : undefined}>
              {t("dashboard.byLocation")}
            </Link>
          </nav>
        </div>
        {distribution.length ? (
          <div className="dist">
            {distribution.map((row) => (
              <div className="dist-row" key={row.name}>
                <span title={row.name}>{row.name}</span>
                <i style={{ width: `${Math.max((row.count / distributionMax) * 100, 1)}%` }} />
                <b className="num">{number.format(row.count)}</b>
              </div>
            ))}
          </div>
        ) : (
          <p className="attention-clear">{t("common.none")}</p>
        )}
      </section>
    </section>
  );
}
