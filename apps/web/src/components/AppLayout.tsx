import {
  Boxes,
  LayoutDashboard,
  MapPin,
  PackageSearch,
  Settings,
  Tags,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useI18n } from "../i18n";
import { prefetch } from "../lib/api";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "nav.dashboard", prefetch: "/api/dashboard" },
  { to: "/assets", icon: PackageSearch, label: "nav.assets", prefetch: "/api/assets" },
  { to: "/categories", icon: Tags, label: "nav.categories", prefetch: "/api/categories" },
  { to: "/locations", icon: MapPin, label: "nav.locations", prefetch: "/api/locations" },
  { to: "/settings", icon: Settings, label: "nav.settings" },
] as const;

export function AppLayout() {
  const { t } = useI18n();

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

        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onMouseEnter={() => item.prefetch && prefetch(item.prefetch)}
                className={({ isActive }) =>
                  `nav-link${isActive ? " nav-link-active" : ""}`
                }
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{t(item.label)}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>QLTS Core</span>
          <small>v0.1</small>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
