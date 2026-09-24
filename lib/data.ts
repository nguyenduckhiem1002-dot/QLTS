import { AssetStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { CATEGORY_LOCATION_OPTIONS_TAG, EMPLOYEE_OPTIONS_TAG } from "@/lib/cache-tags";
import { db } from "@/lib/db";
import {
  demoAssetDetails,
  demoAssets,
  demoCategories,
  demoEmployees,
  demoLocations,
  demoUsers,
} from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime";

function countDemoStatus(status: AssetStatus) {
  return demoAssets.filter((asset) => asset.status === status).length;
}

export async function getDashboardData() {
  if (isDemoMode()) {
    const total = demoAssets.length;
    const inUse = countDemoStatus(AssetStatus.IN_USE);
    const available = countDemoStatus(AssetStatus.AVAILABLE);
    const maintenance = countDemoStatus(AssetStatus.MAINTENANCE);
    const lost = countDemoStatus(AssetStatus.LOST);
    const disposed = countDemoStatus(AssetStatus.DISPOSED);

    return {
      total,
      inUse,
      available,
      maintenance,
      lost,
      disposed,
      categories: demoCategories.length,
      locations: demoLocations.length,
      utilization: total ? Math.round((inUse / total) * 100) : 0,
      statusReport: [
        { status: AssetStatus.IN_USE, count: inUse },
        { status: AssetStatus.AVAILABLE, count: available },
        { status: AssetStatus.MAINTENANCE, count: maintenance },
        { status: AssetStatus.LOST, count: lost },
        { status: AssetStatus.DISPOSED, count: disposed },
      ],
      categoryReport: demoCategories
        .map((category) => ({
          name: category.name,
          count: category._count.assets,
        }))
        .sort((a, b) => b.count - a.count),
      locationReport: demoLocations
        .map((location) => ({
          name: location.name,
          count: location._count.assets,
        }))
        .sort((a, b) => b.count - a.count),
      recent: demoAssets.slice(0, 7).map(({ id, code, name, status, updatedAt }) => ({
        id,
        code,
        name,
        status,
        updatedAt,
      })),
    };
  }

  const [total, statusGroups, categoryRows, locationRows, recent] =
    await Promise.all([
      db.asset.count(),
      db.asset.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.category.findMany({
        select: {
          name: true,
          _count: { select: { assets: true } },
        },
      }),
      db.location.findMany({
        select: {
          name: true,
          _count: { select: { assets: true } },
        },
      }),
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

  const statusMap = new Map(
    statusGroups.map((row) => [row.status, row._count._all]),
  );
  const statusCount = (status: AssetStatus) => statusMap.get(status) ?? 0;

  const inUse = statusCount(AssetStatus.IN_USE);
  const available = statusCount(AssetStatus.AVAILABLE);
  const maintenance = statusCount(AssetStatus.MAINTENANCE);
  const lost = statusCount(AssetStatus.LOST);
  const disposed = statusCount(AssetStatus.DISPOSED);

  return {
    total,
    inUse,
    available,
    maintenance,
    lost,
    disposed,
    categories: categoryRows.length,
    locations: locationRows.length,
    utilization: total ? Math.round((inUse / total) * 100) : 0,
    statusReport: [
      { status: AssetStatus.IN_USE, count: inUse },
      { status: AssetStatus.AVAILABLE, count: available },
      { status: AssetStatus.MAINTENANCE, count: maintenance },
      { status: AssetStatus.LOST, count: lost },
      { status: AssetStatus.DISPOSED, count: disposed },
    ],
    categoryReport: categoryRows
      .map((category) => ({
        name: category.name,
        count: category._count.assets,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    locationReport: locationRows
      .map((location) => ({
        name: location.name,
        count: location._count.assets,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    recent,
  };
}

export async function getAssets() {
  if (isDemoMode()) {
    return demoAssets.map(
      ({
        id,
        code,
        name,
        serialNumber,
        barcode,
        status,
        category,
        location,
        custodian,
      }) => ({
        id,
        code,
        name,
        serialNumber,
        barcode,
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
      barcode: true,
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

// Everything the employees screen needs, in one query, so selecting people,
// filtering and opening the edit dialog never go back to the server.
export async function getEmployeesWithHoldings() {
  if (isDemoMode()) {
    return demoEmployees.map((employee) => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      email: employee.email,
      department: employee.department,
      historyCount: 0,
      assets: [] as { id: string; code: string; name: string; since: Date | null }[],
    }));
  }

  const rows = await db.employee.findMany({
    select: {
      id: true,
      employeeCode: true,
      name: true,
      email: true,
      department: true,
      _count: { select: { assignments: true } },
      assets: {
        select: {
          id: true,
          code: true,
          name: true,
          assignments: {
            where: { returnedAt: null },
            select: { assignedAt: true },
            orderBy: { assignedAt: "desc" },
            take: 1,
          },
        },
        orderBy: { code: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return rows.map(({ _count, assets, ...employee }) => ({
    ...employee,
    historyCount: _count.assignments,
    assets: assets.map(({ assignments, ...asset }) => ({
      ...asset,
      since: assignments[0]?.assignedAt ?? null,
    })),
  }));
}

export type EmployeeWithHoldings = Awaited<ReturnType<typeof getEmployeesWithHoldings>>[number];

export async function getUsersForAdmin() {
  if (isDemoMode()) return demoUsers;

  return db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function getAssetFormOptions() {
  if (isDemoMode()) {
    return {
      categories: demoCategories.map(({ id, name }) => ({ id, name })),
      locations: demoLocations.map(({ id, name }) => ({ id, name })),
    };
  }

  return loadAssetFormOptions();
}

// Cached across requests; invalidated by category/location actions via updateTag.
const loadAssetFormOptions = unstable_cache(
  async () => {
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
  },
  ["asset-form-options"],
  { tags: [CATEGORY_LOCATION_OPTIONS_TAG], revalidate: 600 },
);

// Only the columns the edit form needs; the detail query also loads history and image metadata.
export async function getAssetForEdit(id: string) {
  if (isDemoMode()) {
    return demoAssetDetails.find((asset) => asset.id === id) ?? null;
  }

  return db.asset.findUnique({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      serialNumber: true,
      barcode: true,
      description: true,
      status: true,
      categoryId: true,
      locationId: true,
      custodianId: true,
      purchaseDate: true,
      purchaseCost: true,
      custodian: { select: { name: true } },
    },
  });
}

// Memoized per request: generateMetadata and the page both load the asset.
export const getAssetDetail = cache(async (id: string) => {
  if (isDemoMode()) {
    return demoAssetDetails.find((asset) => asset.id === id) ?? null;
  }

  return db.asset.findUnique({
    where: { id },
    include: {
      category: true,
      location: true,
      custodian: true,
      image: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          size: true,
          updatedAt: true,
        },
      },
      assignments: {
        include: { employee: true },
        orderBy: { assignedAt: "desc" },
        take: 12,
      },
    },
  });
});

export async function getEmployeesForAssignment() {
  if (isDemoMode()) {
    return demoEmployees.map(({ id, name, department }) => ({
      id,
      name,
      department,
    }));
  }

  return loadEmployeeOptions();
}

const loadEmployeeOptions = unstable_cache(
  () =>
    db.employee.findMany({
      select: { id: true, name: true, department: true },
      orderBy: { name: "asc" },
    }),
  ["employee-options"],
  { tags: [EMPLOYEE_OPTIONS_TAG], revalidate: 600 },
);
