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
  demoActivity,
  demoLocations,
  demoUsers,
} from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime";

const STATUS_ORDER = [
  AssetStatus.IN_USE,
  AssetStatus.AVAILABLE,
  AssetStatus.MAINTENANCE,
  AssetStatus.LOST,
  AssetStatus.DISPOSED,
] as const;

export type ActivityItem = {
  id: string;
  action: string;
  createdAt: Date;
  actor: string | null;
  asset: { id: string; code: string; name: string } | null;
  employeeName: string | null;
};

function summarize(
  total: number,
  counts: Map<AssetStatus, number>,
  extra: {
    totalValue: number;
    noImage: number;
    noLocation: number;
    categoryReport: { name: string; count: number }[];
    locationReport: { name: string; count: number }[];
    activity: ActivityItem[];
  },
) {
  const count = (status: AssetStatus) => counts.get(status) ?? 0;
  const inUse = count(AssetStatus.IN_USE);
  const byCount = (a: { count: number }, b: { count: number }) => b.count - a.count;

  return {
    total,
    inUse,
    available: count(AssetStatus.AVAILABLE),
    maintenance: count(AssetStatus.MAINTENANCE),
    lost: count(AssetStatus.LOST),
    utilization: total ? Math.round((inUse / total) * 100) : 0,
    statusReport: STATUS_ORDER.map((status) => ({ status, count: count(status) })),
    categoryCount: extra.categoryReport.length,
    locationCount: extra.locationReport.length,
    categoryReport: [...extra.categoryReport].sort(byCount).slice(0, 8),
    locationReport: [...extra.locationReport].sort(byCount).slice(0, 8),
    totalValue: extra.totalValue,
    noImage: extra.noImage,
    noLocation: extra.noLocation,
    activity: extra.activity,
  };
}

export async function getDashboardData() {
  if (isDemoMode()) {
    const counts = new Map<AssetStatus, number>();
    for (const asset of demoAssets) counts.set(asset.status, (counts.get(asset.status) ?? 0) + 1);
    const live = demoAssets.filter((asset) => (asset.status as AssetStatus) !== AssetStatus.DISPOSED);

    return summarize(demoAssets.length, counts, {
      totalValue: 0,
      noImage: live.length,
      noLocation: live.filter((asset) => !asset.location).length,
      categoryReport: demoCategories.map((c) => ({ name: c.name, count: c._count.assets })),
      locationReport: demoLocations.map((l) => ({ name: l.name, count: l._count.assets })),
      activity: demoActivity,
    });
  }

  const notDisposed = { status: { not: AssetStatus.DISPOSED } };
  const [total, statusGroups, value, noImage, noLocation, categoryRows, locationRows, logs] =
    await Promise.all([
      db.asset.count(),
      db.asset.groupBy({ by: ["status"], _count: { _all: true } }),
      db.asset.aggregate({ _sum: { purchaseCost: true } }),
      db.asset.count({ where: { ...notDisposed, image: null } }),
      db.asset.count({ where: { ...notDisposed, locationId: null } }),
      db.category.findMany({ select: { name: true, _count: { select: { assets: true } } } }),
      db.location.findMany({ select: { name: true, _count: { select: { assets: true } } } }),
      db.auditLog.findMany({
        where: { entityType: "Asset" },
        select: { id: true, action: true, entityId: true, actor: true, payload: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

  // Resolve the asset and (for handovers) employee behind each log row in two queries.
  const employeeIdOf = (payload: unknown) =>
    payload && typeof payload === "object" && "employeeId" in payload
      ? String((payload as { employeeId: unknown }).employeeId)
      : null;
  const actors = [...new Set(logs.map((log) => log.actor).filter((actor): actor is string => Boolean(actor)))];
  const [assets, employees, users] = await Promise.all([
    db.asset.findMany({
      where: { id: { in: [...new Set(logs.map((log) => log.entityId))] } },
      select: { id: true, code: true, name: true },
    }),
    db.employee.findMany({
      where: { id: { in: logs.map((log) => employeeIdOf(log.payload)).filter((id): id is string => Boolean(id)) } },
      select: { id: true, name: true },
    }),
    db.user.findMany({ where: { email: { in: actors } }, select: { email: true, name: true } }),
  ]);
  const actorName = new Map(users.map((user) => [user.email, user.name]));
  const assetById = new Map(assets.map((asset) => [asset.id, asset]));
  const employeeById = new Map(employees.map((employee) => [employee.id, employee.name]));

  return summarize(total, new Map(statusGroups.map((row) => [row.status, row._count._all])), {
    totalValue: Number(value._sum.purchaseCost ?? 0),
    noImage,
    noLocation,
    categoryReport: categoryRows.map((c) => ({ name: c.name, count: c._count.assets })),
    locationReport: locationRows.map((l) => ({ name: l.name, count: l._count.assets })),
    activity: logs.map((log) => {
      const employeeId = employeeIdOf(log.payload);
      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actor: log.actor ? actorName.get(log.actor) ?? log.actor : null,
        asset: assetById.get(log.entityId) ?? null,
        employeeName: employeeId ? employeeById.get(employeeId) ?? null : null,
      };
    }),
  });
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
        image: null,
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
      image: { select: { id: true } },
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
      historyCount: demoAssetDetails.filter((asset) => asset.custodianId === employee.id).length,
      assets: demoAssetDetails
        .filter((asset) => asset.custodianId === employee.id)
        .map((asset) => ({
          id: asset.id,
          code: asset.code,
          name: asset.name,
          since: asset.assignments.find((assignment) => !assignment.returnedAt)?.assignedAt ?? null,
        })),
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

export async function getAssetsForLabels(ids: string[]) {
  const unique = [...new Set(ids)].slice(0, 200);
  if (!unique.length) return [];

  if (isDemoMode()) {
    return demoAssets
      .filter((asset) => unique.includes(asset.id))
      .map(({ id, code, name, barcode, location }) => ({ id, code, name, barcode, location }));
  }

  return db.asset.findMany({
    where: { id: { in: unique } },
    select: { id: true, code: true, name: true, barcode: true, location: { select: { name: true } } },
    orderBy: { code: "asc" },
  });
}
