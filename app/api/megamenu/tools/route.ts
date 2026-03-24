import { getAllRechner } from "@/lib/wordpress";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const tools = await getAllRechner();
    // Return max 3 tools for megamenu
    return NextResponse.json(tools.slice(0, 3));
  } catch (error) {
    console.error("Error fetching megamenu tools:", error);
    return NextResponse.json({ error: "Failed to fetch tools" }, { status: 500 });
  }
}
