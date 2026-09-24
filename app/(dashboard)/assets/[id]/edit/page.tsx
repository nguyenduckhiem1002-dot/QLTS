import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetForm } from "@/components/asset-form";
import { Notice } from "@/components/ui";
import { updateAsset } from "@/lib/actions/assets";
import { requirePermission } from "@/lib/auth/session";
import { getAssetForEdit, getAssetFormOptions } from "@/lib/data";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Sửa tài sản" };

const errorMessages: Record<string, TranslationKey> = {
  required: "assets.required",
  barcode: "assets.barcodeError",
  duplicate: "assets.duplicate",
};

export default async function EditAssetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const demoMode = isDemoMode();
  const { id } = await params;

  // The permission check runs alongside the data loads instead of before them.
  const [, { t }, asset, options, query] = await Promise.all([
    demoMode ? null : requirePermission("assets:write"),
    getTranslations(),
    getAssetForEdit(id),
    getAssetFormOptions(),
    searchParams,
  ]);

  if (!asset) notFound();

  const error = query.error ? errorMessages[query.error] : undefined;

  return (
    <section className="page page-narrow">
      <Link className="back-link" href={`/assets/${asset.id}`}>
        <ChevronLeft size={16} aria-hidden="true" />
        {asset.code}
      </Link>
      <header className="page-head">
        <div>
          <h1>{t("assets.edit")}</h1>
          <p>{asset.name}</p>
        </div>
      </header>

      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <AssetForm
        t={t}
        action={updateAsset}
        asset={asset}
        options={options}
        disabled={demoMode}
        cancelHref={`/assets/${asset.id}`}
      />
    </section>
  );
}
