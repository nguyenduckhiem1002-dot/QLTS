import { Tags } from "lucide-react";
import { createCategory } from "@/lib/actions/reference";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Danh mục" };

export default async function CategoriesPage() {
  const [{ t }, categories] = await Promise.all([
    getTranslations(),
    db.category.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

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
        <div className="card-grid">
          {categories.map((category) => (
            <article className="entity-card" key={category.id}>
              <div>
                <h2>{category.name}</h2>
                <p>{category.description ?? t("common.none")}</p>
              </div>
              <div className="entity-count">
                <strong>{category._count.assets}</strong>
                <span>{t("common.assets")}</span>
              </div>
            </article>
          ))}
        </div>

        <form action={createCategory} className="panel compact-form">
          <div className="section-icon">
            <Tags size={20} />
          </div>
          <h2>{t("categories.create")}</h2>
          <label>
            <span>{t("categories.name")}</span>
            <input name="name" required />
          </label>
          <label>
            <span>{t("categories.description")}</span>
            <textarea name="description" rows={3} />
          </label>
          <button className="button button-primary" type="submit">
            {t("common.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
