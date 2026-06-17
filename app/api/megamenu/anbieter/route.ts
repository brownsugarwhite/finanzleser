import { getAllAnbieter } from "@/lib/wordpress";
import { NextResponse } from "next/server";

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
        headers: { "Cache-Control": items.length === 0 ? "no-store" : "public, s-maxage=3600, stale-while-revalidate=86400" },
      },
    );
  } catch (error) {
    console.error("Error fetching anbieter:", error);
    return NextResponse.json({ error: "Failed to fetch anbieter" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
