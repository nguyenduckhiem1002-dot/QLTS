import { ErrorState, LoadingState } from "../components/PageState";
import { useI18n } from "../i18n";
import { useApi } from "../lib/api";
import type { Category } from "../types";

export function CategoriesPage() {
  const { t } = useI18n();
  const { data, error, loading } = useApi<Category[]>("/api/categories");

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.categories")}</p>
          <h1>{t("categories.title")}</h1>
          <p>{t("categories.subtitle")}</p>
        </div>
      </header>

      {loading && !data ? <LoadingState /> : null}
      {error && !data ? <ErrorState /> : null}

      {data ? (
        <div className="card-grid">
          {data.map((category) => (
            <article className="entity-card" key={category.id}>
              <div>
                <h2>{category.name}</h2>
                <p>{category.description ?? t("common.noData")}</p>
              </div>
              <div className="entity-count">
                <strong>{category._count.assets}</strong>
                <span>{t("common.assets")}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
