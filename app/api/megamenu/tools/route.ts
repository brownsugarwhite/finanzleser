import { getPostsAndCPTsByCategory } from "@/lib/wordpress";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "category parameter required" }, { status: 400 });
    }

    // Fetch tools (posts + CPTs) by category and limit to 3
    const tools = await getPostsAndCPTsByCategory(category);

    return NextResponse.json(tools.slice(0, 3));
  } catch (error) {
    console.error("Error fetching megamenu tools:", error);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
