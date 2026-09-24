"use client";

import {
  LayoutDashboard,
  MapPin,
  PackageSearch,
  Settings,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Labels = {
  dashboard: string;
  assets: string;
  categories: string;
  locations: string;
  employees: string;
  users: string;
  settings: string;
};

const nav = [
  { href: "/", icon: LayoutDashboard, key: "dashboard", adminOnly: false },
  { href: "/assets", icon: PackageSearch, key: "assets", adminOnly: false },
  { href: "/categories", icon: Tags, key: "categories", adminOnly: false },
  { href: "/locations", icon: MapPin, key: "locations", adminOnly: false },
  { href: "/employees", icon: Users, key: "employees", adminOnly: false },
  { href: "/users", icon: ShieldCheck, key: "users", adminOnly: true },
  { href: "/settings", icon: Settings, key: "settings", adminOnly: false },
] as const;

export function SidebarNav({
  labels,
  showUsers,
}: {
  labels: Labels;
  showUsers: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="main-nav" aria-label="Main navigation">
      {nav
        .filter((item) => !item.adminOnly || showUsers)
        .map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={labels[item.key]}
              aria-current={active ? "page" : undefined}
              className={`nav-link${active ? " nav-link-active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{labels[item.key]}</span>
            </Link>
          );
        })}
    </nav>
  );
}
