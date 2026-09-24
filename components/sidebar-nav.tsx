"use client";

import {
  LayoutDashboard,
  MapPin,
  PackageSearch,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavKey = "dashboard" | "assets" | "employees" | "categories" | "locations" | "users" | "settings";

export type NavLabels = Record<NavKey | "groupOps" | "groupData" | "groupAdmin", string>;

type Item = { href: string; icon: LucideIcon; key: NavKey; adminOnly?: boolean };

const groups: { label: "groupOps" | "groupData" | "groupAdmin"; items: Item[] }[] = [
  {
    label: "groupOps",
    items: [
      { href: "/", icon: LayoutDashboard, key: "dashboard" },
      { href: "/assets", icon: PackageSearch, key: "assets" },
      { href: "/employees", icon: Users, key: "employees" },
    ],
  },
  {
    label: "groupData",
    items: [
      { href: "/categories", icon: Tags, key: "categories" },
      { href: "/locations", icon: MapPin, key: "locations" },
    ],
  },
  {
    label: "groupAdmin",
    items: [
      { href: "/users", icon: ShieldCheck, key: "users", adminOnly: true },
      { href: "/settings", icon: Settings, key: "settings" },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function visible(items: Item[], showUsers: boolean) {
  return items.filter((item) => !item.adminOnly || showUsers);
}

function NavLink({ item, label, pathname }: { item: Item; label: string; pathname: string }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="nav-link"
      aria-current={isActive(pathname, item.href) ? "page" : undefined}
    >
      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function SidebarNav({ labels, showUsers }: { labels: NavLabels; showUsers: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="nav" aria-label={labels.dashboard}>
      {groups.map((group) => {
        const items = visible(group.items, showUsers);
        if (!items.length) return null;
        return (
          <div className="nav-group" key={group.label}>
            <span className="nav-label">{labels[group.label]}</span>
            {items.map((item) => (
              <NavLink key={item.href} item={item} label={labels[item.key]} pathname={pathname} />
            ))}
          </div>
        );
      })}
    </nav>
  );
}

// Phone layout: one horizontal rail instead of the sidebar (see MASTER.md, Interaction).
export function MobileRail({
  labels,
  showUsers,
  children,
}: {
  labels: NavLabels;
  showUsers: boolean;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <nav className="mobile-rail" aria-label={labels.dashboard}>
      <img src="/casla-mark.svg" alt="Casla" />
      {groups.flatMap((group) =>
        visible(group.items, showUsers).map((item) => (
          <NavLink key={item.href} item={item} label={labels[item.key]} pathname={pathname} />
        )),
      )}
      {children}
    </nav>
  );
}
