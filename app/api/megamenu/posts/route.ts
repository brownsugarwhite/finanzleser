import { getPostsByCategory } from "@/lib/wordpress";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
  }

  try {
    const posts = await getPostsByCategory(category);
    const topPosts = posts.slice(0, 5);
    // Return max 5 posts + total count for megamenu
    return NextResponse.json({
      posts: topPosts,
      total: posts.length,
      hasMore: posts.length > 5,
    });
  } catch (error) {
    console.error("Error fetching megamenu posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
