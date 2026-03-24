import { getPostsByCategory } from "@/lib/wordpress";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Missing category parameter" }, { status: 400 });
  }

  try {
    const posts = await getPostsByCategory(category);
    // Return max 5 posts for megamenu
    return NextResponse.json(posts.slice(0, 5));
  } catch (error) {
    console.error("Error fetching megamenu posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
