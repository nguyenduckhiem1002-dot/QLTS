import {
  Boxes,
  CheckCircle2,
  CircleDot,
  MapPin,
  Tags,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export default async function DashboardPage() {
  const { t } = await getTranslations();

  const [total, inUse, available, maintenance, categories, locations, recent] =
    await Promise.all([
      db.asset.count(),
      db.asset.count({ where: { status: "IN_USE" } }),
      db.asset.count({ where: { status: "AVAILABLE" } }),
      db.asset.count({ where: { status: "MAINTENANCE" } }),
      db.category.count(),
      db.location.count(),
      db.asset.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

  const cards = [
    { label: t("dashboard.total"), value: total, icon: Boxes },
    { label: t("dashboard.inUse"), value: inUse, icon: CircleDot },
    { label: t("dashboard.available"), value: available, icon: CheckCircle2 },
    { label: t("dashboard.maintenance"), value: maintenance, icon: Wrench },
    { label: t("dashboard.categories"), value: categories, icon: Tags },
    { label: t("dashboard.locations"), value: locations, icon: MapPin },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("app.name")}</p>
          <h1>{t("dashboard.title")}</h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
      </header>

      <div className="metric-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <article className="metric-card" key={label}>
            <div className="metric-icon">
              <Icon size={20} />
            </div>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </div>

      <article className="panel recent-panel">
        <div className="panel-heading">
          <h2>{t("dashboard.recent")}</h2>
          <Link href="/assets">{t("dashboard.viewAll")}</Link>
        </div>

        <div className="recent-list">
          {recent.map((asset) => (
            <Link href={`/assets/${asset.id}`} className="recent-row" key={asset.id}>
              <div>
                <strong>{asset.name}</strong>
                <span>{asset.code}</span>
              </div>
              <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                {t(`status.${asset.status}`)}
              </span>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}
