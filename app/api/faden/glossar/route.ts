import { NextResponse } from "next/server";
import { getAllGlossar } from "@/lib/wordpress";
import { begriffZeile } from "@/lib/faden/glossar";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

/** Nachschlagewerk im Registerblatt: alle Begriffe als schlanke Zeilen (A–Z, Suche). ISR-gecacht. */
export async function GET() {
  try {
    const alle = await getAllGlossar();
    const items = alle.map(begriffZeile);
    return NextResponse.json({ items, total: items.length }, { headers: cacheHeaders(86400, 86400) });
  } catch (error) {
    console.error("[api/faden/glossar]", error);
    return NextResponse.json({ error: "Failed to fetch glossar" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
