import { LocationType } from "@prisma/client";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { SubmitButton } from "@/components/submit-button";
import { EmptyState, FieldLabel, Notice, ReadonlyPanel } from "@/components/ui";
import { createLocation, deleteLocation, updateLocation } from "@/lib/actions/reference";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocations } from "@/lib/data";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Vị trí" };

const savedMessages: Record<string, TranslationKey> = {
  created: "locations.savedCreated",
  updated: "locations.savedUpdated",
  edited: "common.savedEdited",
  deleted: "locations.savedDeleted",
};

const errorMessages: Record<string, TranslationKey> = {
  required: "common.errorRequired",
  duplicate: "locations.errorDuplicate",
};

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; edit?: string }>;
}) {
  const [{ t }, locations, currentUser, params] = await Promise.all([
    getTranslations(),
    getLocations(),
    getCurrentUser(),
    searchParams,
  ]);
  const demoMode = isDemoMode();
  const canManage = hasPermission(currentUser?.role, "reference:write");
  const locked = demoMode || !canManage;
  const editing = canManage ? locations.find((location) => location.id === params.edit) : undefined;
  const saved = params.saved ? savedMessages[params.saved] : undefined;
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>{t("locations.title")}</h1>
          <p>{t("locations.subtitle")}</p>
        </div>
        <p className="header-count">
          <strong>{locations.length}</strong> {t("locations.count")}
        </p>
      </header>

      {saved ? <Notice tone="success">{t(saved)}</Notice> : null}
      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <div className="split-layout">
        <section className="collection-surface" aria-label={t("locations.title")}>
          {locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title={t("locations.emptyTitle")}
              description={locked ? undefined : t("locations.emptyHelp")}
            />
          ) : (
            <>
              <div className={`collection-heading${canManage ? " collection-heading-link" : ""}`}>
                <span>{t("locations.name")}</span>
                <span>{t("locations.assetCount")}</span>
                {canManage ? <span aria-hidden="true" /> : null}
              </div>
              {locations.map((location) => {
                const content = (
                  <>
                    <div>
                      <div className="collection-title-line">
                        <h2>{location.name}</h2>
                        <span className="quiet-tag">{t(`location.${location.type}`)}</span>
                      </div>
                      {location.address ? <p>{location.address}</p> : null}
                    </div>
                    <strong className="collection-count">{location._count.assets}</strong>
                  </>
                );
                return canManage ? (
                  <Link
                    key={location.id}
                    href={`/locations?edit=${location.id}`}
                    scroll={false}
                    className={`collection-row collection-row-link${
                      editing?.id === location.id ? " is-selected" : ""
                    }`}
                    aria-current={editing?.id === location.id ? "true" : undefined}
                  >
                    {content}
                    <ChevronRight className="row-chevron" size={16} aria-hidden="true" />
                  </Link>
                ) : (
                  <article className="collection-row" key={location.id}>
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
              action={editing ? updateLocation : createLocation}
              className="side-form"
            >
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
              <header className="side-form-header">
                <h2>{editing ? t("locations.edit") : t("locations.create")}</h2>
                <p>{editing ? t("locations.editHelp") : t("locations.createHelp")}</p>
              </header>

              <div className="side-form-body">
                <label>
                  <FieldLabel required requiredLabel={t("common.required")}>
                    {t("locations.name")}
                  </FieldLabel>
                  <input
                    name="name"
                    required
                    autoComplete="off"
                    defaultValue={editing?.name}
                    placeholder={t("locations.namePlaceholder")}
                    disabled={locked}
                  />
                </label>

                <fieldset className="choice-group" disabled={locked}>
                  <legend className="field-label">{t("locations.type")}</legend>
                  <div className="choice-options">
                    {Object.values(LocationType).map((type) => (
                      <label className="choice-chip" key={type}>
                        <input
                          type="radio"
                          name="type"
                          value={type}
                          defaultChecked={type === (editing?.type ?? LocationType.OFFICE)}
                        />
                        <span>{t(`location.${type}`)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <label>
                  <FieldLabel optionalLabel={t("common.optional")}>
                    {t("locations.address")}
                  </FieldLabel>
                  <input
                    name="address"
                    autoComplete="off"
                    defaultValue={editing?.address ?? ""}
                    placeholder={t("locations.addressPlaceholder")}
                    disabled={locked}
                  />
                </label>
              </div>

              <footer className="side-form-footer">
                {editing ? (
                  <div className="side-form-actions">
                    <Link className="button button-secondary" href="/locations" scroll={false}>
                      {t("common.cancel")}
                    </Link>
                    <SubmitButton className="button button-primary" disabled={locked} pendingLabel={t("common.saving")}>
                      {t("common.saveChanges")}
                    </SubmitButton>
                  </div>
                ) : (
                  <SubmitButton className="button button-primary button-block" disabled={locked} pendingLabel={t("common.saving")}>
                    {t("locations.create")}
                  </SubmitButton>
                )}
              </footer>
            </form>

            {editing ? (
              <form action={deleteLocation} className="side-form-danger">
                <input type="hidden" name="id" value={editing.id} />
                <ConfirmSubmit
                  label={t("common.delete")}
                  message={t("locations.deleteConfirm")}
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
