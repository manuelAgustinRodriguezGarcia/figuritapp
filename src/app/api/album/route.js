import { NextResponse } from "next/server";
import { generateAlbum } from "@/data/generateAlbum";
import { validateAlbum } from "@/utils/validateAlbum";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const album = validateAlbum(generateAlbum());
  return NextResponse.json(album, {
    headers: {
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
