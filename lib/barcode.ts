import bwipjs from "@bwip-js/node";

// Code128 SVG for asset labels. Returns null when the text cannot be encoded.
export function code128Svg(text: string) {
  try {
    return bwipjs.toSVG({
      bcid: "code128",
      text,
      scale: 2,
      height: 12,
      includetext: true,
      textxalign: "center",
      backgroundcolor: "FFFFFF",
    });
  } catch {
    return null;
  }
}

export function svgResponse(svg: string | null) {
  if (!svg) return new Response("Invalid barcode", { status: 422 });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, max-age=300",
    },
  });
}
