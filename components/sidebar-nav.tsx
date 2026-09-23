"use client";

import {
  LayoutDashboard,
  MapPin,
  PackageSearch,
  Users,
  Settings,
  Tags,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Labels = {
  dashboard: string;
  assets: string;
  categories: string;
  locations: string;
  employees: string;
  settings: string;
};

const nav = [
  { href: "/", icon: LayoutDashboard, key: "dashboard" },
  { href: "/assets", icon: PackageSearch, key: "assets" },
  { href: "/categories", icon: Tags, key: "categories" },
  { href: "/locations", icon: MapPin, key: "locations" },
  { href: "/employees", icon: Users, key: "employees" },
  { href: "/settings", icon: Settings, key: "settings" },
] as const;

export function SidebarNav({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  return (
    <nav className="main-nav" aria-label="Main navigation">
      {nav.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={`nav-link${active ? " nav-link-active" : ""}`}
          >
            <Icon size={19} strokeWidth={1.9} />
            <span>{labels[item.key]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
