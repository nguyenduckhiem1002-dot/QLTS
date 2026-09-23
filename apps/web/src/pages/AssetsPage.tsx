import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "../components/PageState";
import { useI18n } from "../i18n";
import { useApi } from "../lib/api";
import type { Asset } from "../types";

export function AssetsPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const { data, error, loading } = useApi<Asset[]>("/api/assets");

  const assets = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();

    if (!data || !normalized) return data ?? [];

    return data.filter((asset) =>
      [asset.code, asset.name, asset.serialNumber]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalized)),
    );
  }, [data, query]);

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <p className="eyebrow">{t("nav.assets")}</p>
          <h1>{t("assets.title")}</h1>
          <p>{t("assets.subtitle")}</p>
        </div>

        <label className="search-box">
          <Search size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("assets.search")}
          />
        </label>
      </header>

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState /> : null}

      {data ? (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("assets.code")}</th>
                  <th>{t("assets.name")}</th>
                  <th>{t("assets.category")}</th>
                  <th>{t("assets.location")}</th>
                  <th>{t("assets.custodian")}</th>
                  <th>{t("assets.status")}</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.id}>
                    <td>
                      <span className="asset-code">{asset.code}</span>
                    </td>
                    <td>
                      <strong className="cell-title">{asset.name}</strong>
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
                          <small className="cell-subtitle">
                            {asset.custodian.department ?? asset.custodian.employeeCode}
                          </small>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${asset.status.toLowerCase()}`}>
                        {t(`status.${asset.status}`)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {assets.length === 0 ? (
            <div className="empty-state">{t("assets.empty")}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
