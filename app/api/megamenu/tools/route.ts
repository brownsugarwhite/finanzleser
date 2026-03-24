import { getToolsBySlug } from "@/lib/wordpress";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const slugsParam = searchParams.get("slugs");

    if (!slugsParam) {
      return NextResponse.json({ error: "slugs parameter required" }, { status: 400 });
    }

    const slugs = slugsParam.split(",").filter(Boolean);
    const tools = await getToolsBySlug(slugs);

    return NextResponse.json(tools);
  } catch (error) {
    console.error("Error fetching megamenu tools:", error);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
