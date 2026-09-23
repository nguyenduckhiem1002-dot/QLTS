import { db } from "@/lib/db";
import { isDemoMode } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDemoMode()) {
    return Response.json({
      ok: true,
      service: "qlts",
      mode: "demo",
      database: "not-required",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    await db.$queryRaw`SELECT 1`;

    return Response.json({
      ok: true,
      service: "qlts",
      mode: "database",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      {
        ok: false,
        service: "qlts",
        mode: "database",
        database: "disconnected",
      },
      { status: 503 },
    );
  }
}
