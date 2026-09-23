import { AssetStatus, LocationType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [it, office, equipment] = await Promise.all([
    prisma.category.upsert({
      where: { name: "Thiết bị IT" },
      update: {},
      create: {
        name: "Thiết bị IT",
        description: "Máy tính, màn hình và thiết bị công nghệ",
      },
    }),
    prisma.category.upsert({
      where: { name: "Thiết bị văn phòng" },
      update: {},
      create: { name: "Thiết bị văn phòng" },
    }),
    prisma.category.upsert({
      where: { name: "Máy móc & công cụ" },
      update: {},
      create: { name: "Máy móc & công cụ" },
    }),
  ]);

  const [hq, warehouse] = await Promise.all([
    prisma.location.upsert({
      where: { name: "Văn phòng Duy Tân" },
      update: {},
      create: {
        name: "Văn phòng Duy Tân",
        type: LocationType.OFFICE,
        address: "Duy Tân, Cầu Giấy, Hà Nội",
      },
    }),
    prisma.location.upsert({
      where: { name: "Kho tổng" },
      update: {},
      create: { name: "Kho tổng", type: LocationType.WAREHOUSE },
    }),
  ]);

  const [an, binh] = await Promise.all([
    prisma.employee.upsert({
      where: { employeeCode: "NV001" },
      update: {},
      create: {
        employeeCode: "NV001",
        name: "Nguyễn Văn An",
        email: "an@example.local",
        department: "CNTT",
      },
    }),
    prisma.employee.upsert({
      where: { employeeCode: "NV002" },
      update: {},
      create: {
        employeeCode: "NV002",
        name: "Trần Minh Bình",
        email: "binh@example.local",
        department: "Vận hành",
      },
    }),
  ]);

  const assets = [
    {
      code: "TS-IT-0001",
      name: "MacBook Pro 14",
      serialNumber: "QLTS-DEMO-0001",
      status: AssetStatus.IN_USE,
      categoryId: it.id,
      locationId: hq.id,
      custodianId: an.id,
    },
    {
      code: "TS-IT-0002",
      name: "Màn hình Dell 27",
      serialNumber: "QLTS-DEMO-0002",
      status: AssetStatus.AVAILABLE,
      categoryId: it.id,
      locationId: hq.id,
      custodianId: null,
    },
    {
      code: "TS-VP-0001",
      name: "Máy in văn phòng",
      serialNumber: "QLTS-DEMO-0003",
      status: AssetStatus.MAINTENANCE,
      categoryId: office.id,
      locationId: hq.id,
      custodianId: binh.id,
    },
    {
      code: "TS-CC-0001",
      name: "Máy khoan pin",
      serialNumber: "QLTS-DEMO-0004",
      status: AssetStatus.AVAILABLE,
      categoryId: equipment.id,
      locationId: warehouse.id,
      custodianId: null,
    },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { code: asset.code },
      update: asset,
      create: asset,
    });
  }

  const assignedAsset = await prisma.asset.findUnique({
    where: { code: "TS-IT-0001" },
    select: { id: true },
  });

  if (assignedAsset) {
    const active = await prisma.assetAssignment.findFirst({
      where: { assetId: assignedAsset.id, returnedAt: null },
    });

    if (!active) {
      await prisma.assetAssignment.create({
        data: {
          assetId: assignedAsset.id,
          employeeId: an.id,
          note: "Dữ liệu bàn giao mẫu",
        },
      });
    }
  }

  console.log("QLTS demo data seeded.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
