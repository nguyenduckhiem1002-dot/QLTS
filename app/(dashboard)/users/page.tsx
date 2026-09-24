import { UserRole, UserStatus } from "@prisma/client";
import { Check, Minus, UserPlus } from "lucide-react";
import { AutoSubmitSelect } from "@/components/auto-submit-select";
import { Drawer, DrawerCancel } from "@/components/drawer";
import { SubmitButton } from "@/components/submit-button";
import { EmptyState, FieldLabel, Notice, StatusText, WarningNotice } from "@/components/ui";
import {
  createUserAccount,
  resendInvitation,
  testSmtp,
  toggleUserStatus,
  updateUserRole,
} from "@/lib/actions/users";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { requireAdmin } from "@/lib/auth/session";
import { getUsersForAdmin } from "@/lib/data";
import { dateLocaleOf, fill, getInitials } from "@/lib/format";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isSmtpConfigured } from "@/lib/mail";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Tài khoản & phân quyền" };

const successMap: Record<string, TranslationKey> = {
  invited: "users.successInvited",
  created: "users.successCreated",
  resent: "users.successResent",
  role: "users.successRole",
  status: "users.successStatus",
  smtp: "users.successSmtp",
};

const errorMap: Record<string, TranslationKey> = {
  readonly: "users.errorReadonly",
  required: "users.errorRequired",
  duplicate: "users.errorDuplicate",
  smtp_missing: "users.errorSmtpMissing",
  smtp_send: "users.errorSmtpSend",
  password_policy: "users.errorPasswordPolicy",
  self_role: "users.errorSelfRole",
  self_disable: "users.errorSelfDisable",
  last_admin: "users.errorLastAdmin",
  invalid_user: "users.errorInvalidUser",
};

// Rows of the role matrix; "view" is implied for every signed-in account.
const permissionRows: { key: TranslationKey; permission: Permission | null }[] = [
  { key: "users.permView", permission: null },
  { key: "users.permAssets", permission: "assets:write" },
  { key: "users.permReference", permission: "reference:write" },
  { key: "users.permUsers", permission: "users:manage" },
];

