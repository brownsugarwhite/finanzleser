import { NextRequest, NextResponse } from "next/server";
import { getLatestPostsByCategoryIds } from "@/lib/wordpress";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const catsParam = searchParams.get("cats") || "";
  const excludeSlug = searchParams.get("excludeSlug") || "";
  const limitParam = searchParams.get("limit");

  const categoryIds = catsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 20) : 10;

  if (categoryIds.length === 0) {
    return NextResponse.json({ posts: [] }, { headers: { "Cache-Control": "no-store" } });
  }

  const posts = await getLatestPostsByCategoryIds(categoryIds, limit + 1);
  const filtered = excludeSlug ? posts.filter((p) => p.slug !== excludeSlug) : posts;
  const result = filtered.slice(0, limit);
  return NextResponse.json(
    { posts: result },
    {
      // Edge-Cache pro Kategorie-Set/Slug → spart Function-Compute pro Artikelaufruf.
      headers: {
        "Cache-Control": result.length === 0 ? "no-store" : "public, s-maxage=3600, stale-while-revalidate=86400",
        "Netlify-Vary": "query=cats|excludeSlug|limit",
      },
    },
  );
}
