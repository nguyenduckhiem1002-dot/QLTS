"use server";

import { AssetStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AssetImageError,
  parseAssetImage,
} from "@/lib/asset-media";
import { requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  const result = value(formData, key);
  return result || null;
}

function normalizeBarcode(rawBarcode: string | null, code: string) {
  return (rawBarcode || code).trim();
}

async function readImage(formData: FormData, key = "image") {
  try {
    return await parseAssetImage(formData.get(key));
  } catch (error) {
    if (error instanceof AssetImageError) {
      redirect(`/assets/new?error=${error.code}`);
    }
    throw error;
  }
}

export async function createAsset(formData: FormData) {
  if (!isDemoMode()) await requirePermission("assets:write");
  if (isDemoMode()) redirect("/assets?demo=readonly");

  const code = value(formData, "code");
  const name = value(formData, "name");
  const serialNumber = optional(formData, "serialNumber");
  const barcode = normalizeBarcode(optional(formData, "barcode"), code);
  const description = optional(formData, "description");
  const categoryId = optional(formData, "categoryId");
  const locationId = optional(formData, "locationId");
  const image = await readImage(formData);

  if (!code || !name) {
    redirect("/assets/new?error=required");
  }

  if (!barcode || barcode.length > 80) {
    redirect("/assets/new?error=barcode");
  }

  const duplicate = await db.asset.findFirst({
    where: {
      OR: [
        { code },
        { barcode },
        ...(serialNumber ? [{ serialNumber }] : []),
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    redirect("/assets/new?error=duplicate");
  }

  const asset = await db.$transaction(async (tx) => {
    const created = await tx.asset.create({
      data: {
        code,
        name,
        serialNumber,
        barcode,
        description,
        categoryId,
        locationId,
        ...(image
          ? {
              image: {
                create: image,
              },
            }
          : {}),
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: created.id,
        action: "CREATE",
        payload: {
          code,
          name,
          barcode,
          hasImage: Boolean(image),
        },
      },
    });

    return created;
  });

  revalidatePath("/");
  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function replaceAssetImage(formData: FormData) {
  if (!isDemoMode()) await requirePermission("assets:write");
  const assetId = value(formData, "assetId");

  if (isDemoMode()) {
    redirect(assetId ? `/assets/${assetId}?demo=readonly` : "/assets");
  }

  if (!assetId) return;

  let image;
  try {
    image = await parseAssetImage(formData.get("image"));
  } catch (error) {
    if (error instanceof AssetImageError) {
      redirect(`/assets/${assetId}?error=${error.code}`);
    }
    throw error;
  }

  if (!image) {
    redirect(`/assets/${assetId}?error=image_required`);
  }

  await db.$transaction([
    db.assetImage.upsert({
      where: { assetId },
      update: image,
      create: {
        assetId,
        ...image,
      },
    }),
    db.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: assetId,
        action: "REPLACE_IMAGE",
        payload: {
          fileName: image.fileName,
          mimeType: image.mimeType,
          size: image.size,
        },
      },
    }),
  ]);

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}?success=image`);
}

export async function removeAssetImage(formData: FormData) {
  if (!isDemoMode()) await requirePermission("assets:write");
  const assetId = value(formData, "assetId");

  if (isDemoMode()) {
    redirect(assetId ? `/assets/${assetId}?demo=readonly` : "/assets");
  }

  if (!assetId) return;

  await db.$transaction([
    db.assetImage.deleteMany({ where: { assetId } }),
    db.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: assetId,
        action: "REMOVE_IMAGE",
      },
    }),
  ]);

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}?success=image_removed`);
}

export async function assignAsset(formData: FormData) {
  if (!isDemoMode()) await requirePermission("assets:write");
  const assetId = value(formData, "assetId");
  if (isDemoMode()) redirect(assetId ? `/assets/${assetId}?demo=readonly` : "/assets");

  const employeeId = value(formData, "employeeId");
  const note = optional(formData, "note");

  if (!assetId || !employeeId) return;

  await db.$transaction(async (tx) => {
    const now = new Date();

    await tx.assetAssignment.updateMany({
      where: { assetId, returnedAt: null },
      data: { returnedAt: now },
    });

    await tx.assetAssignment.create({
      data: { assetId, employeeId, note },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: {
        custodianId: employeeId,
        status: AssetStatus.IN_USE,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: assetId,
        action: "ASSIGN",
        payload: { employeeId, note },
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
}

export async function returnAsset(formData: FormData) {
  if (!isDemoMode()) await requirePermission("assets:write");
  const assetId = value(formData, "assetId");
  if (isDemoMode()) redirect(assetId ? `/assets/${assetId}?demo=readonly` : "/assets");
  if (!assetId) return;

  await db.$transaction(async (tx) => {
    const now = new Date();

    await tx.assetAssignment.updateMany({
      where: { assetId, returnedAt: null },
      data: { returnedAt: now },
    });

    await tx.asset.update({
      where: { id: assetId },
      data: {
        custodianId: null,
        status: AssetStatus.AVAILABLE,
      },
    });

    await tx.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: assetId,
        action: "RETURN",
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
}
