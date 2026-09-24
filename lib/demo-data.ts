import {
  AssetStatus,
  LocationType,
  UserRole,
  UserStatus,
} from "@prisma/client";

const updatedAt = new Date("2026-09-23T09:30:00.000Z");

export const demoCategories = [
  {
    id: "demo-category-it",
    name: "Thiết bị IT",
    description: "Máy tính, màn hình và thiết bị công nghệ",
    _count: { assets: 2 },
  },
  {
    id: "demo-category-office",
    name: "Thiết bị văn phòng",
    description: "Thiết bị phục vụ vận hành văn phòng",
    _count: { assets: 1 },
  },
  {
    id: "demo-category-tools",
    name: "Máy móc & công cụ",
    description: "Máy móc và dụng cụ phục vụ vận hành",
    _count: { assets: 1 },
  },
];

export const demoLocations = [
  {
    id: "demo-location-office",
    name: "Văn phòng Duy Tân",
    type: LocationType.OFFICE,
    address: "Duy Tân, Cầu Giấy, Hà Nội",
    _count: { assets: 3 },
  },
  {
    id: "demo-location-warehouse",
    name: "Kho tổng",
    type: LocationType.WAREHOUSE,
    address: "Kho nội bộ",
    _count: { assets: 1 },
  },
];

export const demoEmployees = [
  {
    id: "demo-employee-an",
    employeeCode: "NV001",
    name: "Nguyễn Văn An",
    email: "an@example.local",
    department: "CNTT",
    _count: { assets: 1 },
  },
  {
    id: "demo-employee-binh",
    employeeCode: "NV002",
    name: "Trần Minh Bình",
    email: "binh@example.local",
    department: "Vận hành",
    _count: { assets: 1 },
  },
  {
    id: "demo-employee-lan",
    employeeCode: "NV003",
    name: "Lê Thu Lan",
    email: "lan@example.local",
    department: "Hành chính",
    _count: { assets: 0 },
  },
];

export const demoUsers = [
  {
    id: "demo-admin",
    name: "Demo Admin",
    email: "admin@casla.local",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    mustChangePassword: false,
    lastLoginAt: new Date("2026-09-23T08:30:00.000Z"),
    createdAt: new Date("2026-09-01T02:00:00.000Z"),
  },
  {
    id: "demo-manager",
    name: "Nguyễn Văn An",
    email: "an@casla.local",
    role: UserRole.ASSET_MANAGER,
    status: UserStatus.ACTIVE,
    mustChangePassword: false,
    lastLoginAt: new Date("2026-09-22T07:20:00.000Z"),
    createdAt: new Date("2026-09-02T02:00:00.000Z"),
  },
  {
    id: "demo-viewer",
    name: "Lê Thu Lan",
    email: "lan@casla.local",
    role: UserRole.VIEWER,
    status: UserStatus.INVITED,
    mustChangePassword: false,
    lastLoginAt: null,
    createdAt: new Date("2026-09-20T02:00:00.000Z"),
  },
];

export const demoAssets = [
  {
    id: "demo-asset-1",
    code: "TS-IT-0001",
    name: "MacBook Pro 14",
    serialNumber: "QLTS-DEMO-0001",
    barcode: "8938501000012",
    description: "Máy tính làm việc cho bộ phận CNTT.",
    status: AssetStatus.IN_USE,
    category: { name: "Thiết bị IT" },
    location: { name: "Văn phòng Duy Tân" },
    custodian: { name: "Nguyễn Văn An", department: "CNTT" },
    custodianId: "demo-employee-an",
    updatedAt,
  },
  {
    id: "demo-asset-2",
    code: "TS-IT-0002",
    name: "Màn hình Dell 27",
    serialNumber: "QLTS-DEMO-0002",
    barcode: "TS-IT-0002",
    description: "Màn hình làm việc 27 inch.",
    status: AssetStatus.AVAILABLE,
    category: { name: "Thiết bị IT" },
    location: { name: "Văn phòng Duy Tân" },
    custodian: null,
    custodianId: null,
    updatedAt: new Date("2026-09-22T04:10:00.000Z"),
  },
  {
    id: "demo-asset-3",
    code: "TS-VP-0001",
    name: "Máy in văn phòng",
    serialNumber: "QLTS-DEMO-0003",
    barcode: "TS-VP-0001",
    description: "Máy in dùng chung khu vực vận hành.",
    status: AssetStatus.MAINTENANCE,
    category: { name: "Thiết bị văn phòng" },
    location: { name: "Văn phòng Duy Tân" },
    custodian: { name: "Trần Minh Bình", department: "Vận hành" },
    custodianId: "demo-employee-binh",
    updatedAt: new Date("2026-09-21T07:45:00.000Z"),
  },
  {
    id: "demo-asset-4",
    code: "TS-CC-0001",
    name: "Máy khoan pin",
    serialNumber: "QLTS-DEMO-0004",
    barcode: "TS-CC-0001",
    description: "Dụng cụ bảo trì tại kho.",
    status: AssetStatus.AVAILABLE,
    category: { name: "Máy móc & công cụ" },
    location: { name: "Kho tổng" },
    custodian: null,
    custodianId: null,
    updatedAt: new Date("2026-09-20T03:20:00.000Z"),
  },
];

export const demoAssetDetails = demoAssets.map((asset) => ({
  ...asset,
  categoryId: null as string | null,
  locationId: null as string | null,
  purchaseDate: null as Date | null,
  purchaseCost: null as number | null,
  image: null,
  assignments:
    asset.id === "demo-asset-1"
      ? [
          {
            id: "demo-assignment-1",
            assignedAt: new Date("2026-08-12T02:00:00.000Z"),
            returnedAt: null,
            note: null as string | null,
            employee: { name: "Nguyễn Văn An" },
          },
        ]
      : asset.id === "demo-asset-3"
        ? [
            {
              id: "demo-assignment-2",
              assignedAt: new Date("2026-07-03T02:30:00.000Z"),
              returnedAt: null,
              note: null as string | null,
              employee: { name: "Trần Minh Bình" },
            },
          ]
        : [],
}));

const hoursAgo = (hours: number) => new Date(updatedAt.getTime() - hours * 3_600_000);

export const demoActivity = [
  {
    id: "demo-log-1",
    action: "ASSIGN",
    createdAt: hoursAgo(2),
    actor: "Demo Admin",
    asset: { id: "demo-asset-1", code: "TS-IT-0001", name: "MacBook Pro 14" },
    employeeName: "Nguyễn Văn An",
  },
  {
    id: "demo-log-2",
    action: "UPDATE",
    createdAt: hoursAgo(26),
    actor: "Nguyễn Văn An",
    asset: { id: "demo-asset-3", code: "TS-VP-0001", name: "Máy in văn phòng" },
    employeeName: null,
  },
  {
    id: "demo-log-3",
    action: "RETURN",
    createdAt: hoursAgo(50),
    actor: "Demo Admin",
    asset: { id: "demo-asset-2", code: "TS-IT-0002", name: "Màn hình Dell 27" },
    employeeName: null,
  },
  {
    id: "demo-log-4",
    action: "CREATE",
    createdAt: hoursAgo(74),
    actor: "Demo Admin",
    asset: { id: "demo-asset-4", code: "TS-CC-0001", name: "Máy khoan pin" },
    employeeName: null,
  },
];
