import Link from "next/link";
import { ShieldX } from "lucide-react";
import { getTranslations } from "@/lib/i18n";

export default async function ForbiddenPage() {
  const { t } = await getTranslations();

  return (
    <main id="main-content" className="not-found">
      <ShieldX size={48} />
      <h1>{t("auth.forbiddenTitle")}</h1>
      <p>{t("auth.forbiddenText")}</p>
      <Link className="button button-primary" href="/">
        {t("common.back")}
      </Link>
    </main>
  );
}
