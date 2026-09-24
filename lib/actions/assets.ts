"use server";

import { randomUUID } from "node:crypto";
import { AssetStatus, Prisma } from "@prisma/client";
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
  if (isDemoMode()) redirect("/assets?demo=readonly");
  const permission = requirePermission("assets:write");

  const code = value(formData, "code");
  const name = value(formData, "name");
  const serialNumber = optional(formData, "serialNumber");
  const barcode = normalizeBarcode(optional(formData, "barcode"), code);
  const description = optional(formData, "description");
  const categoryId = optional(formData, "categoryId");
  const locationId = optional(formData, "locationId");
  const purchaseDate = parseDate(optional(formData, "purchaseDate"));
  const purchaseCost = parseCost(optional(formData, "purchaseCost"));
  const [, image] = await Promise.all([permission, readImage(formData)]);

  if (!code || !name) {
    redirect("/assets/new?error=required");
  }

  if (!barcode || barcode.length > 80) {
    redirect("/assets/new?error=barcode");
  }

  // Batch transaction: the id is generated up front so both writes can be sent
  // together instead of holding an interactive transaction open across round trips.
  const assetId = randomUUID();

  try {
    await db.$transaction([
      db.asset.create({
        data: {
          id: assetId,
          code,
          name,
          serialNumber,
          barcode,
          description,
          categoryId,
          locationId,
          purchaseDate,
          purchaseCost,
          ...(image
            ? {
                image: {
                  create: image,
                },
              }
            : {}),
        },
        select: { id: true },
      }),
      db.auditLog.create({
        data: {
          entityType: "Asset",
          entityId: assetId,
          action: "CREATE",
          payload: {
            code,
            name,
            barcode,
            hasImage: Boolean(image),
          },
        },
      }),
    ]);
  } catch (error) {
    // Code, serial and barcode are unique columns.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect("/assets/new?error=duplicate");
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/assets");
  redirect(`/assets/${assetId}`);
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

  const now = new Date();

  await db.$transaction([
    db.assetAssignment.updateMany({
      where: { assetId, returnedAt: null },
      data: { returnedAt: now },
    }),
    db.assetAssignment.create({
      data: { assetId, employeeId, note },
    }),
    db.asset.update({
      where: { id: assetId },
      data: {
        custodianId: employeeId,
        status: AssetStatus.IN_USE,
      },
    }),
    db.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: assetId,
        action: "ASSIGN",
        payload: { employeeId, note },
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}?success=assigned`);
}

export async function returnAsset(formData: FormData) {
  if (!isDemoMode()) await requirePermission("assets:write");
  const assetId = value(formData, "assetId");
  if (isDemoMode()) redirect(assetId ? `/assets/${assetId}?demo=readonly` : "/assets");
  if (!assetId) return;

  const now = new Date();

  await db.$transaction([
    db.assetAssignment.updateMany({
      where: { assetId, returnedAt: null },
      data: { returnedAt: now },
    }),
    db.asset.update({
      where: { id: assetId },
      data: {
        custodianId: null,
        status: AssetStatus.AVAILABLE,
      },
    }),
    db.auditLog.create({
      data: {
        entityType: "Asset",
        entityId: assetId,
        action: "RETURN",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}?success=returned`);
}

const EDITABLE_STATUSES: AssetStatus[] = [
  AssetStatus.AVAILABLE,
  AssetStatus.MAINTENANCE,
  AssetStatus.LOST,
  AssetStatus.DISPOSED,
];

function parseDate(raw: string | null) {
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseCost(raw: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/[^d]/g, "");
  return digits ? new Prisma.Decimal(digits) : null;
}

export async function updateAsset(formData: FormData) {
  const assetId = value(formData, "assetId");
  if (isDemoMode()) redirect(assetId ? `/assets/${assetId}?demo=readonly` : "/assets");
  if (!assetId) redirect("/assets");

  const editPath = `/assets/${assetId}/edit`;
  const code = value(formData, "code");
  const name = value(formData, "name");
  const serialNumber = optional(formData, "serialNumber");
  const barcode = normalizeBarcode(optional(formData, "barcode"), code);
  const description = optional(formData, "description");
  const categoryId = optional(formData, "categoryId");
  const locationId = optional(formData, "locationId");
  const purchaseDate = parseDate(optional(formData, "purchaseDate"));
  const purchaseCost = parseCost(optional(formData, "purchaseCost"));
  const requestedStatus = value(formData, "status") as AssetStatus;

  if (!code || !name) redirect(`${editPath}?error=required`);
  if (!barcode || barcode.length > 80) redirect(`${editPath}?error=barcode`);

  const [, current] = await Promise.all([
    requirePermission("assets:write"),
    db.asset.findUnique({
      where: { id: assetId },
      select: { custodianId: true, status: true },
    }),
  ]);
  if (!current) redirect("/assets");

  // While someone holds the asset, IN_USE is driven by assign/return, not by this form.
  const status = current.custodianId
    ? AssetStatus.IN_USE
    : EDITABLE_STATUSES.includes(requestedStatus)
      ? requestedStatus
      : current.status === AssetStatus.IN_USE
        ? AssetStatus.AVAILABLE
        : current.status;

  try {
    await db.$transaction([
      db.asset.update({
        where: { id: assetId },
        data: {
          code,
          name,
          serialNumber,
          barcode,
          description,
          categoryId,
          locationId,
          purchaseDate,
          purchaseCost,
          status,
        },
      }),
      db.auditLog.create({
        data: {
          entityType: "Asset",
          entityId: assetId,
          action: "UPDATE",
          payload: { code, name, status },
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      redirect(`${editPath}?error=duplicate`);
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}?success=updated`);
}

// Returns an asset to storage without navigating; used from the employees screen.
export async function returnAssetToStorage(
  assetId: string,
): Promise<{ ok: true } | { ok: false; error: "readonly" | "not_found" }> {
  if (isDemoMode()) return { ok: false, error: "readonly" };
  await requirePermission("assets:write");

  try {
    await db.$transaction([
      db.assetAssignment.updateMany({
        where: { assetId, returnedAt: null },
        data: { returnedAt: new Date() },
      }),
      db.asset.update({
        where: { id: assetId },
        data: { custodianId: null, status: AssetStatus.AVAILABLE },
      }),
      db.auditLog.create({
        data: { entityType: "Asset", entityId: assetId, action: "RETURN" },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "not_found" };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/assets");
  revalidatePath("/employees");
  revalidatePath(`/assets/${assetId}`);
  return { ok: true };
}
