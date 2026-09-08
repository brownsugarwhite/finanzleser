import { NextResponse } from "next/server";
import { getGlossarBySlug } from "@/lib/wordpress";
import { loeseBegriff } from "@/lib/faden/glossar";
import { cacheHeaders } from "@/lib/httpCache";

export const revalidate = 86400;

/** Ein Begriff mit aufgelösten Verweisen (Ratgeber, Werkzeug) für Klickmenü, Sitzungsleiste, Nachschlagewerk. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const e = await getGlossarBySlug(slug);
    if (!e) return NextResponse.json({ error: "Unbekannter Begriff" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(await loeseBegriff(e), { headers: cacheHeaders(86400, 86400) });
  } catch (error) {
    console.error("[api/faden/glossar/slug]", error);
    return NextResponse.json({ error: "Failed to fetch begriff" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
