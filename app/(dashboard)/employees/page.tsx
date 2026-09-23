import { createEmployee } from "@/lib/actions/reference";
import { getEmployees } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Nhân viên" };

export default async function EmployeesPage() {
  const [{ t }, employees] = await Promise.all([
    getTranslations(),
    getEmployees(),
  ]);
  const demoMode = isDemoMode();

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t("nav.employees")}</p>
          <h1>{t("employees.title")}</h1>
          <p>{t("employees.subtitle")}</p>
        </div>
      </header>

      <div className="split-layout">
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("employees.code")}</th>
                  <th>{t("employees.name")}</th>
                  <th>{t("employees.department")}</th>
                  <th>{t("employees.email")}</th>
                  <th>{t("employees.currentAssets")}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>
                      <span className="mono-code">{employee.employeeCode}</span>
                    </td>
                    <td>
                      <strong className="cell-primary">{employee.name}</strong>
                    </td>
                    <td>{employee.department ?? "—"}</td>
                    <td className="cell-email">{employee.email ?? "—"}</td>
                    <td>
                      <span className="numeric-value">{employee._count.assets}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {employees.length === 0 ? (
            <div className="empty-state">{t("common.none")}</div>
          ) : null}
        </div>

        <form action={createEmployee} className="panel compact-form">
          <div className="form-intro">
            <span className="form-kicker">{t("nav.employees")}</span>
            <h2>{t("employees.create")}</h2>
          </div>
          <label>
            <span>{t("employees.code")}</span>
            <input name="employeeCode" required disabled={demoMode} />
          </label>
          <label>
            <span>{t("employees.name")}</span>
            <input name="name" required disabled={demoMode} />
          </label>
          <label>
            <span>{t("employees.department")}</span>
            <input name="department" disabled={demoMode} />
          </label>
          <label>
            <span>{t("employees.email")}</span>
            <input name="email" type="email" disabled={demoMode} />
          </label>
          <button className="button button-primary" type="submit" disabled={demoMode}>
            {t("common.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