const roles = Object.values(UserRole);

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ t, locale }, currentUser, users, params] = await Promise.all([
    getTranslations(),
    requireAdmin(),
    getUsersForAdmin(),
    searchParams,
  ]);

  const demoMode = isDemoMode();
  const smtpReady = isSmtpConfigured();
  const dateFormat = new Intl.DateTimeFormat(dateLocaleOf(locale), { dateStyle: "medium", timeStyle: "short" });
  const successKey = params.success ? successMap[params.success] : undefined;
  const errorKey = params.error ? errorMap[params.error] : undefined;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{t("users.title")}</h1>
          <p>{t("users.subtitle")}</p>
        </div>
        <div className="page-actions">
          {smtpReady ? (
            <form action={testSmtp}>
              <button className="btn" type="submit" disabled={demoMode}>
                {t("users.testSmtp")}
              </button>
            </form>
          ) : null}
          <Drawer
            trigger={
              <>
                <UserPlus size={16} aria-hidden="true" />
                {t("users.create")}
              </>
            }
            title={t("users.create")}
            description={t("users.createHelp")}
            closeLabel={t("common.close")}
          >
            <form action={createUserAccount} className="drawer-form provision-form">
              <div className="drawer-body">
                <label className="field">
                  <FieldLabel required requiredLabel={t("common.required")}>
                    {t("users.name")}
                  </FieldLabel>
                  <input name="name" required autoComplete="off" placeholder={t("users.namePlaceholder")} disabled={demoMode} />
                </label>
                <label className="field">
                  <FieldLabel required requiredLabel={t("common.required")}>
                    {t("users.email")}
                  </FieldLabel>
                  <input
                    name="email"
                    type="email"
                    required
                    autoComplete="off"
                    placeholder={t("users.emailPlaceholder")}
                    disabled={demoMode}
                  />
                </label>

                <fieldset className="choice-group" disabled={demoMode}>
                  <legend className="field-label">{t("users.role")}</legend>
                  {roles.map((role) => (
                    <label className="choice-card" key={role}>
                      <input type="radio" name="role" value={role} defaultChecked={role === UserRole.VIEWER} />
                      <span>
                        <strong>{t(`role.${role}`)}</strong>
                        <small>{t(`roleHelp.${role}`)}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <fieldset className="choice-group" disabled={demoMode}>
                  <legend className="field-label">{t("users.provisionMode")}</legend>
                  <label className="choice-card">
                    <input
                      type="radio"
                      name="provisionMode"
                      value="invite"
                      defaultChecked={smtpReady}
                      disabled={!smtpReady}
                    />
                    <span>
                      <strong>{t("users.invite")}</strong>
                      <small>{smtpReady ? t("users.inviteHelp") : t("users.inviteNeedsSmtp")}</small>
                    </span>
                  </label>
                  <label className="choice-card">
                    <input type="radio" name="provisionMode" value="direct" defaultChecked={!smtpReady} />
                    <span>
                      <strong>{t("users.direct")}</strong>
                      <small>{t("users.directHelp")}</small>
                    </span>
                  </label>
                </fieldset>

                <label className="field password-field">
                  <FieldLabel required requiredLabel={t("common.required")}>
                    {t("users.tempPassword")}
                  </FieldLabel>
                  <input name="password" type="password" autoComplete="new-password" minLength={10} disabled={demoMode} />
                  <small className="field-hint">{t("users.passwordHelp")}</small>
                </label>
              </div>
              <div className="drawer-foot">
                <DrawerCancel>{t("common.cancel")}</DrawerCancel>
                <SubmitButton disabled={demoMode} pendingLabel={t("common.saving")}>
                  {t("users.create")}
                </SubmitButton>
              </div>
            </form>
          </Drawer>
        </div>
      </header>

      {successKey ? <Notice tone="success">{t(successKey)}</Notice> : null}
      {errorKey ? <Notice tone="error">{t(errorKey)}</Notice> : null}
      {smtpReady ? null : <WarningNotice title={t("users.smtpMissingTitle")}>{t("users.smtpMissing")}</WarningNotice>}

      <div className="surface">
        <div className="surface-head">
          <h2>{fill(t("users.countLabel"), { n: users.length })}</h2>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={UserPlus} title={t("common.none")} />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("users.name")}</th>
                  <th>{t("users.role")}</th>
                  <th>{t("users.status")}</th>
                  <th>{t("users.lastLogin")}</th>
                  <th>
                    <span className="sr-only">{t("users.actions")}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="person">
                          <span className="avatar" aria-hidden="true">
                            {getInitials(user.name)}
                          </span>
                          <div>
                            <span className="cell-title">
                              {user.name}
                              {isSelf ? <span className="muted"> ({t("users.you")})</span> : null}
                            </span>
                            <span className="cell-sub">{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isSelf ? (
                          t(`role.${user.role}`)
                        ) : (
                          <form action={updateUserRole} className="inline-form">
                            <input type="hidden" name="userId" value={user.id} />
                            <AutoSubmitSelect
                              name="role"
                              defaultValue={user.role}
                              aria-label={`${t("users.role")}: ${user.name}`}
                              disabled={demoMode}
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {t(`role.${role}`)}
                                </option>
                              ))}
                            </AutoSubmitSelect>
                          </form>
                        )}
                      </td>
                      <td>
                        <StatusText status={user.status} label={t(`userStatus.${user.status}`)} />
                      </td>
                      <td className={user.lastLoginAt ? "num" : "cell-muted"}>
                        {user.lastLoginAt ? dateFormat.format(user.lastLoginAt) : t("users.neverSignedIn")}
                      </td>
                      <td>
                        <div className="ref-actions">
                          {isSelf ? null : user.status === UserStatus.INVITED ? (
                            <form action={resendInvitation}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button className="btn btn-ghost btn-sm" type="submit" disabled={demoMode || !smtpReady}>
                                {t("users.resendInvite")}
                              </button>
                            </form>
                          ) : (
                            <form action={toggleUserStatus}>
                              <input type="hidden" name="userId" value={user.id} />
                              <button
                                className={user.status === UserStatus.DISABLED ? "btn btn-sm" : "btn btn-danger btn-sm"}
                                type="submit"
                                disabled={demoMode}
                              >
                                {user.status === UserStatus.DISABLED ? t("users.enable") : t("users.disable")}
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <section className="surface" aria-labelledby="perm-title">
        <div className="surface-head">
          <h2 id="perm-title">{t("users.permTitle")}</h2>
        </div>
        <div className="table-wrap">
          <table className="perm-table">
            <thead>
              <tr>
                <th>{t("users.permission")}</th>
                {roles.map((role) => (
                  <th key={role}>{t(`role.${role}`)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionRows.map((row) => (
                <tr key={row.key}>
                  <td>{t(row.key)}</td>
                  {roles.map((role) => {
                    const allowed = row.permission === null || hasPermission(role, row.permission);
                    return (
                      <td key={role}>
                        {allowed ? (
                          <Check className="perm-yes" size={17} aria-label={t("users.permYes")} />
                        ) : (
                          <Minus className="perm-no" size={17} aria-label={t("users.permNo")} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
