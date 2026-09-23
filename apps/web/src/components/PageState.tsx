import { AlertCircle, LoaderCircle } from "lucide-react";
import { useI18n } from "../i18n";

export function LoadingState() {
  const { t } = useI18n();

  return (
    <div className="page-state">
      <LoaderCircle className="spin" size={24} />
      <span>{t("common.loading")}</span>
    </div>
  );
}

export function ErrorState() {
  const { t } = useI18n();

  return (
    <div className="page-state page-state-error">
      <AlertCircle size={24} />
      <span>{t("error.load")}</span>
    </div>
  );
}
