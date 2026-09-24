import { Plus } from "lucide-react";
import Link from "next/link";
import { AssetTable, type AssetTableFilters } from "@/components/asset-table";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAssets } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Tài sản" };

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<AssetTableFilters>;
}) {
  const [{ t }, assets, user, params] = await Promise.all([
    getTranslations(),
    getAssets(),
    getCurrentUser(),
    searchParams,
  ]);
  const canManage = hasPermission(user?.role, "assets:write");

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{t("assets.title")}</h1>
          <p>{t("assets.subtitle")}</p>
        </div>
        {canManage ? (
          <Link href="/assets/new" className="btn btn-primary">
            <Plus size={16} aria-hidden="true" />
            {t("assets.add")}
          </Link>
        ) : null}
      </header>

      <AssetTable
        // Remount when the URL filters change (e.g. a new search from the top bar).
        key={JSON.stringify(params)}
        assets={assets}
        initial={params}
        labels={{
          search: t("assets.search"),
          all: t("assets.tabAll"),
          allCategories: t("assets.allCategories"),
          allLocations: t("assets.allLocations"),
          asset: t("assets.asset"),
          category: t("assets.category"),
          location: t("assets.location"),
          custodian: t("assets.custodian"),
          status: t("assets.status"),
          inStorage: t("assets.inStorage"),
          selectAll: t("assets.selectAll"),
          selectRow: t("assets.selectRow"),
          selected: t("assets.selectedCount"),
          printLabels: t("labels.print"),
          clearSelection: t("assets.clearSelection"),
          emptyTitle: t("assets.empty"),
          emptyFiltered: t("assets.emptyFiltered"),
          clearFilters: t("assets.clearFilters"),
          showing: t("assets.showing"),
          flagNoImage: t("assets.flagNoImage"),
          flagNoLocation: t("assets.flagNoLocation"),
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
