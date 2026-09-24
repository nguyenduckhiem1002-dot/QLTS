import { buildEmployeeLabels } from "@/components/employees-labels";
import { EmployeesScreen } from "@/components/employees-screen";
import { hasPermission } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getEmployeesWithHoldings } from "@/lib/data";
import { getTranslations } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Nhân viên" };

// Loads everything once; selecting, filtering and the add/edit dialog run in the browser.
export default async function EmployeesPage() {
  const [{ t, locale }, employees, currentUser] = await Promise.all([
    getTranslations(),
    getEmployeesWithHoldings(),
    getCurrentUser(),
  ]);

  return (
    <section className="page">
      <EmployeesScreen
        employees={employees}
        labels={buildEmployeeLabels(t)}
        canManage={!isDemoMode() && hasPermission(currentUser?.role, "reference:write")}
        locale={locale}
      />
    </section>
  );
}
