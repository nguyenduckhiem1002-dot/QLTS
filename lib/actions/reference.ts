"use server";

import { LocationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createCategory(formData: FormData) {
  const name = value(formData, "name");
  const description = value(formData, "description") || null;

  if (!name) return;

  await db.category.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/assets/new");
}

export async function createLocation(formData: FormData) {
  const name = value(formData, "name");
  const type = value(formData, "type") as LocationType;
  const address = value(formData, "address") || null;

  if (!name) return;

  const safeType = Object.values(LocationType).includes(type)
    ? type
    : LocationType.OTHER;

  await db.location.upsert({
    where: { name },
    update: { type: safeType, address },
    create: { name, type: safeType, address },
  });

  revalidatePath("/");
  revalidatePath("/locations");
  revalidatePath("/assets/new");
}
