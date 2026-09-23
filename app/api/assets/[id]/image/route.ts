import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
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

  if (isDemoMode()) {
    return new Response("No demo image", { status: 404 });
  }

  const { id } = await params;
  const image = await db.assetImage.findUnique({
    where: { assetId: id },
    select: {
      data: true,
      mimeType: true,
      fileName: true,
      updatedAt: true,
    },
  });

  if (!image) {
    return new Response("Image not found", { status: 404 });
  }

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(image.fileName)}"`,
      "Cache-Control": "private, max-age=300",
      "Last-Modified": image.updatedAt.toUTCString(),
    },
  });
}
