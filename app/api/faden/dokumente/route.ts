import { NextResponse } from "next/server";
import { getAllDokumente } from "@/lib/wordpress";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

/** Dokumentliste für das Registerblatt (Service · Dokumente). Bestehender Getter, ISR-gecacht. */
export async function GET() {
  try {
    const dokumente = await getAllDokumente();
    const items = dokumente
      .map((d) => ({ title: d.title, slug: d.slug, kategorie: d.dokumentKategorien?.nodes?.[0]?.name || "" }))
      .sort((a, b) => a.title.localeCompare(b.title, "de"));
    return NextResponse.json({ items, total: items.length }, { headers: cacheHeaders(86400, 86400) });
  } catch (error) {
    console.error("[api/faden/dokumente]", error);
    return NextResponse.json({ error: "Failed to fetch dokumente" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
