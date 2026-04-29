import { getAllChecklisten } from "@/lib/wordpress";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const checklisten = await getAllChecklisten();
    const items = checklisten
      .map((c) => ({ title: c.title, slug: c.slug }))
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    return NextResponse.json({ checklisten: items });
  } catch (error) {
    console.error("Error fetching checklisten:", error);
    return NextResponse.json({ error: "Failed to fetch checklisten" }, { status: 500 });
  }
}
