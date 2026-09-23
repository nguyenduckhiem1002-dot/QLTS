import { Boxes } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { getTranslations } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getTranslations();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <Boxes size={22} />
          </div>
          <div>
            <strong>{t("app.name")}</strong>
            <span>{t("app.subtitle")}</span>
          </div>
        </div>

        <SidebarNav
          labels={{
            dashboard: t("nav.dashboard"),
            assets: t("nav.assets"),
            categories: t("nav.categories"),
            locations: t("nav.locations"),
            settings: t("nav.settings"),
          }}
        />

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>QLTS Core</span>
          <small>Next.js</small>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
