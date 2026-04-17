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
    return NextResponse.json({ posts: [] });
  }

  const posts = await getLatestPostsByCategoryIds(categoryIds, limit + 1);
  const filtered = excludeSlug ? posts.filter((p) => p.slug !== excludeSlug) : posts;
  return NextResponse.json({ posts: filtered.slice(0, limit) });
}
