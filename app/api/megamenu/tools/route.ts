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

    return NextResponse.json(tools.slice(0, 3), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        // Edge-Cache pro Kategorie variieren (sonst überall dieselben Tools).
        "Netlify-Vary": "query=category",
      },
    });
  } catch (error) {
    console.error("Error fetching megamenu tools:", error);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
