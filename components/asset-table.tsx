"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type AssetStatus =
  | "AVAILABLE"
  | "IN_USE"
  | "MAINTENANCE"
  | "LOST"
  | "DISPOSED";

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
};

type Labels = {
  search: string;
  allStatuses: string;
  code: string;
  barcode: string;
  name: string;
  category: string;
  location: string;
  custodian: string;
  status: string;
  empty: string;
  items: string;
};

export function AssetTable({
  assets,
  labels,
  statusLabels,
}: {
  assets: AssetRow[];
  labels: Labels;
  statusLabels: Record<AssetStatus, string>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AssetStatus | "ALL">("ALL");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();

    return assets.filter((asset) => {
      const matchesStatus = status === "ALL" || asset.status === status;
      const matchesQuery =
        !normalized ||
        [asset.code, asset.name, asset.serialNumber, asset.barcode]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(normalized));

      return matchesStatus && matchesQuery;
    });
  }, [assets, query, status]);

  return (
    <div className="table-section">
      <div className="table-toolbar">
        <div className="toolbar-primary">
          <label className="search-box">
            <span className="sr-only">{labels.search}</span>
            <Search size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={labels.search}
            />
          </label>

          <select
            aria-label={labels.status}
            className="select-control"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as AssetStatus | "ALL")
            }
          >
            <option value="ALL">{labels.allStatuses}</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <span className="result-count">
          <strong>{filtered.length}</strong> / {assets.length} {labels.items}
        </span>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{labels.code}</th>
                <th>{labels.name}</th>
                <th>{labels.category}</th>
                <th>{labels.location}</th>
                <th>{labels.custodian}</th>
                <th>{labels.status}</th>
                <th aria-hidden="true" className="row-chevron-cell" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id} className="row-link">
                  <td>
                    <span className="asset-link">{asset.code}</span>
                    {asset.barcode && asset.barcode !== asset.code ? (
                      <small className="cell-subtitle">
                        {labels.barcode}: {asset.barcode}
                      </small>
                    ) : null}
                  </td>
                  <td>
                    {/* The link's ::after stretches over the whole row (see .row-link). */}
                    <Link className="cell-title-link row-link-target" href={`/assets/${asset.id}`}>
                      {asset.name}
                    </Link>
                    {asset.serialNumber ? (
                      <small className="cell-subtitle">{asset.serialNumber}</small>
                    ) : null}
                  </td>
                  <td>{asset.category?.name ?? <span className="cell-muted">-</span>}</td>
                  <td>{asset.location?.name ?? <span className="cell-muted">-</span>}</td>
                  <td>
                    {asset.custodian ? (
                      <>
                        <span className="cell-primary">{asset.custodian.name}</span>
                        {asset.custodian.department ? (
                          <small className="cell-subtitle">
                            {asset.custodian.department}
                          </small>
                        ) : null}
                      </>
                    ) : (
                      <span className="cell-muted">-</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-text status-${asset.status.toLowerCase()}`}>
                      <i aria-hidden="true" />
                      {statusLabels[asset.status]}
                    </span>
                  </td>
                  <td className="row-chevron-cell" aria-hidden="true">
                    <ChevronRight size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">{labels.empty}</div>
        ) : null}
      </div>
    </div>
  );
}
