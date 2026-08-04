import { getAllAnbieter } from "@/lib/wordpress";
import { NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/httpCache";

export async function GET() {
  try {
    const anbieter = await getAllAnbieter();
    const items = anbieter
      .map((a) => ({ title: a.title, slug: a.slug }))
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    return NextResponse.json(
      { anbieter: items },
      {
        // Edge-Cache 1h (SWR 24h) → spart Function-Compute pro User. Leeres Ergebnis
        // NICHT cachen (transienter Aussetzer würde sonst lange hängen).
        headers: items.length === 0 ? { "Cache-Control": "no-store" } : cacheHeaders(3600, 3600),
      },
    );
  } catch (error) {
    console.error("Error fetching anbieter:", error);
    return NextResponse.json({ error: "Failed to fetch anbieter" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
