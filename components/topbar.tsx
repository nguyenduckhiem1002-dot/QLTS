"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export type TopbarLabels = {
  dashboard: string;
  assets: string;
  employees: string;
  categories: string;
  locations: string;
  users: string;
  settings: string;
  newAsset: string;
  assetDetail: string;
  editAsset: string;
  labels: string;
  search: string;
  searchLabel: string;
};

type Crumb = { label: string; href?: string };

function crumbsFor(pathname: string, l: TopbarLabels): Crumb[] {
  const [section, id, action] = pathname.split("/").filter(Boolean);
  if (!section) return [{ label: l.dashboard }];

  const top: Record<string, string> = {
    assets: l.assets,
    employees: l.employees,
    categories: l.categories,
    locations: l.locations,
    users: l.users,
    settings: l.settings,
  };
  if (section !== "assets" || !id) return [{ label: top[section] ?? section }];

  const assets = { label: l.assets, href: "/assets" };
  if (id === "new") return [assets, { label: l.newAsset }];
  if (id === "labels") return [assets, { label: l.labels }];
  if (action === "edit") return [assets, { label: l.assetDetail, href: `/assets/${id}` }, { label: l.editAsset }];
  return [assets, { label: l.assetDetail }];
}

export function Topbar({ labels }: { labels: TopbarLabels }) {
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const crumbs = crumbsFor(pathname, labels);

  // "/" jumps to search, like most operations consoles.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="topbar">
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.map((crumb, index) => (
          <span key={crumb.label + index} style={{ display: "contents" }}>
            {index > 0 ? <ChevronRight size={14} aria-hidden="true" /> : null}
            {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
          </span>
        ))}
      </nav>
      <form action="/assets" role="search" className="global-search">
        <Search size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          name="q"
          type="search"
          placeholder={labels.search}
          aria-label={labels.searchLabel}
          autoComplete="off"
          enterKeyHint="search"
        />
        <kbd aria-hidden="true">/</kbd>
      </form>
    </header>
  );
}
