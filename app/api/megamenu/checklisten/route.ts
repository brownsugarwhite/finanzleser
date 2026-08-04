import { getAllChecklisten } from "@/lib/wordpress";
import { NextResponse } from "next/server";
import { cacheHeaders } from "@/lib/httpCache";

export async function GET() {
  try {
    const checklisten = await getAllChecklisten();
    const items = checklisten
      .map((c) => ({ title: c.title, slug: c.slug }))
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    return NextResponse.json(
      { checklisten: items },
      { headers: items.length === 0 ? { "Cache-Control": "no-store" } : cacheHeaders(3600, 3600) },
    );
  } catch (error) {
    console.error("Error fetching checklisten:", error);
    return NextResponse.json({ error: "Failed to fetch checklisten" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
