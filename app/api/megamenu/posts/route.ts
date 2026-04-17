import { getPostsByCategory, getMegamenuPostsByCategory } from "@/lib/wordpress";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
  }

  try {
    const [topPosts, allPosts] = await Promise.all([
      getMegamenuPostsByCategory(category, 3),
      getPostsByCategory(category),
    ]);
    return NextResponse.json({
      posts: topPosts,
      total: allPosts.length,
      hasMore: allPosts.length > 3,
    });
  } catch (error) {
    console.error("Error fetching megamenu posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
