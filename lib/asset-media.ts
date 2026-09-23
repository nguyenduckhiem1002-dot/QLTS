export const MAX_ASSET_IMAGE_BYTES = 4 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type AssetImageUpload = {
  fileName: string;
  mimeType: string;
  size: number;
  data: Buffer;
};

export class AssetImageError extends Error {
  constructor(
    public readonly code: "image_type" | "image_size",
    message: string,
  ) {
    super(message);
  }
}

export async function parseAssetImage(
  entry: FormDataEntryValue | null,
): Promise<AssetImageUpload | null> {
  if (!(entry instanceof File) || entry.size === 0) return null;

  if (!allowedImageTypes.has(entry.type)) {
    throw new AssetImageError(
      "image_type",
      "Only JPEG, PNG and WebP asset images are supported.",
    );
  }

  if (entry.size > MAX_ASSET_IMAGE_BYTES) {
    throw new AssetImageError(
      "image_size",
      "Asset images must be 4 MB or smaller.",
    );
  }

  return {
    fileName: entry.name || "asset-image",
    mimeType: entry.type,
    size: entry.size,
    data: Buffer.from(await entry.arrayBuffer()),
  };
}
