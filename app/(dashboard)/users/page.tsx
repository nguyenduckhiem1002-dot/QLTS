import { UserRole, UserStatus } from "@prisma/client";
import { Mail, UserPlus } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { EmptyState, FieldLabel, Notice } from "@/components/ui";
import {
  createUserAccount,
  resendInvitation,
  testSmtp,
  toggleUserStatus,
  updateUserRole,
} from "@/lib/actions/users";
import { requireAdmin } from "@/lib/auth/session";
import { getUsersForAdmin } from "@/lib/data";
import { getInitials } from "@/lib/format";
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
  const dateFormat = new Intl.DateTimeFormat(dateLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

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

  const successKey = params.success ? successMap[params.success] : undefined;
  const errorKey = params.error ? errorMap[params.error] : undefined;

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h1>{t("users.title")}</h1>
          <p>{t("users.subtitle")}</p>
        </div>
        <p className="header-count">
          <strong>{users.length}</strong> {t("users.accounts")}
        </p>
      </header>

      {successKey ? <Notice tone="success">{t(successKey)}</Notice> : null}
      {errorKey ? <Notice tone="error">{t(errorKey)}</Notice> : null}

      <div className={`info-strip${smtpReady ? "" : " info-strip-warning"}`}>
        <span className="info-strip-icon">
          <Mail size={17} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="info-strip-copy">
          <strong>{t("users.smtpTitle")}</strong>
          <span>{smtpReady ? t("users.smtpConfigured") : t("users.smtpMissing")}</span>
        </div>
        <form action={testSmtp}>
          <button
            className="button button-secondary button-compact"
            type="submit"
            disabled={demoMode || !smtpReady}
          >
            {t("users.testSmtp")}
          </button>
        </form>
      </div>

      <div className="split-layout split-layout-wide">
        <div className="table-card">
          {users.length === 0 ? (
            <EmptyState icon={UserPlus} title={t("common.none")} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("users.name")}</th>
                    <th>{t("users.role")}</th>
                    <th>{t("users.status")}</th>
                    <th>{t("users.lastLogin")}</th>
                    <th className="cell-actions">
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
                          <div className="person-cell">
                            <span className="avatar" aria-hidden="true">
                              {getInitials(user.name)}
                            </span>
                            <div>
                              <strong className="cell-primary">{user.name}</strong>
                              <span className="cell-secondary cell-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <form action={updateUserRole} className="inline-form">
                            <input type="hidden" name="userId" value={user.id} />
                            <select
                              name="role"
                              defaultValue={user.role}
                              aria-label={`${t("users.role")}: ${user.name}`}
                              disabled={demoMode || isSelf}
                            >
                              {Object.values(UserRole).map((role) => (
                                <option key={role} value={role}>
                                  {t(`role.${role}`)}
                                </option>
                              ))}
                            </select>
                            {!isSelf ? (
                              <button
                                className="button button-compact button-ghost"
                                type="submit"
                                disabled={demoMode}
                              >
                                {t("common.save")}
                              </button>
                            ) : null}
                          </form>
                        </td>
                        <td>
                          <span className={`status-text user-state-${user.status.toLowerCase()}`}>
                            <i aria-hidden="true" />
                            {t(`userStatus.${user.status}`)}
                          </span>
                        </td>
                        <td>
                          {user.lastLoginAt ? (
                            <span className="cell-date">{dateFormat.format(user.lastLoginAt)}</span>
                          ) : (
                            <span className="cell-muted">{t("users.neverSignedIn")}</span>
                          )}
                        </td>
                        <td className="cell-actions">
                          {isSelf ? null : user.status === UserStatus.INVITED ? (
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
                                className={`button button-compact ${
                                  user.status === UserStatus.DISABLED
                                    ? "button-secondary"
                                    : "button-danger-soft"
                                }`}
                                type="submit"
                                disabled={demoMode}
                              >
                                {user.status === UserStatus.DISABLED
                                  ? t("users.enable")
                                  : t("users.disable")}
                              </button>
                            </form>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form action={createUserAccount} className="panel side-panel side-form provision-form">
          <header className="side-form-header">
            <h2>{t("users.create")}</h2>
            <p>{t("users.createHelp")}</p>
          </header>

          <div className="side-form-body">
            <label>
              <FieldLabel required requiredLabel={t("common.required")}>
                {t("users.name")}
              </FieldLabel>
              <input
                name="name"
                required
                autoComplete="off"
                placeholder={t("users.namePlaceholder")}
                disabled={demoMode}
              />
            </label>
            <label>
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
              <div className="choice-options">
                {Object.values(UserRole).map((role) => (
                  <label className="choice-chip" key={role}>
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      defaultChecked={role === UserRole.VIEWER}
                    />
                    <span>{t(`role.${role}`)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="choice-group" disabled={demoMode}>
              <legend className="field-label">{t("users.provisionMode")}</legend>
              <div className="choice-stack">
                <label className="choice-row">
                  <input
                    type="radio"
                    name="provisionMode"
                    value="invite"
                    defaultChecked={smtpReady}
                    disabled={!smtpReady}
                  />
                  <span>{smtpReady ? t("users.invite") : t("users.inviteNeedsSmtp")}</span>
                </label>
                <label className="choice-row">
                  <input
                    type="radio"
                    name="provisionMode"
                    value="direct"
                    defaultChecked={!smtpReady}
                  />
                  <span>{t("users.direct")}</span>
                </label>
              </div>
            </fieldset>

            {/* Shown only while "direct" is selected; see .provision-form in globals.css. */}
            <label className="password-field">
              <FieldLabel required requiredLabel={t("common.required")}>
                {t("users.tempPassword")}
              </FieldLabel>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                disabled={demoMode}
              />
              <small className="form-hint">{t("users.passwordHelp")}</small>
            </label>
          </div>

          <footer className="side-form-footer">
            <SubmitButton className="button button-primary button-block" disabled={demoMode} pendingLabel={t("common.saving")}>
              {t("users.create")}
            </SubmitButton>
          </footer>
        </form>
      </div>
    </section>
  );
}
