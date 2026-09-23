import { db } from "@/lib/db";
import {
  demoAssetDetails,
  demoAssets,
  demoCategories,
  demoEmployees,
  demoLocations,
} from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime";

export async function getDashboardData() {
  if (isDemoMode()) {
    return {
      total: demoAssets.length,
      inUse: demoAssets.filter((asset) => asset.status === "IN_USE").length,
      available: demoAssets.filter((asset) => asset.status === "AVAILABLE").length,
      maintenance: demoAssets.filter((asset) => asset.status === "MAINTENANCE").length,
      categories: demoCategories.length,
      locations: demoLocations.length,
      recent: demoAssets.slice(0, 7).map(({ id, code, name, status, updatedAt }) => ({
        id,
        code,
        name,
        status,
        updatedAt,
      })),
    };
  }

  const [total, inUse, available, maintenance, categories, locations, recent] =
    await Promise.all([
      db.asset.count(),
      db.asset.count({ where: { status: "IN_USE" } }),
      db.asset.count({ where: { status: "AVAILABLE" } }),
      db.asset.count({ where: { status: "MAINTENANCE" } }),
      db.category.count(),
      db.location.count(),
      db.asset.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 7,
      }),
    ]);

  return { total, inUse, available, maintenance, categories, locations, recent };
}

export async function getAssets() {
  if (isDemoMode()) {
    return demoAssets.map(
      ({ id, code, name, serialNumber, status, category, location, custodian }) => ({
        id,
        code,
        name,
        serialNumber,
        status,
        category,
        location,
        custodian,
      }),
    );
  }

  return db.asset.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      serialNumber: true,
      status: true,
      category: { select: { name: true } },
      location: { select: { name: true } },
      custodian: { select: { name: true, department: true } },
    },
    orderBy: [{ updatedAt: "desc" }, { code: "asc" }],
    take: 500,
  });
}

export async function getCategories() {
  if (isDemoMode()) return demoCategories;

  return db.category.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getLocations() {
  if (isDemoMode()) return demoLocations;

  return db.location.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getEmployees() {
  if (isDemoMode()) return demoEmployees;

  return db.employee.findMany({
    include: { _count: { select: { assets: true } } },
    orderBy: [{ name: "asc" }, { employeeCode: "asc" }],
  });
}

export async function getAssetFormOptions() {
  if (isDemoMode()) {
    return {
      categories: demoCategories.map(({ id, name }) => ({ id, name })),
      locations: demoLocations.map(({ id, name }) => ({ id, name })),
    };
  }

  const [categories, locations] = await Promise.all([
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return { categories, locations };
}

export async function getAssetDetail(id: string) {
  if (isDemoMode()) {
    return demoAssetDetails.find((asset) => asset.id === id) ?? null;
  }

  return db.asset.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      custodian: true,
      assignments: {
        include: { employee: true },
        orderBy: { assignedAt: "desc" },
        take: 12,
      },
    },
  });
}

export async function getEmployeesForAssignment() {
  if (isDemoMode()) {
    return demoEmployees.map(({ id, name, department }) => ({
      id,
      name,
      department,
    }));
  }

  return db.employee.findMany({
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
  });
}
