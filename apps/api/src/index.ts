import { serve } from "@hono/node-server";
import { db } from "@qlts/database";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin || "http://localhost:3000",
    credentials: true,
  }),
);

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "qlts-api",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/api/dashboard", async (c) => {
  const [total, inUse, available, maintenance, categories, locations] =
    await Promise.all([
      db.asset.count(),
      db.asset.count({ where: { status: "IN_USE" } }),
      db.asset.count({ where: { status: "AVAILABLE" } }),
      db.asset.count({ where: { status: "MAINTENANCE" } }),
      db.category.count(),
      db.location.count(),
    ]);

  return c.json({
    total,
    inUse,
    available,
    maintenance,
    categories,
    locations,
  });
});

app.get("/api/assets", async (c) => {
  const query = c.req.query("q")?.trim();

  const assets = await db.asset.findMany({
    where: query
      ? {
          OR: [
            { code: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { serialNumber: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      category: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
      custodian: {
        select: { id: true, employeeCode: true, name: true, department: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { code: "asc" }],
    take: 200,
  });

  return c.json(assets);
});

app.get("/api/categories", async (c) => {
  const categories = await db.category.findMany({
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { name: "asc" },
  });

  return c.json(categories);
});

app.get("/api/locations", async (c) => {
  const locations = await db.location.findMany({
    include: {
      _count: { select: { assets: true } },
    },
    orderBy: { name: "asc" },
  });

  return c.json(locations);
});

app.onError((error, c) => {
  console.error(error);
  return c.json(
    {
      error: "INTERNAL_SERVER_ERROR",
      message: "Không thể xử lý yêu cầu lúc này.",
    },
    500,
  );
});

const port = Number(process.env.API_PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`QLTS API running at http://localhost:${info.port}`);
});
