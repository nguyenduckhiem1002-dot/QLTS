import { getCurrentUser } from "@/lib/auth/session";
import { code128Svg, svgResponse } from "@/lib/barcode";

// Live preview for the asset form, before the asset exists.
export async function GET(request: Request) {
  if (!(await getCurrentUser())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const text = new URL(request.url).searchParams.get("text")?.trim() ?? "";
  if (!text || text.length > 80) {
    return new Response("Invalid barcode", { status: 422 });
  }

  return svgResponse(code128Svg(text));
}
