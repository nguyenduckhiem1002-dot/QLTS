import { createCategory } from "@/lib/actions/reference";
import { getCategories } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Danh mục" };

export default async function CategoriesPage() {
  const [{ t }, categories] = await Promise.all([
    getTranslations(),
    getCategories(),
  ]);
  const demoMode = isDemoMode();

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.categories")}</p>
          <h1>{t("categories.title")}</h1>
          <p>{t("categories.subtitle")}</p>
        </div>
      </header>

      <div className="split-layout">
        <section className="collection-surface" aria-label={t("categories.title")}>
          <div className="collection-heading">
            <span>{t("categories.name")}</span>
            <span>{t("categories.assetCount")}</span>
          </div>

          {categories.map((category) => (
            <article className="collection-row" key={category.id}>
              <div>
                <h2>{category.name}</h2>
                <p>{category.description ?? t("common.none")}</p>
              </div>
              <strong className="collection-count">{category._count.assets}</strong>
            </article>
          ))}

          {categories.length === 0 ? (
            <div className="empty-state">{t("common.none")}</div>
          ) : null}
        </section>

        <form action={createCategory} className="panel compact-form">
          <div className="form-intro">
            <span className="form-kicker">{t("nav.categories")}</span>
            <h2>{t("categories.create")}</h2>
          </div>
          <label>
            <span>{t("categories.name")}</span>
            <input name="name" required disabled={demoMode} />
          </label>
          <label>
            <span>{t("categories.description")}</span>
            <textarea name="description" rows={4} disabled={demoMode} />
          </label>
          <button className="button button-primary" type="submit" disabled={demoMode}>
            {t("common.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
