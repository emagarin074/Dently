import { SVG_ICONS } from "./svgs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;

  const svgString = SVG_ICONS[name];

  if (!svgString) {
    return new Response("Icon not found", { status: 404 });
  }

  return new Response(svgString, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
