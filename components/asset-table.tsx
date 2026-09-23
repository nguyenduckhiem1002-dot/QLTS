"use client";

import { Search } from "lucide-react";
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
  status: AssetStatus;
  category: { name: string } | null;
  location: { name: string } | null;
  custodian: { name: string; department: string | null } | null;
};

type Labels = {
  search: string;
  allStatuses: string;
  code: string;
  name: string;
  category: string;
  location: string;
  custodian: string;
  status: string;
  empty: string;
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
        [asset.code, asset.name, asset.serialNumber]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(normalized));

      return matchesStatus && matchesQuery;
    });
  }, [assets, query, status]);

  return (
    <div className="table-section">
      <div className="table-toolbar">
        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
          />
        </label>

        <select
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <Link className="asset-link" href={`/assets/${asset.id}`}>
                      {asset.code}
                    </Link>
                  </td>
                  <td>
                    <Link className="cell-title-link" href={`/assets/${asset.id}`}>
                      {asset.name}
                    </Link>
                    {asset.serialNumber ? (
                      <small className="cell-subtitle">{asset.serialNumber}</small>
                    ) : null}
                  </td>
                  <td>{asset.category?.name ?? "—"}</td>
                  <td>{asset.location?.name ?? "—"}</td>
                  <td>
                    {asset.custodian ? (
                      <>
                        <span>{asset.custodian.name}</span>
                        {asset.custodian.department ? (
                          <small className="cell-subtitle">
                            {asset.custodian.department}
                          </small>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${asset.status.toLowerCase()}`}
                    >
                      {statusLabels[asset.status]}
                    </span>
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
