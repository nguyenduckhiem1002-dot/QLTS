import { UserRole, UserStatus } from "@prisma/client";
import {
  createUserAccount,
  resendInvitation,
  testSmtp,
  toggleUserStatus,
  updateUserRole,
} from "@/lib/actions/users";
import { requireAdmin } from "@/lib/auth/session";
import { getUsersForAdmin } from "@/lib/data";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isSmtpConfigured } from "@/lib/mail";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Tài khoản & phân quyền" };

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
  const dateLocale = locale === "vi" ? "vi-VN" : "en-US";

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

  const messageKey = params.success
    ? successMap[params.success]
    : params.error
      ? errorMap[params.error]
      : undefined;

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <p className="eyebrow">{t("nav.users")}</p>
          <h1>{t("users.title")}</h1>
          <p>{t("users.subtitle")}</p>
        </div>

        <form action={testSmtp}>
          <button
            className="button button-secondary"
            type="submit"
            disabled={demoMode || !smtpReady}
          >
            {t("users.testSmtp")}
          </button>
        </form>
      </header>

      {messageKey ? (
        <div className={params.error ? "form-error" : "form-success"}>
          {t(messageKey)}
        </div>
      ) : null}

      <div className="users-toolbar">
        <div className="smtp-status">
          <span className={smtpReady ? "status-dot" : "status-dot status-dot-off"} />
          <div>
            <strong>{t("users.smtpTitle")}</strong>
            <span>
              {smtpReady ? t("users.smtpConfigured") : t("users.smtpMissing")}
            </span>
          </div>
        </div>
        <div className="quiet-tag quiet-tag-strong">
          {users.length} {t("users.accounts")}
        </div>
      </div>

      <div className="users-layout">
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("users.name")}</th>
                  <th>{t("users.role")}</th>
                  <th>{t("users.status")}</th>
                  <th>{t("users.lastLogin")}</th>
                  <th>{t("users.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong className="cell-primary">{user.name}</strong>
                      <span className="cell-secondary">{user.email}</span>
                    </td>
                    <td>
                      <form action={updateUserRole} className="inline-form">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          disabled={demoMode || user.id === currentUser.id}
                        >
                          {Object.values(UserRole).map((role) => (
                            <option key={role} value={role}>
                              {t(`role.${role}`)}
                            </option>
                          ))}
                        </select>
                        <button
                          className="button button-compact button-secondary"
                          type="submit"
                          disabled={demoMode || user.id === currentUser.id}
                        >
                          {t("common.save")}
                        </button>
                      </form>
                    </td>
                    <td>
                      <span className={`user-status user-status-${user.status.toLowerCase()}`}>
                        {t(`userStatus.${user.status}`)}
                      </span>
                    </td>
                    <td>
                      {user.lastLoginAt
                        ? new Intl.DateTimeFormat(dateLocale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(user.lastLoginAt)
                        : "—"}
                    </td>
                    <td>
                      <div className="user-actions">
                        {user.status === UserStatus.INVITED ? (
                          <form action={resendInvitation}>
                            <input type="hidden" name="userId" value={user.id} />
                            <button
                              className="button button-compact button-secondary"
                              type="submit"
                              disabled={demoMode || !smtpReady}
                            >
                              {t("users.resendInvite")}
                            </button>
                          </form>
                        ) : (
                          <form action={toggleUserStatus}>
                            <input type="hidden" name="userId" value={user.id} />
                            <button
                              className="button button-compact button-secondary"
                              type="submit"
                              disabled={demoMode || user.id === currentUser.id}
                            >
                              {user.status === UserStatus.DISABLED
                                ? t("users.enable")
                                : t("users.disable")}
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form action={createUserAccount} className="panel compact-form user-create-form">
          <div className="form-intro">
            <span className="form-kicker">{t("users.access")}</span>
            <h2>{t("users.create")}</h2>
            <p>{t("users.createHelp")}</p>
          </div>

          <label>
            <span>{t("users.name")}</span>
            <input name="name" required disabled={demoMode} />
          </label>
          <label>
            <span>{t("users.email")}</span>
            <input name="email" type="email" required disabled={demoMode} />
          </label>
          <label>
            <span>{t("users.role")}</span>
            <select name="role" defaultValue={UserRole.VIEWER} disabled={demoMode}>
              {Object.values(UserRole).map((role) => (
                <option value={role} key={role}>
                  {t(`role.${role}`)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("users.provisionMode")}</span>
            <select name="provisionMode" defaultValue="invite" disabled={demoMode}>
              <option value="invite">{t("users.invite")}</option>
              <option value="direct">{t("users.direct")}</option>
            </select>
          </label>
          <label>
            <span>{t("users.tempPassword")}</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder={t("users.tempPasswordPlaceholder")}
              disabled={demoMode}
            />
            <small className="form-hint">{t("users.passwordHelp")}</small>
          </label>

          <button className="button button-primary" type="submit" disabled={demoMode}>
            {t("users.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
