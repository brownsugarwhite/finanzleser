import { NextResponse } from "next/server";
import { getAllVergleiche } from "@/lib/wordpress";
import { decodeHtmlEntities } from "@/lib/html-utils";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

/** Alle Vergleiche für das Registerblatt (Finanztools · Vergleiche). Bestehender Getter, ISR-gecacht. */
export async function GET() {
  try {
    const vergleiche = await getAllVergleiche();
    const items = vergleiche
      .map((v) => ({ title: decodeHtmlEntities(v.title).replace(/\s*[–-]?\s*Vergleich$/i, "").trim(), slug: v.slug }))
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    return NextResponse.json({ items, total: items.length }, { headers: cacheHeaders(86400, 86400) });
  } catch (error) {
    console.error("[api/faden/vergleiche]", error);
    return NextResponse.json({ error: "Failed to fetch vergleiche" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
