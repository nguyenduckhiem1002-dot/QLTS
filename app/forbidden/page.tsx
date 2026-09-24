import { ShieldX } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n";

export default async function ForbiddenPage() {
  const { t } = await getTranslations();

  return (
    <main id="main-content" className="status-page">
      <ShieldX size={44} strokeWidth={1.6} aria-hidden="true" />
      <h1>{t("auth.forbiddenTitle")}</h1>
      <p>{t("auth.forbiddenText")}</p>
      <Link className="btn btn-primary" href="/">
        {t("common.backHome")}
      </Link>
    </main>
  );
}
