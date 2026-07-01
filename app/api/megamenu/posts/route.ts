import { getMegamenuPostsByCategory } from "@/lib/wordpress";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Math.max(1, Math.min(20, Number(limitParam) || 3));

  if (!category) {
    return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
  }

  try {
    // Nur limit+1 Beiträge laden — der zusätzliche reicht, um hasMore zu
    // bestimmen. (Vorher wurde via getPostsByCategory die gesamte Kategorie
    // mit bis zu 100 Beiträgen nur für die Zählung geladen → langsam.)
    const fetched = await getMegamenuPostsByCategory(category, limit + 1);
    const hasMore = fetched.length > limit;
    const posts = fetched.slice(0, limit);
    return NextResponse.json(
      { posts, total: posts.length, hasMore },
      {
        headers: {
          // Leere Ergebnisse NICHT cachen — ein transienter WP-Aussetzer würde sonst bis 24h
          // (SWR) als „keine Beiträge" am Edge hängenbleiben.
          "Cache-Control": posts.length === 0 ? "no-store" : "public, s-maxage=3600, stale-while-revalidate=86400",
          // Netlify Edge variiert sonst NICHT nach ?category → alle Kategorien
          // bekämen denselben Cache-Eintrag (Bug: überall die gleichen 3 Posts).
          "Netlify-Vary": "query=category|limit",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching megamenu posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
