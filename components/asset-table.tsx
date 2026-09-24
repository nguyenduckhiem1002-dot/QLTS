"use client";

import { ChevronRight, PackageSearch, Printer, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type AssetStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "LOST" | "DISPOSED";
type Flag = "no-image" | "no-location";

const STATUSES: AssetStatus[] = ["IN_USE", "AVAILABLE", "MAINTENANCE", "LOST", "DISPOSED"];

export type AssetRow = {
  id: string;
  code: string;
  name: string;
  serialNumber: string | null;
  barcode: string | null;
  status: AssetStatus;
  category: { name: string } | null;
  location: { name: string } | null;
  custodian: { name: string; department: string | null } | null;
  image: { id: string } | null;
};

export type AssetTableLabels = {
  search: string;
  all: string;
  allCategories: string;
  allLocations: string;
  asset: string;
  category: string;
  location: string;
  custodian: string;
  status: string;
  inStorage: string;
  selectAll: string;
  selectRow: string;
  selected: string;
  printLabels: string;
  clearSelection: string;
  emptyTitle: string;
  emptyFiltered: string;
  clearFilters: string;
  showing: string;
  flagNoImage: string;
  flagNoLocation: string;
};

export type AssetTableFilters = {
  q?: string;
  status?: string;
  category?: string;
  location?: string;
  flag?: string;
};

const plain = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""));
}

