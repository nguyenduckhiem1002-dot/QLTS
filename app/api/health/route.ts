import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;

    return Response.json({
      ok: true,
      service: "qlts",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        ok: false,
        service: "qlts",
        database: "disconnected",
      },
      { status: 503 },
    );
  }
}
