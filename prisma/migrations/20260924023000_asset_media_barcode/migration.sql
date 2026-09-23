ALTER TABLE "Asset" ADD COLUMN "barcode" TEXT;

CREATE UNIQUE INDEX "Asset_barcode_key" ON "Asset"("barcode");

CREATE TABLE "AssetImage" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetImage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetImage_assetId_key" ON "AssetImage"("assetId");
CREATE INDEX "AssetImage_updatedAt_idx" ON "AssetImage"("updatedAt");

ALTER TABLE "AssetImage"
ADD CONSTRAINT "AssetImage_assetId_fkey"
FOREIGN KEY ("assetId") REFERENCES "Asset"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
