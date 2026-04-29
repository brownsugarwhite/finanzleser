import { getAllAnbieter } from "@/lib/wordpress";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const anbieter = await getAllAnbieter();
    const items = anbieter
      .map((a) => ({ title: a.title, slug: a.slug }))
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    return NextResponse.json({ anbieter: items });
  } catch (error) {
    console.error("Error fetching anbieter:", error);
    return NextResponse.json({ error: "Failed to fetch anbieter" }, { status: 500 });
  }
}
