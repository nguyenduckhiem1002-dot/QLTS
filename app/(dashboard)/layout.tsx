import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { MobileRail, SidebarNav, type NavLabels } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";
import { logout } from "@/lib/actions/auth";
import { hasPermission } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getInitials } from "@/lib/format";
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

  const navLabels: NavLabels = {
    dashboard: t("nav.dashboard"),
    assets: t("nav.assets"),
    employees: t("nav.employees"),
    categories: t("nav.categories"),
    locations: t("nav.locations"),
    users: t("nav.users"),
    settings: t("nav.settings"),
    groupOps: t("nav.groupOps"),
    groupData: t("nav.groupData"),
    groupAdmin: t("nav.groupAdmin"),
  };
  const showUsers = hasPermission(user.role, "users:manage");

  const logoutButton = demoMode ? null : (
    <form action={logout}>
      <button type="submit" className="icon-button" title={t("common.logout")} aria-label={t("common.logout")}>
        <LogOut size={17} aria-hidden="true" />
      </button>
    </form>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/casla-logo-white-compact.svg" alt="Casla" width={118} height={38} />
          <span>{t("app.name")}</span>
        </div>

        <SidebarNav labels={navLabels} showUsers={showUsers} />

        <div className="sidebar-account">
          <span className="avatar" aria-hidden="true">
            {getInitials(user.name)}
          </span>
          <div className="sidebar-account-copy">
            <strong>{user.name}</strong>
            <span>{t(`role.${user.role}`)}</span>
          </div>
          {logoutButton}
        </div>
      </aside>

      <div className="main">
        <MobileRail labels={navLabels} showUsers={showUsers}>
          {logoutButton}
        </MobileRail>
        {demoMode ? (
          <div className="demo-banner" role="status">
            <strong>{t("demo.badge")}</strong>
            <span>{t("demo.message")}</span>
          </div>
        ) : null}
        <Topbar
          labels={{
            dashboard: t("nav.dashboard"),
            assets: t("nav.assets"),
            employees: t("nav.employees"),
            categories: t("nav.categories"),
            locations: t("nav.locations"),
            users: t("nav.users"),
            settings: t("nav.settings"),
            newAsset: t("assets.createTitle"),
            assetDetail: t("assets.details"),
            editAsset: t("assets.edit"),
            labels: t("labels.title"),
            search: t("search.placeholder"),
            searchLabel: t("search.label"),
          }}
        />
        <main id="main-content" className="page-host">
          {children}
        </main>
      </div>
    </div>
  );
}
