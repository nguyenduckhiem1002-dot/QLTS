import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { AssetForm } from "@/components/asset-form";
import { Notice } from "@/components/ui";
import { createAsset } from "@/lib/actions/assets";
import { requirePermission } from "@/lib/auth/session";
import { getAssetFormOptions } from "@/lib/data";
import { getTranslations, type TranslationKey } from "@/lib/i18n";
import { isDemoMode } from "@/lib/runtime";

export const metadata = { title: "Thêm tài sản" };

const errorMessages: Record<string, TranslationKey> = {
  duplicate: "assets.duplicate",
  image_type: "assets.imageTypeError",
  image_size: "assets.imageSizeError",
  barcode: "assets.barcodeError",
  required: "assets.required",
};

export default async function NewAssetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const demoMode = isDemoMode();

  // The permission check runs alongside the data loads; it still redirects before rendering.
  const [, { t }, params, options] = await Promise.all([
    demoMode ? null : requirePermission("assets:write"),
    getTranslations(),
    searchParams,
    getAssetFormOptions(),
  ]);

  const error = params.error ? errorMessages[params.error] : undefined;

  return (
    <section className="page page-narrow">
      <Link className="back-link" href="/assets">
        <ChevronLeft size={16} aria-hidden="true" />
        {t("nav.assets")}
      </Link>
      <header className="page-head">
        <div>
          <h1>{t("assets.createTitle")}</h1>
          <p>{t("assets.createSubtitle")}</p>
        </div>
      </header>

      {error ? <Notice tone="error">{t(error)}</Notice> : null}

      <AssetForm t={t} action={createAsset} options={options} disabled={demoMode} cancelHref="/assets" />
    </section>
  );
}
