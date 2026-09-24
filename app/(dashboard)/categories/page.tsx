import { ChevronRight, Tags } from "lucide-react";
import Link from "next/link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
import { EmptyState, FieldLabel, Notice, ReadonlyPanel } from "@/components/ui";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/reference";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getCategories } from "@/lib/data";
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
  const editing = canManage ? categories.find((category) => category.id === params.edit) : undefined;
  const saved = params.saved ? savedMessages[params.saved] : undefined;
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>{t("categories.title")}</h1>
          <p>{t("categories.subtitle")}</p>
        </div>
        <p className="header-count">
          <strong>{categories.length}</strong> {t("categories.count")}
        </p>
      </header>

      {saved ? <Notice tone="success">{t(saved)}</Notice> : null}
      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <div className="split-layout">
        <section className="collection-surface" aria-label={t("categories.title")}>
          {categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title={t("categories.emptyTitle")}
              description={locked ? undefined : t("categories.emptyHelp")}
            />
          ) : (
            <>
              <div className={`collection-heading${canManage ? " collection-heading-link" : ""}`}>
                <span>{t("categories.name")}</span>
                <span>{t("categories.assetCount")}</span>
                {canManage ? <span aria-hidden="true" /> : null}
              </div>
              {categories.map((category) => {
                const content = (
                  <>
                    <div>
                      <h2>{category.name}</h2>
                      {category.description ? <p>{category.description}</p> : null}
                    </div>
                    <strong className="collection-count">{category._count.assets}</strong>
                  </>
                );
                return canManage ? (
                  <Link
                    key={category.id}
                    href={`/categories?edit=${category.id}`}
                    scroll={false}
                    className={`collection-row collection-row-link${
                      editing?.id === category.id ? " is-selected" : ""
                    }`}
                    aria-current={editing?.id === category.id ? "true" : undefined}
                  >
                    {content}
                    <ChevronRight className="row-chevron" size={16} aria-hidden="true" />
                  </Link>
                ) : (
                  <article className="collection-row" key={category.id}>
                    {content}
                  </article>
                );
              })}
            </>
          )}
        </section>

        {locked && !demoMode ? (
          <ReadonlyPanel
            title={t("common.readonlyTitle")}
            message={t("common.readonlyMessage")}
          />
        ) : (
          <aside className="panel side-panel">
            <form
              key={editing?.id ?? "new"}
              action={editing ? updateCategory : createCategory}
              className="side-form"
            >
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <header className="side-form-header">
                <h2>{editing ? t("categories.edit") : t("categories.create")}</h2>
                <p>{editing ? t("categories.editHelp") : t("categories.createHelp")}</p>
              </header>

              <div className="side-form-body">
                <label>
                  <FieldLabel required requiredLabel={t("common.required")}>
                    {t("categories.name")}
                  </FieldLabel>
                  <input
                    name="name"
                    required
                    autoComplete="off"
                    defaultValue={editing?.name}
                    placeholder={t("categories.namePlaceholder")}
                    disabled={locked}
                  />
                </label>
                <label>
                  <FieldLabel optionalLabel={t("common.optional")}>
                    {t("categories.description")}
                  </FieldLabel>
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={editing?.description ?? ""}
                    placeholder={t("categories.descriptionPlaceholder")}
                    disabled={locked}
                  />
                </label>
              </div>

              <footer className="side-form-footer">
                {editing ? (
                  <div className="side-form-actions">
                    <Link className="button button-secondary" href="/categories" scroll={false}>
                      {t("common.cancel")}
                    </Link>
                    <SubmitButton className="button button-primary" disabled={locked} pendingLabel={t("common.saving")}>
                      {t("common.saveChanges")}
                    </SubmitButton>
                  </div>
                ) : (
                  <SubmitButton className="button button-primary button-block" disabled={locked} pendingLabel={t("common.saving")}>
                    {t("categories.create")}
                  </SubmitButton>
                )}
              </footer>
            </form>

            {editing ? (
              <form action={deleteCategory} className="side-form-danger">
                <input type="hidden" name="id" value={editing.id} />
                <ConfirmSubmit
                  label={t("common.delete")}
                  message={t("categories.deleteConfirm")}
                  disabled={locked}
                />
              </form>
            ) : null}
          </aside>
        )}
      </div>
    </section>
  );
}
