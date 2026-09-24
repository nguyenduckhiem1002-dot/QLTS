import { getCurrentUser } from "@/lib/auth/session";
import { code128Svg, svgResponse } from "@/lib/barcode";
import { db } from "@/lib/db";
import { demoAssets } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/runtime";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  const asset = isDemoMode()
    ? demoAssets.find((item) => item.id === id)
    : await db.asset.findUnique({
        where: { id },
        select: { code: true, barcode: true },
      });

  if (!asset) {
    return new Response("Asset not found", { status: 404 });
  }

  return svgResponse(code128Svg(asset.barcode || asset.code));
}
