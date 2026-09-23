import { Plus } from "lucide-react";
import Link from "next/link";
import { AssetTable, type AssetRow } from "@/components/asset-table";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Tài sản" };

export default async function AssetsPage() {
  const { t } = await getTranslations();

  const assets = await db.asset.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      serialNumber: true,
      status: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
      custodian: { select: { name: true, department: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { code: "asc" }],
    take: 500,
  });

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <p className="eyebrow">{t("nav.assets")}</p>
          <h1>{t("assets.title")}</h1>
          <p>{t("assets.subtitle")}</p>
        </div>

        <Link href="/assets/new" className="button button-primary">
          <Plus size={16} aria-hidden="true" />
          {t("assets.add")}
        </Link>
      </header>

      <AssetTable
        assets={assets satisfies AssetRow[]}
        labels={{
          search: t("assets.search"),
          allStatuses: t("assets.allStatuses"),
          code: t("assets.code"),
          name: t("assets.name"),
          category: t("assets.category"),
          location: t("assets.location"),
          custodian: t("assets.custodian"),
          status: t("assets.status"),
          empty: t("assets.empty"),
          items: t("common.assets"),
        }}
        statusLabels={{
          AVAILABLE: t("status.AVAILABLE"),
          IN_USE: t("status.IN_USE"),
          MAINTENANCE: t("status.MAINTENANCE"),
          LOST: t("status.LOST"),
          DISPOSED: t("status.DISPOSED"),
        }}
      />
    </section>
  );
}
