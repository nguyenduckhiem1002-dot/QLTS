import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { logout } from "@/lib/actions/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ t }, user] = await Promise.all([getTranslations(), requireUser()]);
  const demoMode = isDemoMode();

  if (!demoMode && user.mustChangePassword) {
    redirect("/account/password");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand casla-brand">
          <img
            className="brand-logo brand-logo-full"
            src="/casla-logo-white-compact.svg"
            alt="Casla"
          />
          <img
            className="brand-logo brand-logo-mark"
            src="/casla-mark.svg"
            alt=""
            aria-hidden="true"
          />
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
            users: t("nav.users"),
            settings: t("nav.settings"),
          }}
          showUsers={hasPermission(user.role, "users:manage")}
        />

        <div className="sidebar-account">
          <div className="sidebar-account-copy">
            <strong>{user.name}</strong>
            <span>{t(`role.${user.role}`)}</span>
          </div>
          {!demoMode ? (
            <form action={logout}>
              <button
                type="submit"
                className="sidebar-logout"
                title={t("common.logout")}
                aria-label={t("common.logout")}
              >
                <LogOut size={17} />
              </button>
            </form>
          ) : null}
        </div>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <div>
            <strong>{demoMode ? t("demo.badge") : t("environment.selfHosted")}</strong>
            <span>{demoMode ? t("demo.short") : t("environment.stack")}</span>
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
