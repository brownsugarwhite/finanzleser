import { getAllRechner } from "@/lib/wordpress";
import { TYP_ORDER } from "@/lib/rechnerCategories";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const rechner = await getAllRechner();

    const grouped: Record<string, { title: string; slug: string }[]> = {};
    for (const r of rechner) {
      const rawTyp = r.rechnerFelder?.rechnerTyp;
      const typ = Array.isArray(rawTyp) ? rawTyp[0] : rawTyp || "sonstige";
      if (!grouped[typ]) grouped[typ] = [];
      grouped[typ].push({ title: r.title, slug: r.slug });
    }

    for (const list of Object.values(grouped)) {
      list.sort((a, b) => a.title.localeCompare(b.title, "de"));
    }

    const sortedTypes = [
      ...TYP_ORDER.filter((t) => grouped[t]),
      ...Object.keys(grouped).filter((t) => !TYP_ORDER.includes(t)),
    ];

    return NextResponse.json({
      groups: sortedTypes.map((typ) => ({
        typ,
        items: grouped[typ],
      })),
    });
  } catch (error) {
    console.error("Error fetching rechner grouped:", error);
    return NextResponse.json({ error: "Failed to fetch rechner" }, { status: 500 });
  }
}
