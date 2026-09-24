import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getTranslations();

  return (
    <main id="main-content" className="status-page">
      <strong>404</strong>
      <h1>{t("common.notFoundTitle")}</h1>
      <p>{t("common.notFoundText")}</p>
      <Link className="btn btn-primary" href="/">
        {t("common.backHome")}
      </Link>
    </main>
  );
}
