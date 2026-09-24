import { Tags } from "lucide-react";
import Link from "next/link";
import { AssetLabel } from "@/components/asset-label";
import { PrintButton } from "@/components/print-button";
import { EmptyState } from "@/components/ui";
import { getAssetsForLabels } from "@/lib/data";
import { fill } from "@/lib/format";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "In tem" };

export default async function LabelsPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const [{ t }, params] = await Promise.all([getTranslations(), searchParams]);
  const assets = await getAssetsForLabels((params.ids ?? "").split(",").filter(Boolean));

  return (
    <section className="page">
      <header className="page-head no-print">
        <div>
          <h1>{t("labels.title")}</h1>
          <p>{fill(t("labels.subtitle"), { n: assets.length })}</p>
        </div>
        <div className="page-actions">
          <Link className="btn" href="/assets">
            {t("common.back")}
          </Link>
          {assets.length ? <PrintButton label={t("labels.print")} /> : null}
        </div>
      </header>

      {assets.length ? (
        <div className="label-sheet">
          {assets.map((asset) => (
            <AssetLabel
              key={asset.id}
              owner={t("assets.tagOwner")}
              code={asset.code}
              name={asset.name}
              meta={asset.location?.name}
              barcodeSrc={`/api/assets/${asset.id}/barcode`}
              barcodeAlt={`${t("assets.barcode")} ${asset.barcode || asset.code}`}
            />
          ))}
        </div>
      ) : (
        <div className="surface">
          <EmptyState icon={Tags} title={t("labels.emptyTitle")} description={t("labels.emptyHelp")} />
        </div>
      )}
    </section>
  );
}
