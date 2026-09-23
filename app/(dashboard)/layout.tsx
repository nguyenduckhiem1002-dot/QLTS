import { SidebarNav } from "@/components/sidebar-nav";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getTranslations();
  const demoMode = isDemoMode();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            QL
          </div>
          <div className="brand-copy">
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
            employees: t("nav.employees"),
            settings: t("nav.settings"),
          }}
        />

        <div className="sidebar-footer">
          <span className="status-dot" />
          <div>
            <strong>{demoMode ? t("demo.badge") : "Self-hosted"}</strong>
            <span>{demoMode ? t("demo.short") : "PostgreSQL · Next.js"}</span>
          </div>
        </div>
      </aside>

      <main id="main-content" className="main-content">
        {demoMode ? (
          <div className="demo-banner" role="status">
            <strong>{t("demo.badge")}</strong>
            <span>{t("demo.message")}</span>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
