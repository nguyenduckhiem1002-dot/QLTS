import { LocationType } from "@prisma/client";
import { MapPin, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { EmptyState, Notice, ReadonlyNotice } from "@/components/ui";
import { createLocation, deleteLocation, updateLocation } from "@/lib/actions/reference";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocations } from "@/lib/data";
import { fill } from "@/lib/format";
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
  const editingId = canManage && !demoMode ? params.edit : undefined;
  const saved = params.saved ? savedMessages[params.saved] : undefined;
  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <section className="page page-narrow">
      <header className="page-head">
        <div>
          <h1>{t("locations.title")}</h1>
          <p>{t("locations.subtitle")}</p>
        </div>
      </header>

      {saved ? <Notice tone="success">{t(saved)}</Notice> : null}
      {error ? <Notice tone="error">{t(error)}</Notice> : null}
      {!canManage && !demoMode ? (
        <ReadonlyNotice title={t("common.readonlyTitle")} message={t("common.readonlyMessage")} />
      ) : null}

      {/* Forms live outside the table; inputs join them through the form attribute. */}
      <form id="location-add" action={createLocation} />
      {editingId ? <form id="location-edit" action={updateLocation} /> : null}

      <div className="surface">
        <div className="surface-head">
          <h2>{fill(t("locations.countLabel"), { n: locations.length })}</h2>
        </div>
        <div className="table-wrap">
          <table className="ref-table">
            <thead>
              <tr>
                <th>{t("locations.name")}</th>
                <th>{t("locations.type")}</th>
                <th>{t("locations.address")}</th>
                <th className="num-col">{t("locations.assetCount")}</th>
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
                      form="location-add"
                      name="name"
                      required
                      autoComplete="off"
                      placeholder={t("locations.namePlaceholder")}
                      aria-label={t("locations.name")}
                      disabled={locked}
                    />
                  </td>
                  <td>
                    <select form="location-add" name="type" defaultValue={LocationType.OFFICE} aria-label={t("locations.type")} disabled={locked}>
                      {Object.values(LocationType).map((type) => (
                        <option key={type} value={type}>
                          {t(`location.${type}`)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      form="location-add"
                      name="address"
                      autoComplete="off"
                      placeholder={t("locations.addressPlaceholder")}
                      aria-label={t("locations.address")}
                      disabled={locked}
                    />
                  </td>
                  <td />
                  <td>
                    <div className="ref-actions">
                      <button className="btn btn-primary btn-sm" type="submit" form="location-add" disabled={locked}>
                        <Plus size={15} aria-hidden="true" />
                        {t("common.add")}
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}

              {locations.map((location) =>
                location.id === editingId ? (
                  <tr className="ref-edit" key={location.id}>
                    <td>
                      <input form="location-edit" type="hidden" name="id" value={location.id} />
                      <input
                        form="location-edit"
                        name="name"
                        required
                        autoFocus
                        autoComplete="off"
                        defaultValue={location.name}
                        aria-label={t("locations.name")}
                      />
                    </td>
                    <td>
                      <select form="location-edit" name="type" defaultValue={location.type} aria-label={t("locations.type")}>
                        {Object.values(LocationType).map((type) => (
                          <option key={type} value={type}>
                            {t(`location.${type}`)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        form="location-edit"
                        name="address"
                        autoComplete="off"
                        defaultValue={location.address ?? ""}
                        aria-label={t("locations.address")}
                      />
                    </td>
                    <td className="num-col num">{location._count.assets}</td>
                    <td>
                      <div className="ref-actions">
                        <form action={deleteLocation}>
                          <input type="hidden" name="id" value={location.id} />
                          <ConfirmSubmit label={t("common.delete")} message={t("locations.deleteConfirm")} />
                        </form>
                        <Link className="btn btn-sm" href="/locations" scroll={false}>
                          {t("common.cancel")}
                        </Link>
                        <button className="btn btn-primary btn-sm" type="submit" form="location-edit">
                          {t("common.save")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={location.id}>
                    <td>
                      <span className="cell-title">{location.name}</span>
                    </td>
                    <td>
                      <span className="quiet-tag">{t(`location.${location.type}`)}</span>
                    </td>
                    <td className={location.address ? undefined : "cell-muted"}>{location.address ?? "-"}</td>
                    <td className="num-col">
                      <Link className="ref-count num" href={`/assets?location=${encodeURIComponent(location.name)}`}>
                        {location._count.assets}
                      </Link>
                    </td>
                    {canManage ? (
                      <td>
                        <div className="ref-actions">
                          {locked ? null : (
                            <Link className="btn btn-ghost btn-sm" href={`/locations?edit=${location.id}`} scroll={false}>
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
        {locations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t("locations.emptyTitle")}
            description={locked ? undefined : t("locations.emptyHelp")}
          />
        ) : null}
      </div>
    </section>
  );
}
