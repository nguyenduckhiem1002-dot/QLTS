import { Users } from "lucide-react";
import { createEmployee } from "@/lib/actions/reference";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Nhân viên" };

export default async function EmployeesPage() {
  const [{ t }, employees] = await Promise.all([
    getTranslations(),
    db.employee.findMany({
      include: { _count: { select: { assets: true } } },
      orderBy: [{ name: "asc" }, { employeeCode: "asc" }],
    }),
  ]);

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
                      <span className="asset-link">{employee.employeeCode}</span>
                    </td>
                    <td>
                      <strong>{employee.name}</strong>
                    </td>
                    <td>{employee.department ?? "—"}</td>
                    <td>{employee.email ?? "—"}</td>
                    <td>{employee._count.assets}</td>
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
          <div className="section-icon">
            <Users size={20} />
          </div>
          <h2>{t("employees.create")}</h2>
          <label>
            <span>{t("employees.code")}</span>
            <input name="employeeCode" required />
          </label>
          <label>
            <span>{t("employees.name")}</span>
            <input name="name" required />
          </label>
          <label>
            <span>{t("employees.department")}</span>
            <input name="department" />
          </label>
          <label>
            <span>{t("employees.email")}</span>
            <input name="email" type="email" />
          </label>
          <button className="button button-primary" type="submit">
            {t("common.create")}
          </button>
        </form>
      </div>
    </section>
  );
}
