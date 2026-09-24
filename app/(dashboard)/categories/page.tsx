import { Pencil, Plus, Tags } from "lucide-react";
import Link from "next/link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState, Notice, ReadonlyNotice } from "@/components/ui";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/reference";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/data";
import { fill } from "@/lib/format";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Danh mục" };

const savedMessages: Record<string, TranslationKey> = {
  created: "categories.savedCreated",
  updated: "categories.savedUpdated",
  edited: "common.savedEdited",
  deleted: "categories.savedDeleted",
};

const errorMessages: Record<string, TranslationKey> = {
  required: "common.errorRequired",
  duplicate: "categories.errorDuplicate",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const [{ t }, categories, currentUser, params] = await Promise.all([
    getTranslations(),
    getCategories(),
    getCurrentUser(),
    searchParams,
  ]);
  const demoMode = isDemoMode();
  const canManage = hasPermission(currentUser?.role, "reference:write");
  const locked = demoMode || !canManage;
  const editingId = canManage && !demoMode ? params.edit : undefined;
  const saved = params.saved ? savedMessages[params.saved] : undefined;
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <section className="page page-narrow">
      <header className="page-head">
        <div>
          <h1>{t("categories.title")}</h1>
          <p>{t("categories.subtitle")}</p>
        </div>
      </header>

      {saved ? <Notice tone="success">{t(saved)}</Notice> : null}
      {error ? <Notice tone="error">{t(error)}</Notice> : null}
      {!canManage && !demoMode ? (
        <ReadonlyNotice title={t("common.readonlyTitle")} message={t("common.readonlyMessage")} />
      ) : null}

      {/* Forms live outside the table; inputs join them through the form attribute. */}
      <form id="category-add" action={createCategory} />
      {editingId ? <form id="category-edit" action={updateCategory} /> : null}

      <div className="surface">
        <div className="surface-head">
          <h2>{fill(t("categories.countLabel"), { n: categories.length })}</h2>
        </div>
        <div className="table-wrap">
          <table className="ref-table">
            <thead>
              <tr>
                <th>{t("categories.name")}</th>
                <th>{t("categories.description")}</th>
                <th className="num-col">{t("categories.assetCount")}</th>
                {canManage ? (
                  <th>
                    <span className="sr-only">{t("users.actions")}</span>
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {canManage ? (
                <tr className="ref-add">
                  <td>
                    <input
                      form="category-add"
                      name="name"
                      required
                      autoComplete="off"
                      placeholder={t("categories.namePlaceholder")}
                      aria-label={t("categories.name")}
                      disabled={locked}
                    />
                  </td>
                  <td>
                    <input
                      form="category-add"
                      name="description"
                      autoComplete="off"
                      placeholder={t("categories.descriptionPlaceholder")}
                      aria-label={t("categories.description")}
                      disabled={locked}
                    />
                  </td>
                  <td />
                  <td>
                    <div className="ref-actions">
                      <button className="btn btn-primary btn-sm" type="submit" form="category-add" disabled={locked}>
                        <Plus size={15} aria-hidden="true" />
                        {t("common.add")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {categories.map((category) =>
                category.id === editingId ? (
                  <tr className="ref-edit" key={category.id}>
                    <td>
                      <input form="category-edit" type="hidden" name="id" value={category.id} />
                      <input
                        form="category-edit"
                        name="name"
                        required
                        autoFocus
                        autoComplete="off"
                        defaultValue={category.name}
                        aria-label={t("categories.name")}
                      />
                    </td>
                    <td>
                      <input
                        form="category-edit"
                        name="description"
                        autoComplete="off"
                        defaultValue={category.description ?? ""}
                        aria-label={t("categories.description")}
                      />
                    </td>
                    <td className="num-col num">{category._count.assets}</td>
                    <td>
                      <div className="ref-actions">
                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={category.id} />
                          <ConfirmSubmit label={t("common.delete")} message={t("categories.deleteConfirm")} />
                        </form>
                        <Link className="btn btn-sm" href="/categories" scroll={false}>
                          {t("common.cancel")}
                        </Link>
                        <button className="btn btn-primary btn-sm" type="submit" form="category-edit">
                          {t("common.save")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={category.id}>
                    <td>
                      <span className="cell-title">{category.name}</span>
                    </td>
                    <td className={category.description ? undefined : "cell-muted"}>
                      {category.description ?? "-"}
                    </td>
                    <td className="num-col">
                      <Link className="ref-count num" href={`/assets?category=${encodeURIComponent(category.name)}`}>
                        {category._count.assets}
                      </Link>
                    </td>
                    {canManage ? (
                      <td>
                        <div className="ref-actions">
                          {locked ? null : (
                            <Link className="btn btn-ghost btn-sm" href={`/categories?edit=${category.id}`} scroll={false}>
                              <Pencil size={14} aria-hidden="true" />
                              {t("common.edit")}
                            </Link>
                          )}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
        {categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title={t("categories.emptyTitle")}
            description={locked ? undefined : t("categories.emptyHelp")}
          />
        ) : null}
      </div>
    </section>
  );
}