export function AssetTable({
  assets,
  labels: l,
  statusLabels,
  initial,
}: {
  assets: AssetRow[];
  labels: AssetTableLabels;
  statusLabels: Record<AssetStatus, string>;
  initial: AssetTableFilters;
}) {
  const [query, setQuery] = useState(initial.q ?? "");
  const [status, setStatus] = useState<AssetStatus | "ALL">(
    STATUSES.includes(initial.status as AssetStatus) ? (initial.status as AssetStatus) : "ALL",
  );
  const [category, setCategory] = useState(initial.category ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [flag, setFlag] = useState<Flag | null>(
    initial.flag === "no-image" || initial.flag === "no-location" ? initial.flag : null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = useMemo(
    () => [...new Set(assets.map((asset) => asset.category?.name).filter(Boolean) as string[])].sort(),
    [assets],
  );
  const locations = useMemo(
    () => [...new Set(assets.map((asset) => asset.location?.name).filter(Boolean) as string[])].sort(),
    [assets],
  );

  // Everything except the status tab, so each tab can show how many it would hold.
  const base = useMemo(() => {
    const q = plain(query.trim());
    return assets.filter((asset) => {
      if (category && asset.category?.name !== category) return false;
      if (location && asset.location?.name !== location) return false;
      if (flag === "no-image" && (asset.image || asset.status === "DISPOSED")) return false;
      if (flag === "no-location" && (asset.location || asset.status === "DISPOSED")) return false;
      if (!q) return true;
      return plain(
        [asset.code, asset.name, asset.serialNumber ?? "", asset.barcode ?? "", asset.custodian?.name ?? ""].join(" "),
      ).includes(q);
    });
  }, [assets, query, category, location, flag]);

  const rows = status === "ALL" ? base : base.filter((asset) => asset.status === status);
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: base.length };
    for (const s of STATUSES) map[s] = 0;
    for (const asset of base) map[asset.status] += 1;
    return map;
  }, [base]);

  const filtered = Boolean(query || category || location || flag || status !== "ALL");
  const allSelected = rows.length > 0 && rows.every((asset) => selected.has(asset.id));

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const asset of rows) {
        if (allSelected) next.delete(asset.id);
        else next.add(asset.id);
      }
      return next;
    });
  }

  function reset() {
    setQuery("");
    setStatus("ALL");
    setCategory("");
    setLocation("");
    setFlag(null);
  }

  const holder = (asset: AssetRow) =>
    asset.custodian ? (
      <>
        <span className="cell-title">{asset.custodian.name}</span>
        {asset.custodian.department ? <span className="cell-sub">{asset.custodian.department}</span> : null}
      </>
    ) : (
      <span className="cell-muted">{l.inStorage}</span>
    );

  return (
    <div className="surface">
      <div className="tabs" role="tablist" aria-label={l.status}>
        {(["ALL", ...STATUSES] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={status === key}
            onClick={() => setStatus(key)}
          >
            {key === "ALL" ? l.all : statusLabels[key]}
            <span>{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <label className="search-box">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">{l.search}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={l.search}
          />
        </label>
        <select aria-label={l.category} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">{l.allCategories}</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select aria-label={l.location} value={location} onChange={(event) => setLocation(event.target.value)}>
          <option value="">{l.allLocations}</option>
          {locations.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {flag ? (
        <div className="filter-note">
          <button type="button" className="chip" aria-pressed="true" onClick={() => setFlag(null)}>
            {flag === "no-image" ? l.flagNoImage : l.flagNoLocation}
            <X size={13} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {selected.size ? (
        <div className="bulk-bar" role="region" aria-label={l.printLabels}>
          <span>{fill(l.selected, { n: selected.size })}</span>
          <span className="spacer" />
          <Link className="btn btn-sm" href={`/assets/labels?ids=${[...selected].join(",")}`}>
            <Printer size={15} aria-hidden="true" />
            {l.printLabels}
          </Link>
          <button type="button" className="btn btn-sm" onClick={() => setSelected(new Set())}>
            {l.clearSelection}
          </button>
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">
            <PackageSearch size={20} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <strong>{filtered ? l.emptyFiltered : l.emptyTitle}</strong>
          {filtered ? (
            <button type="button" className="link-btn" onClick={reset}>
              {l.clearFilters}
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <div className="table-wrap asset-table">
            <table>
              <thead>
                <tr>
                  <th className="check-col">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={l.selectAll} />
                  </th>
                  <th>{l.asset}</th>
                  <th>{l.category}</th>
                  <th>{l.location}</th>
                  <th>{l.custodian}</th>
                  <th>{l.status}</th>
                  <th aria-hidden="true" className="row-chevron" />
                </tr>
              </thead>
              <tbody>
                {rows.map((asset) => (
                  <tr key={asset.id} className={`row-link${selected.has(asset.id) ? " is-selected" : ""}`}>
                    <td className="check-col">
                      <input
                        type="checkbox"
                        className="above-link"
                        checked={selected.has(asset.id)}
                        onChange={() => toggle(asset.id)}
                        aria-label={fill(l.selectRow, { code: asset.code })}
                      />
                    </td>
                    <td>
                      <div className="asset-name">
                        {/* The link's ::after covers the row (see .row-link-target). */}
                        <Link className="cell-title row-link-target" href={`/assets/${asset.id}`}>
                          {asset.name}
                        </Link>
                        <span className="asset-name-meta">
                          <span className="tag">{asset.code}</span>
                          {asset.serialNumber ? <span className="cell-sub mono">{asset.serialNumber}</span> : null}
                        </span>
                      </div>
                    </td>
                    <td>{asset.category?.name ?? <span className="cell-muted">-</span>}</td>
                    <td>{asset.location?.name ?? <span className="cell-muted">-</span>}</td>
                    <td>{holder(asset)}</td>
                    <td>
                      <span className="status" data-status={asset.status}>
                        {statusLabels[asset.status]}
                      </span>
                    </td>
                    <td className="row-chevron" aria-hidden="true">
                      <ChevronRight size={16} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="asset-cards">
            {rows.map((asset) => (
              <Link key={asset.id} className="asset-card" href={`/assets/${asset.id}`}>
                <span className="asset-card-top">
                  <strong>{asset.name}</strong>
                  <span className="status" data-status={asset.status}>
                    {statusLabels[asset.status]}
                  </span>
                </span>
                <span className="asset-card-meta">
                  <span className="tag">{asset.code}</span>
                  {asset.location ? <span>{asset.location.name}</span> : null}
                  <span>{asset.custodian?.name ?? l.inStorage}</span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="table-foot">
        <span>{fill(l.showing, { n: rows.length, total: assets.length })}</span>
      </div>
    </div>
  );
}
