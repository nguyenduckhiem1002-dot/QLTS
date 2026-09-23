"use server";

import { LocationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime";
import { requirePermission } from "@/lib/auth/session";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createCategory(formData: FormData) {
  if (!isDemoMode()) await requirePermission("reference:write");
  if (isDemoMode()) redirect("/categories?demo=readonly");

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
  if (!isDemoMode()) await requirePermission("reference:write");
  if (isDemoMode()) redirect("/locations?demo=readonly");

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

export async function createEmployee(formData: FormData) {
  if (!isDemoMode()) await requirePermission("reference:write");
  if (isDemoMode()) redirect("/employees?demo=readonly");

  const employeeCode = value(formData, "employeeCode");
  const name = value(formData, "name");
  const email = value(formData, "email") || null;
  const department = value(formData, "department") || null;

  if (!employeeCode || !name) return;

  const existing = await db.employee.findUnique({
    where: { employeeCode },
    select: { id: true },
  });

  if (existing) {
    await db.employee.update({
      where: { id: existing.id },
      data: { name, email, department },
    });
  } else {
    await db.employee.create({
      data: { employeeCode, name, email, department },
    });
  }

  revalidatePath("/employees");
  revalidatePath("/assets");
}
