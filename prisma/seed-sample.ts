/**
 * Richer sample data for trying the UI: categories, locations, employees,
 * ~80 assets, assignment history and illustrative asset images.
 *
 * Idempotent: every insert uses createMany + skipDuplicates on unique keys,
 * assignment history is only generated for assets inserted by the same run, and
 * images only for sample assets that have none.
 * Everything is written in batches because each round trip to a remote
 * database can take a second or more.
 *
 * Run: npm run db:seed:sample
 */
import { loadEnvFile } from "node:process";
import { AssetStatus, LocationType, Prisma, PrismaClient } from "@prisma/client";
import {
  Armchair,
  Computer,
  Drill,
  Laptop,
  type LucideIcon,
  Monitor,
  Printer,
  Projector,
  Router,
  TabletSmartphone,
} from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";

try {
  loadEnvFile(".env");
} catch {
  // CI and Docker provide DATABASE_URL through the process environment.
}

const prisma = new PrismaClient();

// Deterministic PRNG so repeated runs describe the same fictional company.
let seed = 20260924;
function rand() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function pick<T>(items: readonly T[]) {
  return items[Math.floor(rand() * items.length)];
}
function daysAgo(days: number) {
  const date = new Date();
  date.setHours(9 + Math.floor(rand() * 8), Math.floor(rand() * 60), 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

const categories = [
  { name: "Laptop", description: "Máy tính xách tay cấp cho nhân viên" },
  { name: "Màn hình", description: "Màn hình rời cho bàn làm việc" },
  { name: "Máy tính để bàn", description: "Máy trạm và PC văn phòng" },
  { name: "Điện thoại & máy tính bảng", description: "Thiết bị di động công ty" },
  { name: "Thiết bị mạng", description: "Switch, router, wifi, tường lửa" },
  { name: "Máy in & máy scan", description: null },
  { name: "Thiết bị trình chiếu", description: "Máy chiếu, TV phòng họp, loa hội nghị" },
  { name: "Nội thất văn phòng", description: "Bàn, ghế, tủ hồ sơ" },
  { name: "Máy móc & công cụ", description: "Dụng cụ kỹ thuật, bảo trì" },
] as const;

const locations = [
  { name: "Văn phòng Duy Tân", type: LocationType.OFFICE, address: "Duy Tân, Cầu Giấy, Hà Nội" },
  { name: "Chi nhánh Hồ Chí Minh", type: LocationType.OFFICE, address: "Nguyễn Thị Minh Khai, Quận 3, TP.HCM" },
  { name: "Kho tổng", type: LocationType.WAREHOUSE, address: "Khu công nghiệp Nam Thăng Long, Hà Nội" },
  { name: "Kho linh kiện", type: LocationType.WAREHOUSE, address: null },
  { name: "Phòng họp tầng 5", type: LocationType.ROOM, address: null },
  { name: "Phòng server", type: LocationType.ROOM, address: null },
  { name: "Khu lễ tân", type: LocationType.AREA, address: null },
] as const;

const employees = [
  ["NV101", "Nguyễn Thu Hà", "Kế toán"],
  ["NV102", "Trần Minh Khoa", "CNTT"],
  ["NV103", "Lê Hoàng Nam", "Kinh doanh"],
  ["NV104", "Phạm Ngọc Ánh", "Marketing"],
  ["NV105", "Đỗ Quang Huy", "CNTT"],
  ["NV106", "Vũ Thị Lan", "Nhân sự"],
  ["NV107", "Bùi Đức Thắng", "Vận hành"],
  ["NV108", "Hoàng Mai Linh", "Kinh doanh"],
  ["NV109", "Ngô Thanh Tùng", "Ban giám đốc"],
  ["NV110", "Đặng Khánh Vy", "Marketing"],
  ["NV111", "Phan Văn Lộc", "Vận hành"],
  ["NV112", "Trịnh Bảo Ngọc", "Kế toán"],
  ["NV113", "Lý Gia Bảo", "CNTT"],
  ["NV114", "Mai Phương Thảo", "Nhân sự"],
  ["NV115", "Tạ Quốc Việt", "Kinh doanh"],
  ["NV116", "Cao Thị Hồng", "Kinh doanh"],
  ["NV117", "Dương Minh Trí", "CNTT"],
  ["NV118", "Hồ Ngọc Diệp", "Marketing"],
  ["NV119", "La Văn Sơn", "Vận hành"],
  ["NV120", "Kiều Anh Thư", "Kế toán"],
  ["NV121", "Châu Tuấn Kiệt", "Kinh doanh"],
  ["NV122", "Quách Thùy Dung", "Ban giám đốc"],
] as const;

function emailFor(name: string, code: string) {
  const ascii = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .split(/\s+/);
  return `${ascii[ascii.length - 1]}.${ascii[0]}${code.slice(-3)}@example.local`;
}

// Illustration style per category: icon plus a light/dark tint pair.
const illustration: Record<(typeof categories)[number]["name"], { icon: LucideIcon; bg: string; fg: string }> = {
  Laptop: { icon: Laptop, bg: "#e8eefb", fg: "#2f5bbf" },
  "Màn hình": { icon: Monitor, bg: "#e6f1f5", fg: "#1f6f8b" },
  "Máy tính để bàn": { icon: Computer, bg: "#ebeef3", fg: "#3a4a63" },
  "Điện thoại & máy tính bảng": { icon: TabletSmartphone, bg: "#f1ebf7", fg: "#6a4b9c" },
  "Thiết bị mạng": { icon: Router, bg: "#e7f3ee", fg: "#1f7a55" },
  "Máy in & máy scan": { icon: Printer, bg: "#f4efe6", fg: "#8a5a1c" },
  "Thiết bị trình chiếu": { icon: Projector, bg: "#f6ebee", fg: "#9c3d55" },
  "Nội thất văn phòng": { icon: Armchair, bg: "#eef0e6", fg: "#5b6b2a" },
  "Máy móc & công cụ": { icon: Drill, bg: "#f5ece6", fg: "#a1512a" },
};

async function renderIllustration(category: (typeof categories)[number]["name"]) {
  const { icon, bg, fg } = illustration[category];
  const glyph = renderToStaticMarkup(
    createElement(icon, { size: 300, color: fg, strokeWidth: 1, absoluteStrokeWidth: false }),
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="${bg}"/>
  <ellipse cx="400" cy="448" rx="170" ry="18" fill="${fg}" fill-opacity="0.08"/>
  <g transform="translate(250 125)">${glyph}</g>
</svg>`;
  return new Uint8Array(await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer());
}

type Model = {
  category: (typeof categories)[number]["name"];
  prefix: string;
  names: string[];
  serialPrefix: string;
  cost: [number, number];
  count: number;
  personal: boolean;
  homes: string[];
};

const models: Model[] = [
  {
    category: "Laptop",
    prefix: "LT",
    names: ["Dell Latitude 5440", "Lenovo ThinkPad T14 Gen 4", "MacBook Air M2 13\"", "HP EliteBook 840 G10"],
    serialPrefix: "LT",
    cost: [18_000_000, 34_000_000],
    count: 22,
    personal: true,
    homes: ["Văn phòng Duy Tân", "Chi nhánh Hồ Chí Minh"],
  },
  {
    category: "Màn hình",
    prefix: "MH",
    names: ["Dell P2422H 24\"", "LG 27UP850 27\" 4K", "Samsung S24C310"],
    serialPrefix: "MN",
    cost: [2_900_000, 9_500_000],
    count: 18,
    personal: true,
    homes: ["Văn phòng Duy Tân", "Chi nhánh Hồ Chí Minh"],
  },
  {
    category: "Máy tính để bàn",
    prefix: "PC",
    names: ["Dell OptiPlex 7010", "HP ProDesk 400 G9"],
    serialPrefix: "PC",
    cost: [12_000_000, 19_000_000],
    count: 6,
    personal: true,
    homes: ["Văn phòng Duy Tân"],
  },
  {
    category: "Điện thoại & máy tính bảng",
    prefix: "DT",
    names: ["iPhone 13 128GB", "Samsung Galaxy Tab S9", "Samsung Galaxy A55"],
    serialPrefix: "MB",
    cost: [7_500_000, 19_000_000],
    count: 7,
    personal: true,
    homes: ["Văn phòng Duy Tân", "Chi nhánh Hồ Chí Minh"],
  },
  {
    category: "Thiết bị mạng",
    prefix: "NW",
    names: ["Switch Cisco CBS350-24T", "Wifi UniFi U6 Pro", "Tường lửa FortiGate 60F"],
    serialPrefix: "NW",
    cost: [4_000_000, 22_000_000],
    count: 6,
    personal: false,
    homes: ["Phòng server", "Văn phòng Duy Tân", "Chi nhánh Hồ Chí Minh"],
  },
  {
    category: "Máy in & máy scan",
    prefix: "IN",
    names: ["Brother HL-L2366DW", "Canon imageRUNNER 2206N", "Epson DS-530 II"],
    serialPrefix: "PR",
    cost: [3_500_000, 26_000_000],
    count: 4,
    personal: false,
    homes: ["Văn phòng Duy Tân", "Chi nhánh Hồ Chí Minh", "Khu lễ tân"],
  },
  {
    category: "Thiết bị trình chiếu",
    prefix: "TC",
    names: ["Máy chiếu Epson EB-X51", "TV Samsung 55\" phòng họp", "Loa hội nghị Jabra Speak 750"],
    serialPrefix: "AV",
    cost: [5_000_000, 18_000_000],
    count: 4,
    personal: false,
    homes: ["Phòng họp tầng 5"],
  },
  {
    category: "Nội thất văn phòng",
    prefix: "NT",
    names: ["Ghế công thái học Sihoo M57", "Bàn làm việc 1m4", "Tủ hồ sơ 3 ngăn"],
    serialPrefix: "",
    cost: [1_800_000, 5_500_000],
    count: 8,
    personal: false,
    homes: ["Văn phòng Duy Tân", "Chi nhánh Hồ Chí Minh", "Kho tổng"],
  },
  {
    category: "Máy móc & công cụ",
    prefix: "CC",
    names: ["Máy khoan pin Bosch GSB 120", "Bộ dụng cụ mạng Fluke", "Thang nhôm rút 3m8"],
    serialPrefix: "TL",
    cost: [900_000, 7_000_000],
    count: 4,
    personal: false,
    homes: ["Kho linh kiện", "Kho tổng"],
  },
];

function serialFor(prefix: string, index: number) {
  if (!prefix) return null;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let tail = "";
  for (let i = 0; i < 7; i++) tail += chars[Math.floor(rand() * chars.length)];
  return `${prefix}${String(index).padStart(2, "0")}-${tail}`;
}

async function main() {
  const t0 = performance.now();

  await prisma.category.createMany({ data: [...categories], skipDuplicates: true });
  await prisma.location.createMany({ data: [...locations], skipDuplicates: true });
  await prisma.employee.createMany({
    data: employees.map(([employeeCode, name, department]) => ({
      employeeCode,
      name,
      department,
      email: emailFor(name, employeeCode),
    })),
    skipDuplicates: true,
  });

  const [categoryRows, locationRows, employeeRows] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.location.findMany({ select: { id: true, name: true } }),
    prisma.employee.findMany({
      where: { employeeCode: { in: employees.map(([code]) => code) } },
      select: { id: true, employeeCode: true },
    }),
  ]);
  const categoryId = new Map(categoryRows.map((row) => [row.name, row.id]));
  const locationId = new Map(locationRows.map((row) => [row.name, row.id]));
  const employeeIds = employeeRows.map((row) => row.id);

  const assets: Prisma.AssetCreateManyInput[] = [];
  let unassignedPool = [...employeeIds];

  for (const model of models) {
    for (let i = 1; i <= model.count; i++) {
      const code = `TS-${model.prefix}-${String(i).padStart(4, "0")}`;
      const roll = rand();
      let status: AssetStatus;
      if (model.personal) {
        status =
          roll < 0.72
            ? AssetStatus.IN_USE
            : roll < 0.88
              ? AssetStatus.AVAILABLE
              : roll < 0.95
                ? AssetStatus.MAINTENANCE
                : roll < 0.975
                  ? AssetStatus.LOST
                  : AssetStatus.DISPOSED;
      } else {
        status =
          roll < 0.85
            ? AssetStatus.AVAILABLE
            : roll < 0.95
              ? AssetStatus.MAINTENANCE
              : AssetStatus.DISPOSED;
      }

      let custodianId: string | null = null;
      if (status === AssetStatus.IN_USE && employeeIds.length) {
        if (unassignedPool.length === 0) unassignedPool = [...employeeIds];
        const index = Math.floor(rand() * unassignedPool.length);
        custodianId = unassignedPool.splice(index, 1)[0];
      }

      const home =
        status === AssetStatus.AVAILABLE && model.personal && rand() < 0.6
          ? "Kho tổng"
          : pick(model.homes);
      const [minCost, maxCost] = model.cost;
      const cost = Math.round((minCost + rand() * (maxCost - minCost)) / 10_000) * 10_000;

      assets.push({
        code,
        name: pick(model.names),
        serialNumber: serialFor(model.serialPrefix, i),
        barcode: code,
        status,
        purchaseDate: daysAgo(30 + Math.floor(rand() * 1_100)),
        purchaseCost: new Prisma.Decimal(cost),
        categoryId: categoryId.get(model.category) ?? null,
        locationId: locationId.get(home) ?? null,
        custodianId,
        description:
          status === AssetStatus.MAINTENANCE
            ? "Đang gửi bảo hành tại hãng."
            : status === AssetStatus.LOST
              ? "Báo mất khi đi công tác, chờ xác minh."
              : status === AssetStatus.DISPOSED
                ? "Hỏng không sửa được, đã thanh lý."
                : null,
      });
    }
  }

  const insertedAt = new Date();
  const created = await prisma.asset.createMany({ data: assets, skipDuplicates: true });

  // Assignment history only for assets inserted by this run, so re-running the
  // script never adds history to assets that already existed.
  const sampleAssets = await prisma.asset.findMany({
    where: {
      code: { in: assets.map((asset) => asset.code) },
      createdAt: { gte: new Date(insertedAt.getTime() - 5_000) },
      assignments: { none: {} },
    },
    select: { id: true, status: true, custodianId: true, purchaseDate: true },
  });

  const assignments: Prisma.AssetAssignmentCreateManyInput[] = [];
  const notes = ["Cấp mới khi nhận việc", "Bàn giao theo yêu cầu phòng ban", "Đổi máy cũ", null, null];

  for (const asset of sampleAssets) {
    const bought = asset.purchaseDate ?? daysAgo(400);
    const ageDays = Math.max(20, Math.floor((Date.now() - bought.getTime()) / 86_400_000));

    // Some assets had a previous holder who returned them.
    if (rand() < 0.4 && employeeIds.length > 1) {
      const start = daysAgo(ageDays - 5);
      const end = new Date(start.getTime() + (20 + Math.floor(rand() * 200)) * 86_400_000);
      if (end.getTime() < Date.now() - 10 * 86_400_000) {
        assignments.push({
          assetId: asset.id,
          employeeId: pick(employeeIds),
          assignedAt: start,
          returnedAt: end,
          note: pick(notes),
        });
      }
    }

    if (asset.status === AssetStatus.IN_USE && asset.custodianId) {
      assignments.push({
        assetId: asset.id,
        employeeId: asset.custodianId,
        assignedAt: daysAgo(Math.floor(rand() * Math.min(ageDays, 300))),
        note: pick(notes),
      });
    }
  }

  if (assignments.length) {
    await prisma.assetAssignment.createMany({ data: assignments });
  }

  // Illustrative images for sample assets that do not have one yet.
  const withoutImage = await prisma.asset.findMany({
    where: { code: { in: assets.map((asset) => asset.code) }, image: { is: null } },
    select: { id: true, code: true, category: { select: { name: true } } },
  });

  const cache = new Map<string, Uint8Array<ArrayBuffer>>();
  const images: Prisma.AssetImageCreateManyInput[] = [];
  for (const asset of withoutImage) {
    const category = asset.category?.name as (typeof categories)[number]["name"] | undefined;
    if (!category || !(category in illustration)) continue;
    if (!cache.has(category)) cache.set(category, await renderIllustration(category));
    const data = cache.get(category)!;
    images.push({
      assetId: asset.id,
      fileName: `minh-hoa-${asset.code.toLowerCase()}.webp`,
      mimeType: "image/webp",
      size: data.byteLength,
      data,
    });
  }

  if (images.length) {
    await prisma.assetImage.createMany({ data: images, skipDuplicates: true });
  }

  console.log(
    `Sample data ready: ${categories.length} categories, ${locations.length} locations, ` +
      `${employees.length} employees, ${created.count} new assets, ` +
      `${assignments.length} assignment records, ${images.length} images (${Math.round((performance.now() - t0) / 1000)}s).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
