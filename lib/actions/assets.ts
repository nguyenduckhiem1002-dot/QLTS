"use server";

import { AssetStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(formData: FormData, key: string) {
  const result = value(formData, key);
  return result || null;
}

export async function createAsset(formData: FormData) {
  const code = value(formData, "code");
  const name = value(formData, "name");
  const serialNumber = optional(formData, "serialNumber");
  const description = optional(formData, "description");
  const categoryId = optional(formData, "categoryId");
  const locationId = optional(formData, "locationId");

  if (!code || !name) {
    redirect("/assets/new?error=required");
  }

  const duplicate = await db.asset.findFirst({
    where: {
      OR: [
        { code },
        ...(serialNumber ? [{ serialNumber }] : []),
      ],
    },
    select: { id: true },
  });

  if (duplicate) {
    redirect("/assets/new?error=duplicate");
  }

  const asset = await db.asset.create({
    data: {
      code,
      name,
      serialNumber,
      description,
      categoryId,
      locationId,
    },
  });

  await db.auditLog.create({
    data: {
      entityType: "Asset",
      entityId: asset.id,
      action: "CREATE",
      payload: { code, name },
    },
  });

  revalidatePath("/");
  revalidatePath("/assets");
  redirect(`/assets/${asset.id}`);
}

export async function assignAsset(formData: FormData) {
  const assetId = value(formData, "assetId");
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
  const assetId = value(formData, "assetId");
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
