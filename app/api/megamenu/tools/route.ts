import { getMegamenuToolsByCategory } from "@/lib/wordpress";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { cacheHeaders } from "@/lib/httpCache";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json({ error: "category parameter required" }, { status: 400 });
    }

    // Die 3 neuesten Finanztools, die in den Beiträgen dieser Subkategorie eingebaut sind.
    const tools = await getMegamenuToolsByCategory(category);

    return NextResponse.json(tools, {
      headers: {
        // Leeres Ergebnis nicht cachen (transienter Aussetzer würde sonst lange hängen).
        ...(tools.length === 0 ? { "Cache-Control": "no-store" } : cacheHeaders(3600, 3600)),
        // Edge-Cache pro Kategorie variieren (sonst überall dieselben Tools).
        "Netlify-Vary": "query=category",
      },
    });
  } catch (error) {
    console.error("Error fetching megamenu tools:", error);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
