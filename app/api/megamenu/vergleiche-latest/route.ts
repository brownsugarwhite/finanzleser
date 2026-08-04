import { getLatestVergleiche, getAllVergleiche } from "@/lib/wordpress";
import { NextRequest, NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/httpCache";

export async function GET(request: NextRequest) {
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.max(1, Math.min(20, Number(limitParam) || 10));

  try {
    const [latest, all] = await Promise.all([
      getLatestVergleiche(limit),
      getAllVergleiche(),
    ]);
    return NextResponse.json(
      {
        vergleiche: latest,
        total: all.length,
        hasMore: all.length > limit,
      },
      {
        headers: {
          ...(latest.length === 0 ? { "Cache-Control": "no-store" } : cacheHeaders(3600, 3600)),
          "Netlify-Vary": "query=limit",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching latest vergleiche:", error);
    return NextResponse.json({ error: "Failed to fetch vergleiche" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
