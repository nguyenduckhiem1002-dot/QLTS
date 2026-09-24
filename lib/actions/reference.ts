"use server";

import { LocationType, Prisma } from "@prisma/client";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { CATEGORY_LOCATION_OPTIONS_TAG, EMPLOYEE_OPTIONS_TAG } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime";
import { requirePermission } from "@/lib/auth/session";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

async function guard(path: string) {
  if (isDemoMode()) redirect(`${path}?demo=readonly`);
  await requirePermission("reference:write");
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function refresh(...paths: string[]) {
  // Drop the cached dropdown lists so asset forms see the change immediately.
  updateTag(CATEGORY_LOCATION_OPTIONS_TAG);
  updateTag(EMPLOYEE_OPTIONS_TAG);
  for (const path of ["/", "/assets", "/assets/new", ...paths]) revalidatePath(path);
}

function safeLocationType(raw: string) {
  return Object.values(LocationType).includes(raw as LocationType)
    ? (raw as LocationType)
    : LocationType.OTHER;
}

/* Categories */

export async function createCategory(formData: FormData) {
  await guard("/categories");

  const name = value(formData, "name");
  const description = value(formData, "description") || null;

  if (!name) redirect("/categories?error=required");

  const existing = await db.category.findUnique({ where: { name }, select: { id: true } });

  await db.category.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

  refresh("/categories");
  redirect(`/categories?saved=${existing ? "updated" : "created"}`);
}

export async function updateCategory(formData: FormData) {
  await guard("/categories");

  const id = value(formData, "id");
  const name = value(formData, "name");
  const description = value(formData, "description") || null;

  if (!id) redirect("/categories");
  if (!name) redirect(`/categories?edit=${id}&error=required`);

  try {
    await db.category.update({ where: { id }, data: { name, description } });
  } catch (error) {
    if (isUniqueViolation(error)) redirect(`/categories?edit=${id}&error=duplicate`);
    throw error;
  }

  refresh("/categories");
  redirect("/categories?saved=edited");
}

export async function deleteCategory(formData: FormData) {
  await guard("/categories");

  const id = value(formData, "id");
  if (!id) redirect("/categories");

  // Assets keep existing; their category becomes empty (onDelete: SetNull).
  await db.category.delete({ where: { id } });

  refresh("/categories");
  redirect("/categories?saved=deleted");
}

/* Locations */

export async function createLocation(formData: FormData) {
  await guard("/locations");

  const name = value(formData, "name");
  const type = safeLocationType(value(formData, "type"));
  const address = value(formData, "address") || null;

  if (!name) redirect("/locations?error=required");

  const existing = await db.location.findUnique({ where: { name }, select: { id: true } });

  await db.location.upsert({
    where: { name },
    update: { type, address },
    create: { name, type, address },
  });

  refresh("/locations");
  redirect(`/locations?saved=${existing ? "updated" : "created"}`);
}

export async function updateLocation(formData: FormData) {
  await guard("/locations");

  const id = value(formData, "id");
  const name = value(formData, "name");
  const type = safeLocationType(value(formData, "type"));
  const address = value(formData, "address") || null;

  if (!id) redirect("/locations");
  if (!name) redirect(`/locations?edit=${id}&error=required`);

  try {
    await db.location.update({ where: { id }, data: { name, type, address } });
  } catch (error) {
    if (isUniqueViolation(error)) redirect(`/locations?edit=${id}&error=duplicate`);
    throw error;
  }

  refresh("/locations");
  redirect("/locations?saved=edited");
}

export async function deleteLocation(formData: FormData) {
  await guard("/locations");

  const id = value(formData, "id");
  if (!id) redirect("/locations");

  // Assets keep existing; their location becomes empty (onDelete: SetNull).
  await db.location.delete({ where: { id } });

  refresh("/locations");
  redirect("/locations?saved=deleted");
}

/* Employees (used by the client-side employees screen; results instead of redirects). */

export type EmployeeInput = {
  id?: string;
  employeeCode: string;
  name: string;
  department?: string | null;
  email?: string | null;
};

export type EmployeeActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "readonly" | "required" | "duplicate" | "in_use" | "not_found" };

export async function saveEmployee(input: EmployeeInput): Promise<EmployeeActionResult> {
  if (isDemoMode()) return { ok: false, error: "readonly" };
  await requirePermission("reference:write");

  const employeeCode = input.employeeCode.trim().toUpperCase();
  const name = input.name.trim().replace(/\s+/g, " ");
  const department = input.department?.trim() || null;
  const email = input.email?.trim().toLowerCase() || null;

  if (!employeeCode || !name) return { ok: false, error: "required" };

  try {
    const saved = input.id
      ? await db.employee.update({
          where: { id: input.id },
          data: { employeeCode, name, department, email },
          select: { id: true },
        })
      : await db.employee.create({
          data: { employeeCode, name, department, email },
          select: { id: true },
        });
    refresh("/employees");
    return { ok: true, id: saved.id };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "duplicate" };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: "not_found" };
    }
    throw error;
  }
}

export async function removeEmployee(id: string): Promise<EmployeeActionResult> {
  if (isDemoMode()) return { ok: false, error: "readonly" };
  await requirePermission("reference:write");

  const usage = await db.employee.findUnique({
    where: { id },
    select: { _count: { select: { assets: true, assignments: true } } },
  });
  if (!usage) return { ok: false, error: "not_found" };
  if (usage._count.assets > 0 || usage._count.assignments > 0) {
    return { ok: false, error: "in_use" };
  }

  await db.employee.delete({ where: { id } });
  refresh("/employees");
  return { ok: true, id };
}
