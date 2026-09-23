import bwipjs from "@bwip-js/node";
import { getCurrentUser } from "@/lib/auth/session";
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

  const barcode = asset.barcode || asset.code;

  try {
    const svg = bwipjs.toSVG({
      bcid: "code128",
      text: barcode,
      scale: 2,
      height: 12,
      includetext: true,
      textxalign: "center",
      backgroundcolor: "FFFFFF",
    });

    return new Response(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("Invalid barcode", { status: 422 });
  }
}
