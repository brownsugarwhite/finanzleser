import { NextResponse } from "next/server";
import { buildFadenIndex } from "@/lib/faden/index";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

/** Der Bestand als Index für die Sprungleiste (Typeahead in der Eingabe). ISR-gecacht. */
export async function GET() {
  try {
    const items = await buildFadenIndex();
    return NextResponse.json({ items, total: items.length }, { headers: cacheHeaders(86400, 86400) });
  } catch (error) {
    console.error("[api/faden/index]", error);
    return NextResponse.json({ error: "Failed to build index" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
